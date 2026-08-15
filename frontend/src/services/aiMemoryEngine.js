/**
 * aiMemoryEngine.js
 *
 * Structured AI Memory Engine for NeuraChat 2.0.
 * Instead of storing raw transcript text, it extracts and retains structured architecture details:
 * - Framework (React, Vue, Vite, Express, etc.)
 * - Key Components
 * - API Routes / Endpoints
 * - Installed Dependencies
 * - Database Schema / Architecture
 */

import { flattenFileTree } from '../config/lifoRuntime'

class AiMemoryEngine {
    /**
     * Extract structured project memory from a fileTree
     */
    extractMemory(fileTree) {
        const files = flattenFileTree(fileTree)
        const paths = files.map(f => f.path)

        // 1. Detect Framework
        let framework = 'React + Vite'
        const pkgFile = files.find(f => f.path === 'package.json')
        let dependencies = []

        if (pkgFile) {
            try {
                const pkg = JSON.parse(pkgFile.content)
                dependencies = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })
                if (dependencies.includes('next')) framework = 'Next.js'
                else if (dependencies.includes('express')) framework = 'Express.js'
                else if (dependencies.includes('vue')) framework = 'Vue.js'
            } catch (_) {}
        }

        // 2. Extract Components
        const components = paths
            .filter(p => p.includes('components/') || p.includes('views/'))
            .map(p => p.split('/').pop())

        // 3. Extract API Routes
        const routes = paths
            .filter(p => p.includes('routes/') || p.includes('api/'))
            .map(p => p.split('/').pop())

        return {
            framework,
            components,
            routes,
            dependencies,
            totalFiles: files.length,
            lastAnalyzed: new Date().toISOString(),
        }
    }

    /**
     * Build compact context prefix string for AI requests
     */
    buildContextPrefix(memory) {
        if (!memory) return ''
        return `[PROJECT CONTEXT: Framework: ${memory.framework} | Files: ${memory.totalFiles} | Components: ${memory.components.slice(0, 5).join(', ')}] `
    }
}

export const aiMemoryEngine = new AiMemoryEngine()
