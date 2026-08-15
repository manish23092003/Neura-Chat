/**
 * aiProvider.js
 *
 * Abstract AI Provider Interface & Gemini Implementation.
 * Decouples AI agent orchestration from provider-specific APIs.
 */

import { GoogleGenAI } from '@google/genai'

/**
 * Base AIProvider Interface
 */
export class AIProvider {
    async generate(prompt, options = {}) {
        throw new Error('AIProvider.generate must be implemented by subclass')
    }

    async generateWithTools(prompt, tools = [], options = {}) {
        throw new Error('AIProvider.generateWithTools must be implemented by subclass')
    }
}

/**
 * GeminiProvider Implementation
 */
export class GeminiProvider extends AIProvider {
    constructor(apiKey = process.env.GEMINI_API_KEY) {
        super()
        this.ai = new GoogleGenAI({ apiKey })
    }

    async generate(prompt, options = {}) {
        const response = await this.ai.models.generateContent({
            model: options.model || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: options.systemInstruction,
                temperature: options.temperature ?? 0.2,
            },
        })
        return response.text
    }

    async generateWithTools(prompt, tools = [], options = {}) {
        const response = await this.ai.models.generateContent({
            model: options.model || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: options.systemInstruction,
                tools,
                temperature: options.temperature ?? 0.2,
            },
        })
        return response
    }
}

export const defaultAiProvider = new GeminiProvider()
