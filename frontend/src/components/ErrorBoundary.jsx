import React, { Component } from 'react'

/**
 * ErrorBoundary Component
 *
 * Catches any unhandled React rendering errors and displays a helpful recovery UI
 * instead of leaving the user with a blank or black screen.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught exception:', error, errorInfo)
        this.setState({ errorInfo })
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen bg-[#07070b] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
                    <div className="max-w-lg w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 mx-auto rounded-xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center">
                            <i className="ri-error-warning-fill text-2xl" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-100">IDE Workspace Recovery</h2>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            An unexpected rendering error occurred. The IDE caught the exception to prevent application failure.
                        </p>
                        
                        {this.state.error && (
                            <pre className="p-3 rounded-lg bg-slate-950 text-red-400 font-mono text-[11px] text-left overflow-x-auto max-h-40 border border-slate-800 break-all whitespace-pre-wrap">
                                {this.state.error.toString()}
                            </pre>
                        )}

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => window.location.href = '/home'}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-lg flex items-center gap-1.5"
                            >
                                <i className="ri-refresh-line" />
                                Reload IDE Workspace
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
