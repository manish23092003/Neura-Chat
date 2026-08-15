/**
 * commandRegistry.js
 *
 * Global decoupled Command System for NeuraChat 2.0.
 * Features register commands dynamically. Supports search, categorization, and execution listeners.
 */

class CommandRegistry {
    constructor() {
        this.commands = new Map()
        this.listeners = new Set()
    }

    /**
     * Register a new command
     * @param {Object} cmd - { id, label, category, shortcut, icon, action }
     */
    register(cmd) {
        if (!cmd.id || !cmd.label || !cmd.action) {
            console.warn('[CommandRegistry] Invalid command definition:', cmd)
            return () => {}
        }
        this.commands.set(cmd.id, cmd)
        this.notify()

        // Return unregister function
        return () => {
            this.commands.delete(cmd.id)
            this.notify()
        }
    }

    /**
     * Unregister a command by ID
     */
    unregister(id) {
        this.commands.delete(id)
        this.notify()
    }

    /**
     * Execute a command by ID
     */
    execute(id, ...args) {
        const cmd = this.commands.get(id)
        if (cmd && typeof cmd.action === 'function') {
            try {
                return cmd.action(...args)
            } catch (err) {
                console.error(`[CommandRegistry] Error executing command "${id}":`, err)
            }
        } else {
            console.warn(`[CommandRegistry] Command "${id}" not found or has no action`)
        }
    }

    /**
     * Get all registered commands as an array
     */
    getAll() {
        return Array.from(this.commands.values())
    }

    /**
     * Search commands by query
     */
    search(query) {
        if (!query || !query.trim()) return this.getAll()
        const q = query.toLowerCase().trim()
        return this.getAll().filter(cmd =>
            cmd.label.toLowerCase().includes(q) ||
            cmd.category?.toLowerCase().includes(q) ||
            cmd.id.toLowerCase().includes(q)
        )
    }

    /**
     * Subscribe to command registry updates
     */
    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(fn => fn(this.getAll()))
    }
}

export const commandRegistry = new CommandRegistry()
