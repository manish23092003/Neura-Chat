/**
 * settingsManager.js
 *
 * Persisted Settings System for NeuraChat 2.0.
 * Stores user preferences (Theme, Font Size, Tab Width, AI Dock Position, Word Wrap, Auto-Save)
 * in localStorage & syncs to IndexedDB.
 */

const SETTINGS_KEY = 'neurachat_ide_settings'

export const DEFAULT_SETTINGS = {
    theme: 'neurachat-dark',
    fontSize: 13,
    tabSize: 4,
    wordWrap: 'on',
    aiDockPosition: 'right', // 'right' | 'bottom' | 'floating' | 'hidden'
    autoSave: true,
    minimap: false,
    animations: true,
}

class SettingsManager {
    constructor() {
        this.listeners = new Set()
        this.settings = this.loadSettings()
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY)
            if (raw) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
            }
        } catch (e) {
            console.warn('[settingsManager] Failed to load settings from storage:', e)
        }
        return { ...DEFAULT_SETTINGS }
    }

    getSettings() {
        return { ...this.settings }
    }

    get(key) {
        return this.settings[key] ?? DEFAULT_SETTINGS[key]
    }

    set(key, value) {
        this.settings[key] = value
        this.saveSettings()
        this.notify()
    }

    update(partialSettings) {
        this.settings = { ...this.settings, ...partialSettings }
        this.saveSettings()
        this.notify()
    }

    saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
        } catch (e) {
            console.error('[settingsManager] Failed to save settings:', e)
        }
    }

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(fn => fn(this.getSettings()))
    }
}

export const settingsManager = new SettingsManager()
