import React, { useState, useContext } from 'react'
import { UserContext } from '../../context/user.context'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Switch from '../ui/Switch'

export function CreateProjectModal({ isOpen, onClose, onCreate }) {
  const { user } = useContext(UserContext)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [role, setRole] = useState('')
  const [createGitRepo, setCreateGitRepo] = useState(false)
  const [isPrivate, setIsPrivate] = useState(true)
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Project name is required'); return }
    if (!role.trim()) { toast.error('Your role is required'); return }
    setCreating(true)
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        role: role.trim(),
        createGitRepo,
        isPrivate
      })
      setName(''); setDescription(''); setRole(''); setCreateGitRepo(false); setIsPrivate(true);
      onClose()
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    if (!creating) {
      setName(''); setDescription(''); setRole(''); setCreateGitRepo(false); setIsPrivate(true);
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New project"
      subtitle="Create a workspace for your team"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Project name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Expense Tracker Dashboard"
          icon={<i className="ri-folder-3-line" />}
          required
          autoFocus
        />

        <div>
          <label className="nc-label">Description <span className="font-[400]" style={{ color: 'var(--nc-text-muted)' }}>(optional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
            className="nc-input nc-textarea w-full"
            style={{ resize: 'none' }}
          />
        </div>

        <div>
          <label className="nc-label">Your Role <span className="text-red-500">*</span></label>
          <Input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Lead Developer, Project Architect"
            icon={<i className="ri-user-star-line" />}
            required
          />
        </div>

        {user?.github?.accessToken ? (
          <div className="p-4 rounded-[12px] space-y-3" style={{ background: 'var(--nc-elevated)', border: '1px solid var(--nc-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ri-github-fill text-[18px]" style={{ color: 'var(--nc-primary)' }} />
                <span className="text-[13px] font-[600] text-[var(--nc-text-primary)]">Create GitHub Repository</span>
              </div>
              <Switch checked={createGitRepo} onChange={setCreateGitRepo} size="sm" />
            </div>
            
            {createGitRepo && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[12px]" style={{ color: 'var(--nc-text-secondary)' }}>Private repository</span>
                <Switch checked={isPrivate} onChange={setIsPrivate} size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-[12px] flex items-center gap-2 text-[12px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--nc-border)', color: 'var(--nc-text-secondary)' }}>
            <i className="ri-information-line text-[16px] text-blue-500" />
            <span>Want to auto-create a GitHub repository? Connect your account under profile settings.</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} fullWidth disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={creating} icon={<i className="ri-add-line" />} fullWidth>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  )
}
