import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const key = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(key);

async function listModels() {
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy init to access client? No, need direct list if possible or just try-catch standard ones.
        // Actually the SDK doesn't expose listModels directly on the main class in older versions, 
        // but deeper check:
        // simpler method: Try to just print what the error says or standard supported ones.
        // Let's rely on node_modules check or just try a known working one like 'gemini-1.0-pro' if 'gemini-pro' fails.

        // Better approach: create a script that tries basic generation with multiple model names to see which one works.

        const candidates = ["gemini-pro", "gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro-vision"];

        for (const modelName of candidates) {
            console.log(`Testing model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`SUCCESS: ${modelName} worked! Response: ${result.response.text()}`);
                break; // Found one
            } catch (e) {
                console.log(`FAILED: ${modelName} - ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
