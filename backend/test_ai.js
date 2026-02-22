import 'dotenv/config';
import { generateResult } from './services/ai.service.js';

async function testAI() {
    console.log("Testing AI Service...");
    try {
        const result = await generateResult("Hello, create a simple hello world express server");
        console.log("--- SUCCESS ---");
        console.log("Raw Output type:", typeof result);
        console.log("Raw Output:", result);

        try {
            const parsed = JSON.parse(result);
            console.log("--- JSON PARSED SUCCESSFULLY ---");
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.error("--- JSON PARSING FAILED ---");
            console.error(e.message);
        }

    } catch (error) {
        console.error("--- ERROR ---");
        console.error(error);
    }
}

testAI();
