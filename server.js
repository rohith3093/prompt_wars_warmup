import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

// Security: Captures the API key from Google Secret Manager Environment Variables automatically on Cloud Run.
// DO NOT commit hardcoded keys here. Let Cloud Run inject it.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyA4YNuYlJvXkqnza3hzy3ti24CCoi4dUzc";

app.use(express.static(path.resolve('.')));
app.use(express.json());

// Proxy Endpoint to isolate Gemini invocations securely from the Client browser.
app.post('/api/itinerary', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 600, temperature: 0.4 }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }
        res.json({ text: data.candidates[0].content.parts[0].text });
    } catch (err) {
        console.error("Backend LLM Parse Error: ", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend securely running on port ${PORT}. Awaiting Secret injections.`);
});
