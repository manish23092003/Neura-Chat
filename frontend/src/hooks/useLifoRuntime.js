import { useState, useRef, useCallback, useMemo } from 'react'
import { getLifoSandbox, runLifoProject } from '../config/lifoRuntime'
import { measureRuntimeStartup, measureProjectGeneration } from '../utils/performance'
import toast from 'react-hot-toast'

/**
 * Log levels for structured terminal entries.
 */
const LOG_LEVELS = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
}

/**
 * Log sources for identifying origin.
 */
const LOG_SOURCES = {
    LIFO: 'lifo',
    RUNTIME: 'runtime',
    AI: 'ai',
    SYSTEM: 'system',
}

/**
 * Auto-detect log level from text content.
 */
const detectLogLevel = (text) => {
    if (!text || typeof text !== 'string') return LOG_LEVELS.INFO

    if (
        text.includes('Error:') ||
        text.includes('SyntaxError:') ||
        text.includes('ReferenceError:') ||
        text.includes('TypeError:') ||
        text.includes('Cannot find module') ||
        text.includes('npm ERR!') ||
        text.includes('UNSUPPORTED') ||
        text.includes('Failed') ||
        text.includes('ENOENT') ||
        text.includes('FATAL')
    ) {
        return LOG_LEVELS.ERROR
    }

    if (
        text.includes('Warning:') ||
        text.includes('WARN') ||
        text.includes('⚠️') ||
        text.includes('Deprecation') ||
        text.includes('deprecated')
    ) {
        return LOG_LEVELS.WARNING
    }

    if (
        text.includes('✓') ||
        text.includes('Success') ||
        text.includes('Ready!') ||
        text.includes('listening on') ||
        text.includes('compiled') ||
        text.includes('Built in') ||
        text.includes('started')
    ) {
        return LOG_LEVELS.SUCCESS
    }

    return LOG_LEVELS.INFO
}

/**
 * Extract file/line/column from an error string.
 *   Matches patterns like: app.js:24:12 or ./src/App.jsx:10
 */
const extractFileLocation = (text) => {
    if (!text || typeof text !== 'string') return {}
    const match = text.match(/([a-zA-Z0-9_\-/.]+\.(jsx?|tsx?|html|css|json|py|vue|svelte))(?::(\d+))?(?::(\d+))?/)
    if (!match) return {}
    return {
        file: match[1] || null,
        line: match[3] ? parseInt(match[3], 10) : null,
        column: match[4] ? parseInt(match[4], 10) : null,
    }
}

let _logIdCounter = 0

/**
 * Create a structured log entry.
 */
const createLogEntry = (text, source = LOG_SOURCES.RUNTIME) => {
    const level = detectLogLevel(text)
    const location = level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARNING
        ? extractFileLocation(text)
        : {}

    return {
        id: ++_logIdCounter,
        text: String(text),
        timestamp: Date.now(),
        level,
        source,
        file: location.file || null,
        line: location.line || null,
        column: location.column || null,
    }
}

// Maximum number of log entries to retain in memory
const MAX_LOG_ENTRIES = 2000

/**
 * useLifoRuntime
 *
 * Encapsulates Lifo sandbox initialization and project execution.
 * Reuses the same sandbox instance across runs; only re-boots when necessary.
 *
 * Now stores logs as structured objects for filtering, timestamps, and
 * error navigation. Maintains backward-compatible `terminalOutput` string.
 *
 * @param {string} projectId — used to scope the sandbox instance
 */
const useLifoRuntime = (projectId) => {
    const [isRunning, setIsRunning] = useState(false)
    const [runtimeStatus, setRuntimeStatus] = useState('Idle')
    const [logs, setLogs] = useState([])       // structured log entries
    const [iframeUrl, setIframeUrl] = useState(null)
    const [previewsList, setPreviewsList] = useState([])

    const sandboxRef = useRef(null)

    /**
     * Append structured log entries from raw text.
     * Splits multi-line text into individual log entries.
     */
    const appendLog = useCallback((text, source = LOG_SOURCES.RUNTIME) => {
        if (!text) return
        const textStr = String(text)
        const lines = textStr.split('\n')

        const newEntries = lines
            .filter(line => line.length > 0)    // skip empty lines
            .map(line => createLogEntry(line, source))

        if (newEntries.length === 0) return

        setLogs(prev => {
            const combined = [...prev, ...newEntries]
            // Trim from the front if we exceed the cap
            if (combined.length > MAX_LOG_ENTRIES) {
                return combined.slice(combined.length - MAX_LOG_ENTRIES)
            }
            return combined
        })
    }, [])

    /**
     * Backward-compatible string accessor.
     * Consumers that still use `terminalOutput` as a string (e.g. LivePreview,
     * ErrorOverlay) get a joined plain-text representation.
     */
    const terminalOutput = useMemo(() => {
        if (logs.length === 0) return ''
        return logs.map(entry => entry.text).join('\n')
    }, [logs])

    /**
     * Get all runtime errors as structured objects.
     * Useful for AI agent integration and ErrorOverlay.
     */
    const getRuntimeErrors = useCallback(() => {
        return logs.filter(entry => entry.level === LOG_LEVELS.ERROR)
    }, [logs])

    /**
     * Get all runtime warnings.
     */
    const getRuntimeWarnings = useCallback(() => {
        return logs.filter(entry => entry.level === LOG_LEVELS.WARNING)
    }, [logs])

    /**
     * Boot (or reuse) the Lifo sandbox and execute the project.
     * @param {object} fileTree — current project file tree
     */
    const runProject = useCallback(async (fileTree) => {
        if (isRunning) return // prevent double-run

        setIsRunning(true)
        setLogs([])
        setIframeUrl(null)

        const bootStart = performance.now()

        try {
            // Initialize sandbox (reuses existing instance if available)
            let sandbox = sandboxRef.current
            if (!sandbox) {
                toast.loading('Starting preview environment…', { id: 'runtime-boot' })
                try {
                    sandbox = await getLifoSandbox(projectId)
                    sandboxRef.current = sandbox
                    measureRuntimeStartup(bootStart, 'Runtime Boot')
                    toast.success('Environment Ready!', { id: 'runtime-boot' })
                } catch (e) {
                    toast.error('Failed to initialize runtime environment', { id: 'runtime-boot' })
                    setRuntimeStatus('Failed')
                    return
                }
            }

            const runStart = performance.now()
            const result = await runLifoProject({
                sandbox,
                fileTree,
                onStatusChange: setRuntimeStatus,
                onLog: appendLog,
            })
            measureProjectGeneration(runStart)

            if (result.success && result.previewUrl) {
                setIframeUrl(result.previewUrl)
                setPreviewsList(result.previews || [])
                toast.success('Preview ready! 🚀')
            } else if (result.reason === 'unsupported_native') {
                toast.error('Native binary dependencies detected (see console).')
            } else {
                toast.error(result.message || 'Execution completed with warnings.')
            }
        } catch (error) {
            setRuntimeStatus('Failed')
            appendLog(`Execution Error: ${error.message || String(error)}`, LOG_SOURCES.SYSTEM)
            toast.error(`Execution note: ${error.message || 'Check console output'}`)
        } finally {
            setIsRunning(false)
        }
    }, [projectId, isRunning, appendLog])

    /**
     * Clear the terminal logs.
     */
    const clearTerminal = useCallback(() => setLogs([]), [])

    return {
        isRunning,
        runtimeStatus,
        terminalOutput,     // backward-compatible string
        logs,               // structured log entries
        iframeUrl,
        setIframeUrl,
        previewsList,
        setPreviewsList,
        runProject,
        clearTerminal,
        getRuntimeErrors,
        getRuntimeWarnings,
        appendLog,          // exposed for external sources (AI, system)
    }
}

export { LOG_LEVELS, LOG_SOURCES, createLogEntry }
export default useLifoRuntime
