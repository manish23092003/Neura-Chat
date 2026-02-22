import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function listModels() {
    try {
        // For earlier versions of the SDK, listModels might not be directly available on genAI or might range differently.
        // But let's try the standard way first.
        // Note: The Node.js SDK doesn't always expose listModels directly on the main client in older versions, 
        // but 0.21.0 should have it via the ModelManager if accessible, or we might validly test by trying to instantiate.

        // Actually, looking at the docs, there isn't a simple listModels helper in the high-level client in some versions.
        // Use a basic fetch to the API to be sure, or try-catch multiple logic.

        // Using fetch directly to be safe and avoid SDK nuances for listing.
        const key = process.env.GOOGLE_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("Failed to list models:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
