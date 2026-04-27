const https = require('https');

const SYSTEM_PROMPT = `You are CampusBot, an intelligent assistant for CampusBuzz — a college platform for UPES Dehradun. You help students with questions about clubs, events, hackathons, research, alumni, placements, CV building, announcements, and general campus life. Answer only campus-related questions in a friendly, helpful tone. Keep answers concise and clear.`;

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
        req.setTimeout(60000, () => {
            req.destroy(new Error('Request timed out'));
        });
        req.write(bodyStr);
        req.end();
    });
}

exports.handleChat = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
            return res.status(500).json({ success: false, message: 'Gemini API key is missing. Please check .env' });
        }

        let validHistory = history || [];
        
        // Build contents for Gemini API format
        const contents = [];
        for (const msg of validHistory) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model', // Map assistant to model
                parts: [{ text: msg.content }]
            });
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        const payload = {
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        };

        const model = 'gemini-2.5-flash'; // Match primary free-tier model from study buddy config
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

        const result = await httpsPost(geminiUrl, payload);

        if (result.status === 200) {
            const aiAnswer = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I got an empty response.';
            return res.json({ success: true, reply: aiAnswer });
        } else {
            const errMsg = result.data?.error?.message || 'Unknown error from Gemini';
            return res.status(result.status).json({ success: false, message: `Gemini Error: ${errMsg}` });
        }

    } catch (error) {
        console.error('Chatbot API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process chat request',
            error: error.message
        });
    }
};
