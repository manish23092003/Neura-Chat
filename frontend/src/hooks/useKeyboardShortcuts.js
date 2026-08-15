import { useEffect } from 'react'
import { shortcutManager } from '../services/shortcutManager'

/**
 * useKeyboardShortcuts
 *
 * Attaches global listener for keyboard shortcuts bound in shortcutManager.
 */
export function useKeyboardShortcuts() {
    useEffect(() => {
        const listener = (e) => {
            shortcutManager.handleKeyDown(e)
        }
        window.addEventListener('keydown', listener, true)
        return () => window.removeEventListener('keydown', listener, true)
    }, [])
}
export default useKeyboardShortcuts
