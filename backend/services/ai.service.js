import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from 'fs'
import path from 'path'


export const generateResult = async (prompt, fileContext) => {
    const key = process.env.GOOGLE_API_KEY;
    console.log("DEBUG: Using API Key:", key ? "..." + key.slice(-5) : "UNDEFINED");

    if (!key) {
        throw new Error("Google API Key is missing");
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-lite-latest",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
        },
        systemInstruction: `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
    
    Examples: 
 

    <example>
 
    response: {
        "text": "this is you fileTree structure of the express server",
        "fileTree": {
            "app.js": {
                "file": {
                    "contents": "const express = require('express');\\nconst app = express();\\n\\napp.get('/', (req, res) => {\\n  res.send('Hello World!');\\n});\\n\\napp.listen(3000, () => {\\n  console.log('Server is running on port 3000');\\n});"
                }
            },
            "package.json": {
                "file": {
                    "contents": "{\\n  \\"name\\": \\"hello-world\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"description\\": \\"\\",\\n  \\"main\\": \\"index.js\\",\\n  \\"scripts\\": {\\n    \\"test\\": \\"echo \\\\\\"Error: no test specified\\\\\\" && exit 1\\"\\n  },\\n  \\"keywords\\": [],\\n  \\"author\\": \\"\\",\\n  \\"license\\": \\"ISC\\"\\n}"
                }
            }
        }
    }

    </example>
    
   important note: 
   
    Return only valid JSON format, without any markdown formatting or extra text. ensure that fileTree is a valid JSON object.
    `
    });

    try {
        let fullPrompt = prompt

        // If file context is provided, prepend it to the prompt
        if (fileContext && fileContext.content) {
            fullPrompt = `Context from uploaded file "${fileContext.fileName}"(${fileContext.type}): \n\n${fileContext.content} \n\n-- -\n\nUser question: ${prompt} `
        } else if (fileContext && fileContext.message) {
            // File couldn't be read, inform the user
            return JSON.stringify({
                text: fileContext.message
            })
        }

        // Retry logic for 429/503 errors
        let retries = 5;
        let delay = 5000; // Start with 5 seconds for free tier

        for (let i = 0; i < retries; i++) {
            try {
                const result = await model.generateContent(fullPrompt);
                return result.response.text();
            } catch (error) {
                // If it's a rate limit (429) or temporary server error (503) and we have retries left
                if ((error.status === 429 || error.status === 503) && i < retries - 1) {
                    console.log(`⚠️ AI Rate limit/Busy (${error.status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 1.5; // Exponential backoff: 5s -> 7.5s -> 11.25s
                } else {
                    throw error; // Throw if not retry-able or retries exhausted
                }
            }
        }
    } catch (error) {
        console.error('AI generation error:', error)
        throw error
    }
}

// Extract text content from various file types
export const extractFileContent = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase()
        const fileName = path.basename(filePath)

        // Text-based files
        const textExtensions = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx',
            '.css', '.html', '.xml', '.csv', '.log', '.py',
            '.java', '.c', '.cpp', '.h', '.go', '.rs', '.php']

        if (textExtensions.includes(ext)) {
            const content = fs.readFileSync(filePath, 'utf-8')
            return {
                fileName,
                content: content.substring(0, 50000), // Limit to 50k chars
                type: 'text'
            }
        }

        // Unsupported file type (PDFs not supported)
        return {
            fileName,
            content: null,
            type: 'unsupported',
            message: `File type ${ext} is not supported for AI analysis.Supported types: text files, code files, and PDFs.`
        }

    } catch (error) {
        console.error('Error extracting file content:', error)
        return {
            fileName: path.basename(filePath),
            content: null,
            type: 'error',
            message: `Error reading file: ${error.message} `
        }
    }
}