import { useState, useEffect, useCallback, useRef } from 'react'
import {
    saveWorkspaceLocal,
    getWorkspaceLocal,
    listWorkspacesLocal,
    deleteWorkspaceLocal,
    generateWorkspaceName,
} from '../services/workspaceDB'
import axios from '../config/axios'
import toast from 'react-hot-toast'

/**
 * useWorkspaces
 *
 * Hook to manage multi-workspace architecture.
 * IndexedDB provides local-first fast storage for full fileTrees & terminal logs.
 * MongoDB holds lightweight metadata only.
 */
const useWorkspaces = (projectId, initialFileTree = {}) => {
    const [workspaces, setWorkspaces] = useState([])
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null)
    const [activeWorkspace, setActiveWorkspace] = useState(null)
    const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)

    const isLoadedRef = useRef(false)

    // Load or initialize workspaces for current project
    useEffect(() => {
        if (!projectId) return

        let isMounted = true

        const initWorkspaces = async () => {
            setIsLoadingWorkspaces(true)
            try {
                // 1. Fetch local workspaces from IndexedDB
                let localList = await listWorkspacesLocal(projectId)

                // 2. Fetch remote workspaces from MongoDB to guarantee persistence across devices/refreshes
                try {
                    const res = await axios.get(`/projects/get-project/${projectId}`)
                    const remoteWorkspaces = res.data?.project?.workspaces || []
                    if (remoteWorkspaces.length > 0) {
                        for (const rw of remoteWorkspaces) {
                            const existingIdx = localList.findIndex(w => w.id === rw._id)
                            if (existingIdx > -1) {
                                const local = localList[existingIdx]
                                const remoteTree = rw.fileTree || {}
                                const localTree = local.fileTree || {}
                                const remoteTreeKeys = Object.keys(remoteTree).length
                                const localTreeKeys = Object.keys(localTree).length

                                if (remoteTreeKeys > 0 && (localTreeKeys === 0 || new Date(rw.updatedAt) > new Date(local.updatedAt))) {
                                    localList[existingIdx] = {
                                        ...local,
                                        name: rw.name || local.name,
                                        framework: rw.framework || local.framework,
                                        fileTree: remoteTree,
                                        updatedAt: rw.updatedAt || local.updatedAt,
                                    }
                                    await saveWorkspaceLocal(localList[existingIdx])
                                }
                            } else {
                                const newLocal = {
                                    id: rw._id,
                                    projectId,
                                    name: rw.name || 'Workspace',
                                    fileTree: rw.fileTree || {},
                                    terminalOutput: '',
                                    openFiles: Object.keys(rw.fileTree || {}).slice(0, 3),
                                    currentFile: Object.keys(rw.fileTree || {})[0] || null,
                                    framework: rw.framework || 'React + Vite',
                                    createdAt: rw.createdAt || new Date().toISOString(),
                                    updatedAt: rw.updatedAt || new Date().toISOString(),
                                    isPinned: !!rw.isPinned,
                                    isArchived: !!rw.isArchived,
                                }
                                localList.push(newLocal)
                                await saveWorkspaceLocal(newLocal)
                            }
                        }
                    }
                } catch (e) {
                    if (import.meta.env.DEV) console.warn('[useWorkspaces] Remote sync skipped:', e.message)
                }

                // 3. If no workspaces exist yet for this project, create default workspace from initialFileTree
                if (localList.length === 0) {
                    const defaultWorkspace = {
                        id: `${projectId}_default`,
                        projectId,
                        name: 'Main Workspace',
                        fileTree: initialFileTree || {},
                        terminalOutput: '',
                        openFiles: Object.keys(initialFileTree || {}).slice(0, 3),
                        currentFile: Object.keys(initialFileTree || {})[0] || null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isPinned: true,
                        isArchived: false,
                    }

                    await saveWorkspaceLocal(defaultWorkspace)
                    localList = [defaultWorkspace]

                    // Save metadata to MongoDB asynchronously
                    axios.post(`/projects/${projectId}/workspaces`, {
                        _id: defaultWorkspace.id,
                        name: defaultWorkspace.name,
                        fileTree: defaultWorkspace.fileTree,
                    }).catch(() => {})
                }

                if (!isMounted) return

                setWorkspaces(localList)

                // Set active workspace (first pinned or first item)
                const target = localList.find(w => w.isPinned) || localList[0]
                setActiveWorkspaceId(target.id)
                setActiveWorkspace(target)
            } catch (err) {
                console.error('[useWorkspaces] Initialization error:', err)
            } finally {
                if (isMounted) setIsLoadingWorkspaces(false)
            }
        }

        initWorkspaces()

        return () => { isMounted = false }
    }, [projectId])

    // Switch active workspace
    const switchWorkspace = useCallback(async (workspaceId) => {
        if (workspaceId === activeWorkspaceId) return

        try {
            const target = (await getWorkspaceLocal(workspaceId)) || workspaces.find(w => w.id === workspaceId)
            if (target) {
                const safeTarget = {
                    ...target,
                    fileTree: target.fileTree ? structuredClone(target.fileTree) : {},
                }
                setActiveWorkspaceId(safeTarget.id)
                setActiveWorkspace(safeTarget)
                toast.success(`Switched to workspace "${safeTarget.name}"`)
            }
        } catch (err) {
            toast.error('Failed to switch workspace')
        }
    }, [activeWorkspaceId, workspaces])

    // Create a new workspace (auto-triggered when AI generates a new project)
    const createWorkspace = useCallback(async (promptText, fileTree = {}, metadata = {}) => {
        try {
            const existingNames = workspaces.map(w => w.name)
            const name = generateWorkspaceName(promptText, existingNames)
            const workspaceId = `${projectId}_ws_${Date.now()}`
            const safeFileTree = fileTree ? structuredClone(fileTree) : {}

            const newWorkspace = {
                id: workspaceId,
                projectId,
                name,
                fileTree: safeFileTree,
                terminalOutput: '',
                openFiles: Object.keys(safeFileTree).slice(0, 3),
                currentFile: Object.keys(safeFileTree)[0] || null,
                framework: metadata.framework || 'React + Vite',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPinned: false,
                isArchived: false,
                ...metadata,
            }

            await saveWorkspaceLocal(newWorkspace)

            setWorkspaces(prev => [newWorkspace, ...prev])
            setActiveWorkspaceId(newWorkspace.id)
            setActiveWorkspace(newWorkspace)

            // Sync metadata & fileTree to MongoDB
            axios.post(`/projects/${projectId}/workspaces`, {
                _id: newWorkspace.id,
                name: newWorkspace.name,
                framework: newWorkspace.framework,
                fileTree: safeFileTree,
            }).catch(() => {})

            toast.success(`Created project workspace "${name}"! 🚀`)
            return newWorkspace
        } catch (err) {
            toast.error('Failed to create workspace')
            throw err
        }
    }, [projectId, workspaces])

    // Update active workspace fileTree or state
    const updateActiveWorkspace = useCallback(async (updater) => {
        if (!activeWorkspaceId || !activeWorkspace) return

        const updated = typeof updater === 'function' ? updater(activeWorkspace) : { ...activeWorkspace, ...updater }
        updated.updatedAt = new Date().toISOString()

        setActiveWorkspace(updated)
        setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w))

        // Save to IndexedDB
        await saveWorkspaceLocal(updated)

        // Sync fileTree to MongoDB workspace subdocument
        if (updated.fileTree) {
            axios.put('/projects/update-file-tree', {
                projectId,
                workspaceId: updated.id,
                fileTree: updated.fileTree,
            }).catch(() => {})
        }
    }, [projectId, activeWorkspaceId, activeWorkspace])

    // Rename workspace
    const renameWorkspace = useCallback(async (workspaceId, newName) => {
        if (!newName?.trim()) return
        try {
            const target = await getWorkspaceLocal(workspaceId)
            if (!target) return

            const updated = { ...target, name: newName.trim(), updatedAt: new Date().toISOString() }
            await saveWorkspaceLocal(updated)

            setWorkspaces(prev => prev.map(w => w.id === workspaceId ? updated : w))
            if (activeWorkspaceId === workspaceId) {
                setActiveWorkspace(updated)
            }

            // Sync metadata to MongoDB
            axios.put(`/projects/${projectId}/workspaces/${workspaceId}`, { name: newName.trim() }).catch(() => {})
            toast.success('Workspace renamed')
        } catch (err) {
            toast.error('Failed to rename workspace')
        }
    }, [projectId, activeWorkspaceId])

    // Duplicate workspace
    const duplicateWorkspace = useCallback(async (workspaceId) => {
        try {
            const target = (await getWorkspaceLocal(workspaceId)) || workspaces.find(w => w.id === workspaceId)
            if (!target) return

            const newId = `${projectId}_ws_${Date.now()}`
            const safeFileTree = target.fileTree ? structuredClone(target.fileTree) : {}
            const newWorkspace = {
                ...target,
                id: newId,
                name: `${target.name} (Copy)`,
                fileTree: safeFileTree,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPinned: false,
            }

            await saveWorkspaceLocal(newWorkspace)
            setWorkspaces(prev => [newWorkspace, ...prev])

            // Sync metadata & fileTree to MongoDB
            axios.post(`/projects/${projectId}/workspaces`, {
                _id: newWorkspace.id,
                name: newWorkspace.name,
                framework: newWorkspace.framework,
                fileTree: safeFileTree,
            }).catch(() => {})

            toast.success(`Duplicated "${target.name}"`)
        } catch (err) {
            toast.error('Failed to duplicate workspace')
        }
    }, [projectId, workspaces])

    // Delete workspace
    const deleteWorkspace = useCallback(async (workspaceId) => {
        if (workspaces.length <= 1) {
            toast.error('Cannot delete the last remaining workspace')
            return
        }

        try {
            await deleteWorkspaceLocal(workspaceId)
            const remaining = workspaces.filter(w => w.id !== workspaceId)
            setWorkspaces(remaining)

            if (activeWorkspaceId === workspaceId) {
                const nextTarget = remaining[0]
                setActiveWorkspaceId(nextTarget.id)
                setActiveWorkspace(nextTarget)
            }

            // Sync delete to MongoDB
            axios.delete(`/projects/${projectId}/workspaces/${workspaceId}`).catch(() => {})
            toast.success('Workspace deleted')
        } catch (err) {
            toast.error('Failed to delete workspace')
        }
    }, [projectId, workspaces, activeWorkspaceId])

    // Toggle Pin status
    const togglePinWorkspace = useCallback(async (workspaceId) => {
        try {
            const target = await getWorkspaceLocal(workspaceId)
            if (!target) return

            const updated = { ...target, isPinned: !target.isPinned }
            await saveWorkspaceLocal(updated)

            setWorkspaces(prev => prev.map(w => w.id === workspaceId ? updated : w))
            if (activeWorkspaceId === workspaceId) {
                setActiveWorkspace(updated)
            }
        } catch (err) {
            toast.error('Failed to update workspace')
        }
    }, [activeWorkspaceId])

    // Update any workspace's fileTree by ID (used for background AI responses)
    const updateWorkspaceTreeById = useCallback(async (targetWorkspaceId, newTree) => {
        try {
            const target = await getWorkspaceLocal(targetWorkspaceId) || workspaces.find(w => w.id === targetWorkspaceId)
            if (!target) return null
            const updated = { ...target, fileTree: newTree, updatedAt: new Date().toISOString() }
            await saveWorkspaceLocal(updated)
            setWorkspaces(prev => prev.map(w => w.id === targetWorkspaceId ? updated : w))
            if (activeWorkspaceId === targetWorkspaceId) {
                setActiveWorkspace(updated)
            }
            // Sync fileTree to MongoDB workspace subdocument
            axios.put('/projects/update-file-tree', {
                projectId,
                workspaceId: targetWorkspaceId,
                fileTree: newTree,
            }).catch(() => {})
            return updated
        } catch (err) {
            console.error('[useWorkspaces] updateWorkspaceTreeById error:', err)
            return null
        }
    }, [projectId, workspaces, activeWorkspaceId])

    return {
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        isLoadingWorkspaces,
        switchWorkspace,
        createWorkspace,
        updateActiveWorkspace,
        updateWorkspaceTreeById,
        renameWorkspace,
        duplicateWorkspace,
        deleteWorkspace,
        togglePinWorkspace,
    }
}

export default useWorkspaces
