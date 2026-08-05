import { useState, useRef, useCallback } from 'react'
import { getLifoSandbox, runLifoProject } from '../config/lifoRuntime'
import { measureRuntimeStartup, measureProjectGeneration } from '../utils/performance'
import toast from 'react-hot-toast'

/**
 * useLifoRuntime
 *
 * Encapsulates Lifo sandbox initialization and project execution.
 * Reuses the same sandbox instance across runs; only re-boots when necessary.
 *
 * @param {string} projectId — used to scope the sandbox instance
 */
const useLifoRuntime = (projectId) => {
    const [isRunning, setIsRunning] = useState(false)
    const [runtimeStatus, setRuntimeStatus] = useState('Idle')
    const [terminalOutput, setTerminalOutput] = useState('')
    const [iframeUrl, setIframeUrl] = useState(null)
    const [previewsList, setPreviewsList] = useState([])

    const sandboxRef = useRef(null)

    // Cap terminal output at ~50 KB to prevent unbounded string growth
    const MAX_TERMINAL_BYTES = 50_000

    const appendLog = useCallback((text) => {
        setTerminalOutput((prev) => {
            const next = prev + text
            // Trim from the start if we exceed the cap
            return next.length > MAX_TERMINAL_BYTES
                ? '…[output trimmed]…\n' + next.slice(next.length - MAX_TERMINAL_BYTES)
                : next
        })
    }, [])

    /**
     * Boot (or reuse) the Lifo sandbox and execute the project.
     * @param {object} fileTree — current project file tree
     */
    const runProject = useCallback(async (fileTree) => {
        if (isRunning) return // prevent double-run

        setIsRunning(true)
        setTerminalOutput('')
        setIframeUrl(null)

        const bootStart = performance.now()

        try {
            // Initialize sandbox (reuses existing instance if available)
            let sandbox = sandboxRef.current
            if (!sandbox) {
                toast.loading('Initializing Lifo.sh Runtime…', { id: 'lifo-boot' })
                try {
                    sandbox = await getLifoSandbox(projectId)
                    sandboxRef.current = sandbox
                    measureRuntimeStartup(bootStart, 'Lifo Boot')
                    toast.success('Lifo Sandbox Ready!', { id: 'lifo-boot' })
                } catch (e) {
                    toast.error('Failed to initialize Lifo sandbox', { id: 'lifo-boot' })
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
                toast.success('Application running in Lifo.sh preview!')
            } else if (result.reason === 'unsupported_native') {
                toast.error('Native binary dependencies detected (see console).')
            } else {
                toast.error(result.message || 'Execution completed with warnings.')
            }
        } catch (error) {
            setRuntimeStatus('Failed')
            appendLog(`\nExecution Error: ${error.message || String(error)}\n`)
            toast.error(`Execution note: ${error.message || 'Check console output'}`)
        } finally {
            setIsRunning(false)
        }
    }, [projectId, isRunning, appendLog])

    /**
     * Clear the terminal output log.
     */
    const clearTerminal = useCallback(() => setTerminalOutput(''), [])

    return {
        isRunning,
        runtimeStatus,
        terminalOutput,
        iframeUrl,
        setIframeUrl,
        previewsList,
        setPreviewsList,
        runProject,
        clearTerminal,
    }
}

export default useLifoRuntime
