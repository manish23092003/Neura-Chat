import { useState, useCallback, useRef } from 'react'
import axios from '../config/axios'
import { debounce } from '../utils/performance'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recursively normalize an AI-generated file tree to the canonical format:
 * { "name": { file: { contents: "..." } } }  or
 * { "name": { directory: { ... } } }
 */
export const normalizeFileTree = (tree) => {
    if (!tree || typeof tree !== 'object') return tree
    const normalized = {}
    for (const key of Object.keys(tree)) {
        const node = tree[key]
        if (!node || typeof node !== 'object') continue
        if (node.file) {
            normalized[key] = { file: node.file }
        } else if (node.type === 'directory' || node.children || node.directory) {
            const children = node.children || node.directory || {}
            normalized[key] = { directory: normalizeFileTree(children) }
        } else {
            normalized[key] = { directory: normalizeFileTree(node) }
        }
    }
    return normalized
}

/**
 * Deep-merge two file trees. Incoming tree wins on file conflicts.
 */
export const mergeFileTrees = (existing, incoming) => {
    if (!existing || typeof existing !== 'object') return incoming || {}
    if (!incoming || typeof incoming !== 'object') return existing

    const merged = { ...existing }
    for (const key of Object.keys(incoming)) {
        const inc = incoming[key]
        const ext = existing[key]
        if (!ext) {
            merged[key] = inc
        } else if (inc.file && ext.file) {
            merged[key] = inc // incoming wins
        } else if (inc.directory && ext.directory) {
            merged[key] = { directory: mergeFileTrees(ext.directory, inc.directory) }
        } else {
            merged[key] = inc
        }
    }
    return merged
}

/**
 * Read a file node from the tree by slash-delimited path string.
 */
export const getFileByPath = (tree, pathStr) => {
    if (!pathStr || !tree) return null
    const parts = pathStr.split('/')
    let current = tree
    for (const segment of parts) {
        if (!current) return null
        current = current.directory ? current.directory[segment] : current[segment]
    }
    return current?.file ? current : null
}

/**
 * Return an updated copy of the tree with `contents` written to `pathStr`.
 * Uses structuredClone() for a fast, deep clone (much faster than JSON round-trip).
 */
export const setFileInTree = (tree, pathStr, contents) => {
    if (!pathStr) return tree
    const parts = pathStr.split('/')
    const newTree = structuredClone(tree)
    let current = newTree
    for (let i = 0; i < parts.length; i++) {
        const segment = parts[i]
        if (i === parts.length - 1) {
            const dir = current.directory ?? current
            dir[segment] = { file: { contents } }
        } else {
            if (current.directory) {
                if (!current.directory[segment]) current.directory[segment] = { directory: {} }
                current = current.directory[segment]
            } else {
                if (!current[segment]) current[segment] = { directory: {} }
                current = current[segment]
            }
        }
    }
    return newTree
}

/**
 * Flatten a file tree to a flat array of path strings.
 */
export const getAllFilePaths = (node, path = '', acc = []) => {
    if (!node) return acc
    for (const key of Object.keys(node)) {
        const child = node[key]
        const currentPath = path ? `${path}/${key}` : key
        const isDir = !!(child.directory || (!child.file && typeof child === 'object'))
        const next = child.directory || (isDir ? child : null)
        if (isDir) {
            if (next) getAllFilePaths(next, currentPath, acc)
        } else {
            acc.push(currentPath)
        }
    }
    return acc
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useFileTree
 *
 * Manages file tree state + debounced persistence to backend.
 *
 * @param {object} initialTree — initial file tree from the project
 * @param {string} projectId   — used for API calls
 * @param {Function} onProjectUpdate — called with updated project object after save
 */
const useFileTree = (initialTree, projectId, onProjectUpdate) => {
    const [fileTree, setFileTreeState] = useState(initialTree || {})
    // Keep a ref in sync for use inside socket/event handlers without stale closure
    const fileTreeRef = useRef(fileTree)

    // Debounced save — waits 600ms after the last change before hitting the API
    const debouncedSave = useRef(
        debounce(async (tree, pid) => {
            try {
                const res = await axios.put('/projects/update-file-tree', {
                    projectId: pid,
                    fileTree: tree,
                })
                if (res.data?.project) {
                    onProjectUpdate?.(res.data.project)
                }
            } catch (err) {
                // Non-fatal — local state is already updated; just log
                if (import.meta.env.DEV) {
                    console.warn('[useFileTree] save failed:', err.message)
                }
            }
        }, 600)
    ).current

    /**
     * Update the file tree in state and schedule a debounced save to the DB.
     */
    const setFileTree = useCallback((updater) => {
        setFileTreeState((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            fileTreeRef.current = next
            debouncedSave(next, projectId)
            return next
        })
    }, [projectId, debouncedSave])

    /**
     * Immediately save the file tree (used for explicit user actions).
     */
    const saveNow = useCallback((tree) => {
        const t = tree ?? fileTreeRef.current
        debouncedSave.cancel()
        axios.put('/projects/update-file-tree', {
            projectId,
            fileTree: t,
        }).then(res => {
            if (res.data?.project) onProjectUpdate?.(res.data.project)
        }).catch(err => {
            if (import.meta.env.DEV) console.warn('[useFileTree] saveNow failed:', err.message)
        })
    }, [projectId, onProjectUpdate, debouncedSave])

    /**
     * Write new contents to an existing file and persist.
     */
    const updateFile = useCallback((pathStr, contents) => {
        setFileTree((prev) => setFileInTree(prev, pathStr, contents))
    }, [setFileTree])

    /**
     * Merge an AI-generated file tree into the current tree.
     */
    const mergeAiTree = useCallback((aiTree) => {
        setFileTree((prev) => {
            const normalized = normalizeFileTree(aiTree)
            return mergeFileTrees(prev, normalized)
        })
    }, [setFileTree])

    return {
        fileTree,
        fileTreeRef,
        setFileTree,
        updateFile,
        mergeAiTree,
        saveNow,
        getFile: useCallback((p) => getFileByPath(fileTreeRef.current, p), []),
        getAllPaths: useCallback(() => getAllFilePaths(fileTreeRef.current), []),
    }
}

export default useFileTree
