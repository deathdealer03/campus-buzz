/**
 * Controller for AI CV Review Feature
 * Uses same Gemini model priority list as Study Buddy controller
 */
const https = require('https');

// Same working model list as studyBuddyController
const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
];

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
        req.write(bodyStr);
        req.end();
    });
}

const getAIReview = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured in backend' });
        }

        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        // Try each model in order until one succeeds
        for (const model of GEMINI_MODELS) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
            console.log(`[CV Review] Trying model: ${model}`);

            const result = await httpsPost(url, payload);
            console.log(`[CV Review] ${model} → status ${result.status}`);

            if (result.status === 200) {
                let raw = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                console.log('[CV Review] Raw text preview:', raw.substring(0, 200));

                // Strip markdown code fences
                raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

                // Extract JSON object with regex
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) raw = jsonMatch[0];

                try {
                    const parsed = JSON.parse(raw);
                    console.log(`[CV Review] Success with model ${model}`);
                    return res.json({ success: true, data: parsed });
                } catch (parseErr) {
                    console.error('[CV Review] JSON parse failed:', parseErr.message, 'Raw:', raw.substring(0, 300));
                    return res.status(500).json({
                        success: false,
                        message: 'AI returned an unexpected format. Please try again.'
                    });
                }
            }

            // 404 = model not found, 429 = quota — try next
            const errMsg = result.data?.error?.message || '';
            console.warn(`[CV Review] ${model} failed (${result.status}): ${errMsg}`);
        }

        return res.status(503).json({
            success: false,
            message: 'All Gemini models are currently unavailable. Please try again later.'
        });

    } catch (error) {
        console.error('[CV Review] Unexpected error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate CV review: ' + error.message
        });
    }
};

module.exports = { getAIReview };
