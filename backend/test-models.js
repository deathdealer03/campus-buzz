const https = require('https');
require('dotenv').config();

const API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
const url = `https://api.openai.com/v1/models`;

const options = {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${API_KEY}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.data && Array.isArray(parsed.data)) {
                console.log("Successfully connected to OpenAI!");
                console.log("Available OpenAI models (showing first 10):");
                parsed.data.slice(0, 10).forEach(m => console.log("- " + m.id));
            } else {
                console.log("Response:", data);
            }
        } catch(e) {
            console.log("Error parsing:", data);
        }
    });
}).on('error', err => console.log("Connection error:", err));

