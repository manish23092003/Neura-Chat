/**
 * versionHistory.js
 *
 * Local Git-like Version History engine for NeuraChat 2.0.
 * Saves local diff snapshots in IndexedDB on every major edit or AI generation.
 * Allows instant 1-click restore to previous snapshots.
 */

import { getDB } from './workspaceDB'

const HISTORY_STORE = 'version_history'

const getHistoryStoreDB = () => getDB()

/**
 * Save a new snapshot version
 */
export const saveVersionSnapshot = async (workspaceId, fileTree, message = 'Update project files') => {
    try {
        const db = await getHistoryStoreDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(HISTORY_STORE, 'readwrite')
            const store = tx.objectStore(HISTORY_STORE)
            const snapshot = {
                id: `snap_${Date.now()}`,
                workspaceId,
                fileTree,
                message,
                createdAt: new Date().toISOString(),
            }
            const request = store.put(snapshot)
            request.onsuccess = () => resolve(snapshot)
            request.onerror = (e) => reject(e.target.error)
        })
    } catch (err) {
        console.error('[versionHistory] saveVersionSnapshot error:', err)
        return null
    }
}

/**
 * List all snapshot versions for a workspace
 */
export const listVersionSnapshots = async (workspaceId) => {
    try {
        const db = await getHistoryStoreDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(HISTORY_STORE, 'readonly')
            const store = tx.objectStore(HISTORY_STORE)
            const index = store.index('workspaceId')
            const request = index.getAll(workspaceId)
            request.onsuccess = () => {
                const results = request.result || []
                results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                resolve(results)
            }
            request.onerror = (e) => reject(e.target.error)
        })
    } catch (err) {
        console.error('[versionHistory] listVersionSnapshots error:', err)
        return []
    }
}
