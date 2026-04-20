/**
 * Study Buddy Controller
 * Handles PDF upload and AI-powered Q&A using the Gemini API.
 * The PDF is sent directly to Gemini as inline Base64 data,
 * so Gemini reads and understands the document natively —
 * no text extraction step needed.
 */

const multer = require('multer');
const https = require('https');

// ─── Multer: store uploaded PDF in memory ────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed.'), false);
        }
    },
});

// ─── Model selection ─────────────────────────────────────────────────────────
// ─── Gemini free-tier model priority list ────────────────────────────────────
// The controller tries each model in order. If one is quota-limited or
// unavailable it automatically moves to the next. All models below are
// available on the Gemini API free tier (AI Studio key required).
//  • gemini-2.5-flash      → latest, best quality, free tier (recommended)
//  • gemini-2.5-flash-lite → lighter, higher RPM, free tier
//  • gemini-2.0-flash      → previous gen, free tier
//  • gemini-1.5-flash      → older gen, free tier fallback
const GEMINI_FREE_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
];

// ─── Exponential backoff helper ───────────────────────────────────────────────
// Retries the async fn up to maxRetries times on 429 (quota) errors,
// waiting base * 2^attempt ms between retries (+ up to 1 s of jitter).
async function withBackoff(fn, maxRetries = 3, baseMs = 1000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await fn();
        if (result.status !== 429) return result;          // success or non-quota error
        if (attempt === maxRetries) return result;          // give up
        const wait = baseMs * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`[Study Buddy] 429 rate-limit — retrying in ${Math.round(wait)}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, wait));
    }
}


// ─── Helper: HTTPS POST ───────────────────────────────────────────────────────
function httpsPost(url, payload) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const bodyStr = JSON.stringify(payload);

        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { raw: data } });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.setTimeout(120000, () => {
            req.destroy(new Error('Request timed out after 120 seconds'));
        });
        req.write(bodyStr);
        req.end();
    });
}

// ─── POST /api/studybuddy/chat ────────────────────────────────────────────────
/**
 * Accepts: multipart/form-data
 *   - pdf      : PDF file (required)
 *   - question : string  (required)
 *   - history  : JSON string of { role, text }[] (optional)
 *
 * Returns: { success: true, data: { answer: string } }
 */
async function chat(req, res) {
    try {
        const { question, history } = req.body;
        const pdfFile = req.file;

        // ── Input validation ──────────────────────────────────────────────────
        if (!pdfFile) {
            return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
        }
        if (!question || !question.trim()) {
            return res.status(400).json({ success: false, message: 'Please provide a question.' });
        }

        // ── Parse conversation history ────────────────────────────────────────
        let conversationHistory = [];
        if (history) {
            try { conversationHistory = JSON.parse(history); } catch (_) {}
        }

        console.log('[Study Buddy] PDF size :', (pdfFile.size / 1024).toFixed(1), 'KB');
        console.log('[Study Buddy] Question :', question);
        console.log('[Study Buddy] History  :', conversationHistory.length, 'turn(s)');

        const systemPrompt = `You are an AI Study Buddy for college students. You have been given a PDF document (lecture notes, textbook chapter, or study material).

CRITICAL RULES:
1. Answer questions ONLY based on the content inside the provided PDF document.
2. If the answer is not found in the PDF, respond with: "I couldn't find information about that in your uploaded document. Try asking something related to the content in your notes."
3. Format your responses clearly — use bullet points, numbered lists, or headers when appropriate.
4. When explaining concepts, be thorough but student-friendly.
5. If asked to summarize, provide a comprehensive summary covering all key points from the document.
6. You may quote relevant passages from the document to support your answers.
7. Do NOT use any external knowledge beyond what is in the document.`;

        // ── Try Gemini first ──────────────────────────────────────────────────
        const geminiKey = process.env.GEMINI_API_KEY;
        const geminiAvailable = geminiKey && geminiKey !== 'your_gemini_api_key_here';

        if (geminiAvailable) {
            // Build Gemini contents once — PDF sent as Base64 inline data so
            // Gemini reads the document natively (no text extraction needed).
            const pdfBase64 = pdfFile.buffer.toString('base64');
            const contents = [];

            if (conversationHistory.length === 0) {
                contents.push({
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                        { text: question },
                    ],
                });
            } else {
                // Re-attach PDF on first historical turn for context retention
                contents.push({
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                        { text: conversationHistory[0].text },
                    ],
                });
                for (let i = 1; i < conversationHistory.length; i++) {
                    const msg = conversationHistory[i];
                    contents.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }],
                    });
                }
                contents.push({ role: 'user', parts: [{ text: question }] });
            }

            const geminiPayload = {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
            };

            // Try each free-tier model in priority order
            for (const model of GEMINI_FREE_MODELS) {
                console.log(`[Study Buddy] Trying Gemini model: ${model}...`);
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

                // withBackoff retries up to 3× on 429 rate-limit errors
                const geminiResult = await withBackoff(() => httpsPost(geminiUrl, geminiPayload));
                console.log(`[Study Buddy] ${model} → status ${geminiResult.status}`);

                if (geminiResult.status === 200) {
                    const aiAnswer =
                        geminiResult.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                        'Sorry, I was unable to generate a response. Please try rephrasing your question.';
                    console.log(`[Study Buddy] Answered by ${model}, length:`, aiAnswer.length);
                    return res.json({ success: true, data: { answer: aiAnswer, provider: `gemini/${model}` } });
                }

                // 429 = quota exhausted on this model → try next
                // 404 = model not available → try next
                // anything else = unknown error, still try next
                const errMsg = geminiResult.data?.error?.message || '';
                console.warn(`[Study Buddy] ${model} failed (${geminiResult.status}): ${errMsg}`);
            }

            // All Gemini models exhausted → fall through to OpenAI
            console.warn('[Study Buddy] All Gemini free-tier models failed. Falling back to OpenAI...');
        }


        // ── OpenAI fallback ───────────────────────────────────────────────────
        const openAiKey = process.env.OPENAI_API_KEY;
        if (!openAiKey) {
            return res.status(500).json({
                success: false,
                message: 'No AI provider is available. Configure GEMINI_API_KEY or OPENAI_API_KEY in your .env file.',
            });
        }

        // Extract PDF text for OpenAI (text-only model)
        const pdf = require('pdf-parse');
        let pdfText = '';
        try {
            const pdfData = await pdf(pdfFile.buffer);
            pdfText = pdfData.text;
        } catch (e) {
            return res.status(500).json({
                success: false,
                message: 'Failed to extract text from the uploaded PDF.',
                error: e.message,
            });
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: `Here is the extracted text from the user's PDF document:\n\n${pdfText}` },
        ];

        for (const msg of conversationHistory) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text,
            });
        }
        messages.push({ role: 'user', content: question });

        const openAiUrl = 'https://api.openai.com/v1/chat/completions';
        const openAiPayload = {
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.3,
            max_tokens: 4096,
        };

        console.log('[Study Buddy] Sending request to OpenAI (gpt-4o-mini)...');
        const openAiResult = await httpsPost(openAiUrl, openAiPayload, {
            'Authorization': `Bearer ${openAiKey}`,
        });
        console.log('[Study Buddy] OpenAI status:', openAiResult.status);

        if (openAiResult.status !== 200) {
            const aiError = openAiResult.data?.error?.message || 'Unknown error from OpenAI';
            return res.status(502).json({
                success: false,
                message: `AI error: ${aiError}`,
                ...(process.env.NODE_ENV !== 'production' && { error: openAiResult.data }),
            });
        }

        const aiAnswer =
            openAiResult.data?.choices?.[0]?.message?.content ||
            'Sorry, I was unable to generate a response. Please try rephrasing your question.';

        console.log('[Study Buddy] OpenAI answered, length:', aiAnswer.length);
        return res.json({ success: true, data: { answer: aiAnswer, provider: 'openai' } });

    } catch (error) {
        console.error('[Study Buddy] Unexpected error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred: ' + error.message,
            ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
        });
    }
}

module.exports = { upload, chat };
