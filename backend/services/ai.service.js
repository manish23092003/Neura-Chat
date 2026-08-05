import { GoogleGenerativeAI } from "@google/generative-ai"
import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'

// ── Model initialization ───────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Compact system instruction (~20 lines vs original ~104 lines).
 * Preserves all required behaviour while dramatically reducing token cost.
 */
const SYSTEM_INSTRUCTION = `You are a senior full-stack developer (10+ years). You always:
- Write modular, production-quality code with proper error handling
- Follow framework best practices and use idiomatic patterns
- Handle edge cases and validate inputs
- Add clear comments where logic is non-obvious

RESPONSE FORMAT (always return valid JSON):
{
  "text": "Short explanation of what you built/changed",
  "fileTree": {
    "filename.ext": { "file": { "contents": "..." } },
    "folder_name": { "directory": { "file.ext": { "file": { "contents": "..." } } } }
  },
  "buildCommand": { "mainItem": "npm", "commands": ["install"] },
  "startCommand": { "mainItem": "node", "commands": ["app.js"] }
}

RULES:
- fileTree keys are plain filenames/folder names (no paths like "routes/index.js")
- Always use { "directory": { ... } } for folders, never "type" or "children"
- For conversational replies with no code, just return: { "text": "your reply" }
- Escape all double-quotes inside file contents as \\\"
- Detect framework from context (React, Express, Vue, etc.) and use appropriate patterns
- Validate: check for missing imports, undefined variables, incorrect package.json scripts`;

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
    },
    systemInstruction: SYSTEM_INSTRUCTION,
});

// ── Prompt response cache ──────────────────────────────────────────────────
/**
 * Simple in-memory LRU-style cache for AI responses.
 * Key: SHA-256 of the full prompt.
 * TTL: 10 minutes — stale entries are evicted on access.
 * Max entries: 100 — oldest entries evicted when full.
 */
const CACHE_TTL_MS = 10 * 60 * 1000  // 10 minutes
const CACHE_MAX    = 100

const responseCache = new Map()

const getCacheKey = (prompt) => createHash('sha256').update(prompt).digest('hex')

const cacheGet = (key) => {
    const entry = responseCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
        responseCache.delete(key)
        return null
    }
    return entry.value
}

const cacheSet = (key, value) => {
    if (responseCache.size >= CACHE_MAX) {
        // Evict oldest entry
        const firstKey = responseCache.keys().next().value
        responseCache.delete(firstKey)
    }
    responseCache.set(key, { value, ts: Date.now() })
}

// ── File content extraction ────────────────────────────────────────────────
const TEXT_EXTENSIONS = new Set([
    '.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx',
    '.css', '.html', '.xml', '.csv', '.log', '.py',
    '.java', '.c', '.cpp', '.h', '.go', '.rs', '.php',
    '.sh', '.bash', '.yml', '.yaml', '.toml', '.env',
])

const MAX_FILE_CHARS = 50_000

/**
 * Extract text content from a file buffer or path.
 * Returns { fileName, content, type } or { fileName, content: null, type, message }
 */
export const extractFileContent = async (filePathOrBuffer, originalName = null, mimetype = null) => {
    try {
        let ext, fileName, content

        if (Buffer.isBuffer(filePathOrBuffer)) {
            if (!originalName) throw new Error("originalName is required when passing a buffer")
            ext = path.extname(originalName).toLowerCase()
            fileName = originalName

            if (TEXT_EXTENSIONS.has(ext) || mimetype?.startsWith('text/')) {
                content = filePathOrBuffer.toString('utf-8')
            } else {
                return { fileName, content: null, type: 'unsupported',
                    message: `File type ${ext} is not supported for AI analysis. Supported: text/code files.` }
            }
        } else {
            ext = path.extname(filePathOrBuffer).toLowerCase()
            fileName = path.basename(filePathOrBuffer)

            if (TEXT_EXTENSIONS.has(ext)) {
                content = fs.readFileSync(filePathOrBuffer, 'utf-8')
            } else {
                return { fileName, content: null, type: 'unsupported',
                    message: `File type ${ext} is not supported for AI analysis. Supported: text/code files.` }
            }
        }

        // Warn if file is large
        const truncated = content.length > MAX_FILE_CHARS
        return {
            fileName,
            content: truncated ? content.slice(0, MAX_FILE_CHARS) : content,
            type: 'text',
            truncated,
        }
    } catch (error) {
        return {
            fileName: originalName || (typeof filePathOrBuffer === 'string' ? path.basename(filePathOrBuffer) : 'file'),
            content: null,
            type: 'error',
            message: `Error reading file: ${error.message}`,
        }
    }
}

// ── Main generation function ───────────────────────────────────────────────
/**
 * Generate an AI response for the given prompt.
 * Results are cached by prompt hash for 10 minutes to avoid duplicate API calls.
 *
 * @param {string} prompt         - User's prompt text
 * @param {object|null} fileContext - Optional file context from extractFileContent()
 * @returns {Promise<string>}     - Raw AI response string (JSON)
 */
export const generateResult = async (prompt, fileContext = null) => {
    // Build the full prompt including any file context
    let fullPrompt = prompt.trim()

    if (fileContext?.content) {
        const truncNote = fileContext.truncated ? '\n[Note: file was truncated to 50,000 characters]' : ''
        fullPrompt = `Context from uploaded file "${fileContext.fileName}":\n\`\`\`\n${fileContext.content}${truncNote}\n\`\`\`\n\nUser request: ${prompt.trim()}`
    } else if (fileContext?.message) {
        return JSON.stringify({ text: fileContext.message })
    }

    // Check cache before making API call
    const cacheKey = getCacheKey(fullPrompt)
    const cached = cacheGet(cacheKey)
    if (cached) {
        console.info(`[AI Cache] Hit for key ${cacheKey.slice(0, 8)}…`)
        return cached
    }

    try {
        const result = await model.generateContent(fullPrompt)
        const response = result.response.text()
        // Cache the response
        cacheSet(cacheKey, response)
        return response
    } catch (error) {
        console.error('[AI] generateResult error:', error.message)
        throw error
    }
}