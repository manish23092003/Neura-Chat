import React, { memo, useState, useMemo } from 'react'

/**
 * ErrorOverlay Component
 *
 * Catches and displays structured runtime errors from terminal logs.
 * Provides a 1-click "Fix with AI" auto-recovery button.
 */
export const ErrorOverlay = memo(function ErrorOverlay({
    terminalOutput,
    onFixWithAi,
    onDismiss,
}) {
    const [showStackTrace, setShowStackTrace] = useState(false)

    // Parse terminal logs for error patterns
    const parsedError = useMemo(() => {
        if (!terminalOutput) return null
        const lines = terminalOutput.split('\n')
        const errorLine = lines.find(l =>
            l.includes('Error:') || l.includes('SyntaxError:') ||
            l.includes('ReferenceError:') || l.includes('TypeError:') ||
            l.includes('Cannot find module') || l.includes('npm ERR!')
        )

        if (!errorLine) return null

        // Try extracting file and line number
        const match = terminalOutput.match(/([a-zA-Z0-9_\-/.]+\.(jsx?|tsx?|html|css)):(\d+):?(\d+)?/)
        const file = match ? match[1] : null
        const line = match ? match[3] : null

        return {
            title: errorLine.trim(),
            file,
            line,
            rawLogs: terminalOutput,
        }
    }, [terminalOutput])

    if (!parsedError) return null

    return (
        <div className="p-4 rounded-xl border bg-red-950/90 border-red-800 text-red-100 shadow-2xl space-y-3 font-sans my-3">
            <div className="flex items-start justify-between gap-3 border-b border-red-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-900/80 text-red-300 flex items-center justify-center border border-red-700 shrink-0">
                        <i className="ri-bug-line text-lg" />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-red-200">Runtime Execution Error</h4>
                        {parsedError.file && (
                            <p className="text-[11px] font-mono text-red-300">
                                File: <span className="font-bold">{parsedError.file}</span> {parsedError.line ? `(Line ${parsedError.line})` : ''}
                            </p>
                        )}
                    </div>
                </div>

                {onDismiss && (
                    <button onClick={onDismiss} className="text-red-400 hover:text-red-200 text-xs">
                        <i className="ri-close-line text-base" />
                    </button>
                )}
            </div>

            {/* Error Message */}
            <p className="text-xs font-mono font-semibold bg-red-900/50 p-2.5 rounded-lg border border-red-800 break-all text-red-200">
                {parsedError.title}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
                <button
                    onClick={() => setShowStackTrace(p => !p)}
                    className="text-[11px] text-red-300 hover:text-white flex items-center gap-1 font-semibold"
                >
                    <i className={showStackTrace ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                    {showStackTrace ? 'Hide Stack Trace' : 'View Full Logs'}
                </button>

                {onFixWithAi && (
                    <button
                        onClick={() => onFixWithAi(parsedError)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 hover:scale-105"
                    >
                        <i className="ri-magic-line" />
                        Fix with AI
                    </button>
                )}
            </div>

            {/* Collapsible Stack Trace */}
            {showStackTrace && (
                <pre className="p-3 rounded-lg bg-slate-950 font-mono text-[10.5px] text-red-300 overflow-x-auto max-h-48 border border-red-900/60 leading-relaxed">
                    {parsedError.rawLogs}
                </pre>
            )}
        </div>
    )
})
