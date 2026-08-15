/**
 * workspaceDB.js
 *
 * Local-First IndexedDB storage engine for NeuraChat 2.0.
 * Keeps full file trees, Lifo VFS, terminal logs, editor states, and caches
 * stored locally in IndexedDB for instant sub-500ms project switching & offline capability.
 */

const DB_NAME = 'NeuraChat_Workspace_DB'
const DB_VERSION = 2
const WORKSPACE_STORE = 'workspaces'
const HISTORY_STORE = 'version_history'

let dbPromise = null

/**
 * Open (or initialize) the IndexedDB database safely.
 */
export const getDB = () => {
    if (dbPromise) return dbPromise

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = (event) => {
            const db = event.target.result
            if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
                const store = db.createObjectStore(WORKSPACE_STORE, { keyPath: 'id' })
                store.createIndex('projectId', 'projectId', { unique: false })
                store.createIndex('updatedAt', 'updatedAt', { unique: false })
            }
            if (!db.objectStoreNames.contains(HISTORY_STORE)) {
                const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' })
                historyStore.createIndex('workspaceId', 'workspaceId', { unique: false })
                historyStore.createIndex('createdAt', 'createdAt', { unique: false })
            }
        }

        request.onsuccess = (event) => {
            resolve(event.target.result)
        }

        request.onerror = (event) => {
            if (event.target.error?.name === 'VersionError') {
                // If browser has a higher version, open without explicit version number
                const fallbackReq = indexedDB.open(DB_NAME)
                fallbackReq.onsuccess = (e) => resolve(e.target.result)
                fallbackReq.onerror = (e) => reject(e.target.error)
            } else {
                console.error('[workspaceDB] Failed to open IndexedDB:', event.target.error)
                reject(event.target.error)
            }
        }
    })

    return dbPromise
}

/**
 * Save or update a workspace in IndexedDB.
 */
export const saveWorkspaceLocal = async (workspace) => {
    try {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WORKSPACE_STORE, 'readwrite')
            const store = tx.objectStore(WORKSPACE_STORE)
            const record = {
                ...workspace,
                updatedAt: new Date().toISOString(),
            }
            const request = store.put(record)
            request.onsuccess = () => resolve(record)
            request.onerror = (e) => reject(e.target.error)
        })
    } catch (err) {
        console.error('[workspaceDB] saveWorkspaceLocal error:', err)
        throw err
    }
}

/**
 * Get a single workspace by ID from IndexedDB.
 */
export const getWorkspaceLocal = async (workspaceId) => {
    try {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WORKSPACE_STORE, 'readonly')
            const store = tx.objectStore(WORKSPACE_STORE)
            const request = store.get(workspaceId)
            request.onsuccess = () => resolve(request.result || null)
            request.onerror = (e) => reject(e.target.error)
        })
    } catch (err) {
        console.error('[workspaceDB] getWorkspaceLocal error:', err)
        return null
    }
}

/**
 * List all workspaces for a given project ID from IndexedDB.
 */
export const listWorkspacesLocal = async (projectId) => {
    try {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WORKSPACE_STORE, 'readonly')
            const store = tx.objectStore(WORKSPACE_STORE)
            const index = store.index('projectId')
            const request = index.getAll(projectId)
            request.onsuccess = () => {
                const results = request.result || []
                results.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
                resolve(results)
            }
            request.onerror = (e) => reject(e.target.error)
        })
    } catch (err) {
        console.error('[workspaceDB] listWorkspacesLocal error:', err)
        return []
    }
}

/**
 * Delete a workspace by ID from IndexedDB.
 */
export const deleteWorkspaceLocal = async (workspaceId) => {
    try {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(WORKSPACE_STORE, 'readwrite')
            const store = tx.objectStore(WORKSPACE_STORE)
            const request = store.delete(workspaceId)
            request.onsuccess = () => resolve(true)
            request.onerror = (e) => reject(e.target.error)
        })
    } catch (err) {
        console.error('[workspaceDB] deleteWorkspaceLocal error:', err)
        return false
    }
}

/**
 * Helper to generate intelligent workspace name from user prompt
 */
export const generateWorkspaceName = (promptText, existingNames = []) => {
    let clean = promptText.replace(/@ai/gi, '').trim()
    
    // Extract key noun phrases or default
    let baseName = 'AI Project'
    if (clean.length > 0) {
        const words = clean.split(/\s+/).slice(0, 4).join(' ')
        baseName = words.charAt(0).toUpperCase() + words.slice(1)
    }

    // Capitalize words
    baseName = baseName.replace(/\b\w/g, c => c.toUpperCase())

    // Handle duplicates: "Project", "Project (2)", "Project (3)"
    let name = baseName
    let counter = 2
    while (existingNames.includes(name)) {
        name = `${baseName} (${counter})`
        counter++
    }

    return name
}
