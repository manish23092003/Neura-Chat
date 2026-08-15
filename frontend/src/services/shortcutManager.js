/**
 * shortcutManager.js
 *
 * Configurable hotkey engine for NeuraChat 2.0.
 * Binds key combinations (e.g. "Ctrl+Shift+P", "Ctrl+P", "F5", "Ctrl+S")
 * directly to command IDs registered in commandRegistry.
 */

import { commandRegistry } from './commandRegistry'

class ShortcutManager {
    constructor() {
        this.keymap = new Map([
            ['ctrl+shift+p', 'ide.commandPalette'],
            ['meta+shift+p', 'ide.commandPalette'],
            ['ctrl+p', 'ide.quickOpen'],
            ['meta+p', 'ide.quickOpen'],
            ['ctrl+s', 'editor.save'],
            ['meta+s', 'editor.save'],
            ['f5', 'runtime.run'],
            ['shift+f5', 'runtime.stop'],
            ['alt+shift+f', 'editor.format'],
            ['ctrl+b', 'sidebar.toggle'],
            ['meta+b', 'sidebar.toggle'],
            ['ctrl+l', 'ai.toggle'],
            ['meta+l', 'ai.toggle'],
        ])
    }

    /**
     * Normalize key event into standard combo string (e.g. "ctrl+shift+p")
     */
    getComboFromEvent(e) {
        const parts = []
        if (e.ctrlKey) parts.push('ctrl')
        if (e.metaKey) parts.push('meta')
        if (e.altKey) parts.push('alt')
        if (e.shiftKey) parts.push('shift')

        const key = e.key.toLowerCase()
        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            parts.push(key)
        }
        return parts.join('+')
    }

    /**
     * Handle keydown event
     */
    handleKeyDown(e) {
        const combo = this.getComboFromEvent(e)
        const commandId = this.keymap.get(combo)

        if (commandId) {
            e.preventDefault()
            e.stopPropagation()
            commandRegistry.execute(commandId)
            return true
        }
        return false
    }

    /**
     * Set a custom shortcut for a command ID
     */
    setShortcut(combo, commandId) {
        this.keymap.set(combo.toLowerCase(), commandId)
    }

    /**
     * Get shortcut string for a command ID
     */
    getShortcutForCommand(commandId) {
        for (const [combo, cmdId] of this.keymap.entries()) {
            if (cmdId === commandId) {
                return combo
                    .split('+')
                    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
                    .join(' + ')
            }
        }
        return null
    }
}

export const shortcutManager = new ShortcutManager()
