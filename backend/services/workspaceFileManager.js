/**
 * workspaceFileManager.js
 *
 * Authoritative Server-Side Workspace File & Versioning Manager.
 * Guarantees atomic file operations with strict baseVersion verification.
 * Prevents stale overwrites from human users or AI agent tool calls.
 */

class WorkspaceFileManager {
    constructor() {
        // Map<workspaceId, Map<filePath, { version, content, updatedBy, updatedAt }>>
        this.workspaces = new Map()
    }

    /**
     * Get or initialize workspace store
     */
    getWorkspaceStore(workspaceId) {
        if (!this.workspaces.has(workspaceId)) {
            this.workspaces.set(workspaceId, new Map())
        }
        return this.workspaces.get(workspaceId)
    }

    /**
     * Initialize workspace files from project fileTree
     */
    initializeWorkspace(workspaceId, fileTree) {
        const store = this.getWorkspaceStore(workspaceId)
        const flatten = (node, currentPath = '') => {
            if (!node || typeof node !== 'object') return
            for (const key of Object.keys(node)) {
                const item = node[key]
                const pathStr = currentPath ? `${currentPath}/${key}` : key
                if (!item) continue
                if (item.file) {
                    if (!store.has(pathStr)) {
                        store.set(pathStr, {
                            version: 1,
                            content: item.file.contents ?? '',
                            updatedBy: 'system',
                            updatedAt: new Date().toISOString(),
                        })
                    }
                } else if (item.directory) {
                    flatten(item.directory, pathStr)
                } else if (typeof item === 'object') {
                    if (item.contents !== undefined) {
                        if (!store.has(pathStr)) {
                            store.set(pathStr, {
                                version: 1,
                                content: item.contents,
                                updatedBy: 'system',
                                updatedAt: new Date().toISOString(),
                            })
                        }
                    } else {
                        flatten(item, pathStr)
                    }
                }
            }
        }
        flatten(fileTree)
    }

    /**
     * Read file record
     */
    readFile(workspaceId, pathStr) {
        const store = this.getWorkspaceStore(workspaceId)
        return store.get(pathStr) || null
    }

    /**
     * List all file records in workspace
     */
    listFiles(workspaceId) {
        const store = this.getWorkspaceStore(workspaceId)
        const list = []
        for (const [pathStr, record] of store.entries()) {
            list.push({ path: pathStr, ...record })
        }
        return list
    }

    /**
     * Create file
     */
    createFile(workspaceId, pathStr, content = '', userId = 'system') {
        const store = this.getWorkspaceStore(workspaceId)
        if (store.has(pathStr)) {
            const existing = store.get(pathStr)
            return {
                conflict: true,
                message: `File "${pathStr}" already exists`,
                currentVersion: existing.version,
                path: pathStr,
            }
        }

        const record = {
            version: 1,
            content,
            updatedBy: userId,
            updatedAt: new Date().toISOString(),
        }
        store.set(pathStr, record)
        return { success: true, file: { path: pathStr, ...record } }
    }

    /**
     * Update file content with baseVersion check
     */
    updateFile(workspaceId, pathStr, newContent, baseVersion, userId = 'system') {
        const store = this.getWorkspaceStore(workspaceId)
        const existing = store.get(pathStr)

        if (!existing) {
            // File does not exist, treat as create if baseVersion is 0
            if (baseVersion === 0 || baseVersion === undefined) {
                return this.createFile(workspaceId, pathStr, newContent, userId)
            }
            return { conflict: true, message: `File "${pathStr}" not found`, path: pathStr }
        }

        // Stale Version Verification
        if (baseVersion !== undefined && baseVersion !== existing.version) {
            return {
                conflict: true,
                message: `Stale version conflict on "${pathStr}". Expected version ${existing.version}, received ${baseVersion}`,
                currentVersion: existing.version,
                requestedVersion: baseVersion,
                path: pathStr,
                currentContent: existing.content,
            }
        }

        // Increment version atomically
        existing.version += 1
        existing.content = newContent
        existing.updatedBy = userId
        existing.updatedAt = new Date().toISOString()

        return { success: true, file: { path: pathStr, ...existing } }
    }

    /**
     * Delete file with baseVersion check
     */
    deleteFile(workspaceId, pathStr, baseVersion, userId = 'system') {
        const store = this.getWorkspaceStore(workspaceId)
        const existing = store.get(pathStr)
        if (!existing) {
            return { success: true, message: 'File already deleted' }
        }

        if (baseVersion !== undefined && baseVersion !== existing.version) {
            return {
                conflict: true,
                message: `Stale version conflict on deleting "${pathStr}". Current version is ${existing.version}`,
                currentVersion: existing.version,
                requestedVersion: baseVersion,
                path: pathStr,
            }
        }

        store.delete(pathStr)
        return { success: true, deletedPath: pathStr }
    }

    /**
     * Rename file with baseVersion check
     */
    renameFile(workspaceId, oldPath, newPath, baseVersion, userId = 'system') {
        const store = this.getWorkspaceStore(workspaceId)
        const existing = store.get(oldPath)
        if (!existing) {
            return { conflict: true, message: `File "${oldPath}" not found`, path: oldPath }
        }

        if (baseVersion !== undefined && baseVersion !== existing.version) {
            return {
                conflict: true,
                message: `Stale version conflict on renaming "${oldPath}". Current version is ${existing.version}`,
                currentVersion: existing.version,
                requestedVersion: baseVersion,
                path: oldPath,
            }
        }

        store.delete(oldPath)
        existing.version += 1
        existing.updatedBy = userId
        existing.updatedAt = new Date().toISOString()
        store.set(newPath, existing)

        return { success: true, oldPath, newPath, file: { path: newPath, ...existing } }
    }
}

export const workspaceFileManager = new WorkspaceFileManager()
