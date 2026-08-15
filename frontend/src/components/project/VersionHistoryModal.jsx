import React, { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { listVersionSnapshots } from '../../services/versionHistory'
import toast from 'react-hot-toast'

export function VersionHistoryModal({
    isOpen,
    onClose,
    workspaceId,
    workspaceName = 'Main Workspace',
    onRestoreSnapshot,
}) {
    const [snapshots, setSnapshots] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && workspaceId) {
            setLoading(true)
            listVersionSnapshots(workspaceId)
                .then(res => setSnapshots(res))
                .catch(() => toast.error('Failed to load version snapshots'))
                .finally(() => setLoading(false))
        }
    }, [isOpen, workspaceId])

    const handleRestore = (snapshot) => {
        if (confirm(`Restore workspace "${workspaceName}" to snapshot from ${new Date(snapshot.createdAt).toLocaleTimeString()}?`)) {
            onRestoreSnapshot(snapshot.fileTree)
            toast.success('Workspace restored to snapshot! 🔄')
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Version History — ${workspaceName}`}
            subtitle="Local snapshots & 1-click restore points"
            size="md"
        >
            <div className="space-y-3 font-sans text-xs">
                {loading ? (
                    <div className="py-12 text-center text-slate-400">
                        <i className="ri-loader-4-line nc-spin text-2xl mb-2" />
                        <p>Loading history timeline...</p>
                    </div>
                ) : snapshots.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                        <i className="ri-history-line text-3xl text-slate-600" />
                        <p className="font-semibold text-slate-300">No version snapshots yet</p>
                        <p className="text-[11px] text-slate-500">Snapshots are automatically saved when AI generates or updates files.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {snapshots.map((snap, idx) => (
                            <div
                                key={snap.id}
                                className="p-3 rounded-xl border bg-slate-900 border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <i className="ri-git-commit-line text-sky-400 text-sm" />
                                        <span className="font-bold text-slate-200 truncate">{snap.message}</span>
                                        {idx === 0 && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        {new Date(snap.createdAt).toLocaleString()} • ID: {snap.id}
                                    </p>
                                </div>

                                <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={() => handleRestore(snap)}
                                    icon={<i className="ri-history-line" />}
                                >
                                    Restore
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    )
}
