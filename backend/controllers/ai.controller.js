import * as ai from '../services/ai.service.js';

export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ error: 'Valid prompt parameter is required' });
        }

        if (prompt.length > 50000) {
            return res.status(400).json({ error: 'Prompt exceeds maximum allowed length of 50,000 characters' });
        }

        const result = await ai.generateResult(prompt);
        return res.status(200).send(result);
    } catch (error) {
        console.error('[AI Controller] generateResult error:', error.message);
        return res.status(500).json({ message: 'AI generation service temporarily unavailable. Please try again later.' });
    }
};