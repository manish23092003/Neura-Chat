/**
 * workspaceFileManager.js (Frontend Client Service)
 *
 * Centralized Client-Side Workspace File Manager.
 * All file operations (Monaco edits, File Explorer actions, AI tool calls) pass through this layer.
 * Tracks file versions locally and attaches baseVersion to prevent stale overwrites.
 */

import { saveWorkspaceLocal, getWorkspaceLocal } from './workspaceDB'
import axios from '../config/axios'

class ClientWorkspaceFileManager {
    constructor() {
        // Map<workspaceId, Map<pathStr, version>>
        this.fileVersions = new Map()
    }

    getFileVersions(workspaceId) {
        if (!this.fileVersions.has(workspaceId)) {
            this.fileVersions.set(workspaceId, new Map())
        }
        return this.fileVersions.get(workspaceId)
    }

    getVersion(workspaceId, pathStr) {
        const versions = this.getFileVersions(workspaceId)
        return versions.get(pathStr) || 1
    }

    setVersion(workspaceId, pathStr, version) {
        const versions = this.getFileVersions(workspaceId)
        versions.set(pathStr, version)
    }

    /**
     * Update file content with version increment
     */
    async updateFile(workspaceId, pathStr, newContent, baseVersion = null) {
        const currentVersion = baseVersion ?? this.getVersion(workspaceId, pathStr)
        const nextVersion = currentVersion + 1

        this.setVersion(workspaceId, pathStr, nextVersion)

        // Sync to local IndexedDB workspace cache
        const localWs = await getWorkspaceLocal(workspaceId)
        if (localWs) {
            const updatedTree = { ...(localWs.fileTree || {}) }
            updatedTree[pathStr] = { file: { contents: newContent }, version: nextVersion }
            localWs.fileTree = updatedTree
            localWs.updatedAt = new Date().toISOString()
            await saveWorkspaceLocal(localWs)
        }

        return { path: pathStr, version: nextVersion, content: newContent }
    }
}

export const clientWorkspaceFileManager = new ClientWorkspaceFileManager()
