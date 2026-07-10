import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from 'fs'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
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
            file: {
                contents: "
                const express = require('express');

                const app = express();


                app.get('/', (req, res) => {
                    res.send('Hello World!');
                });


                app.listen(3000, () => {
                    console.log('Server is running on port 3000');
                })
                "
            
        },
    },

        "package.json": {
            file: {
                contents: "

                {
                    \\"name\\": \\"temp-server\\",
                    \\"version\\": \\"1.0.0\\",
                    \\"main\\": \\"index.js\\",
                    \\"scripts\\": {
                        \\"test\\": \\"echo \\\\\\\\\\"Error: no test specified\\\\\\\\\\" && exit 1\\"
                    },
                    \\"keywords\\": [],
                    \\"author\\": \\"\\",
                    \\"license\\": \\"ISC\\",
                    \\"description\\": \\"\\",
                    \\"dependencies\\": {
                        \\"express\\": \\"^4.21.2\\"
                    }
}

                
                "
                
                

            },

        },

    },
    "buildCommand": {
        mainItem: "npm",
            commands: [ "install" ]
    },

    "startCommand": {
        mainItem: "node",
            commands: [ "app.js" ]
    }
}

    user:Create an express application 
   
    </example>


    
       <example>

       user:Hello 
       response:{
       "text":"Hello, How can I help you today?"
       }
       
       
       </example>
    
 IMPORTANT : don't use file name like routes/index.js
       
       
    `
});

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
            message: `File type ${ext} is not supported for AI analysis. Supported types: text files, code files, and PDFs.`
        }

    } catch (error) {
        console.error('Error extracting file content:', error)
        return {
            fileName: path.basename(filePath),
            content: null,
            type: 'error',
            message: `Error reading file: ${error.message}`
        }
    }
}

export const generateResult = async (prompt, fileContext = null) => {
    try {
        let fullPrompt = prompt

        // If file context is provided, prepend it to the prompt
        if (fileContext && fileContext.content) {
            fullPrompt = `Context from uploaded file "${fileContext.fileName}" (${fileContext.type}):\n\n${fileContext.content}\n\n---\n\nUser question: ${prompt}`
        } else if (fileContext && fileContext.message) {
            // File couldn't be read, inform the user
            return JSON.stringify({
                text: fileContext.message
            })
        }

        const result = await model.generateContent(fullPrompt)
        return result.response.text()
    } catch (error) {
        console.error('AI generation error:', error)
        throw error
    }
}