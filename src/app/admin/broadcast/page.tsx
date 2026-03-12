'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Eye, Upload, Clock, CheckCircle, AlertCircle, XCircle, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'
import type { BroadcastCategory } from '@/types'

interface Broadcast {
  id: string
  subject: string
  category: BroadcastCategory
  status: 'draft' | 'sending' | 'sent' | 'failed'
  recipient_count: number
  sent_at: string | null
  created_on: string
  error_message: string | null
}

interface UserOption {
  id: string
  email: string
  display_name: string | null
}

type SendMode = 'all' | 'selected'

const CATEGORY_OPTIONS = [
  { value: 'release_notes', label: 'Release Notes' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'blog', label: 'Blog' },
  { value: 'announcement', label: 'Announcement' },
]

const STATUS_CONFIG = {
  draft: { icon: Clock, color: 'text-muted', bg: 'bg-elevated' },
  sending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  sent: { icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/10' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
}

export default function AdminBroadcastPage() {
  const [category, setCategory] = useState<string>('release_notes')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [confirmSend, setConfirmSend] = useState(false)
  const [sendMode, setSendMode] = useState<SendMode>('all')
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserOption[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Search users with debounce
  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setUserResults([])
      return
    }
    setSearchingUsers(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&page=1`)
      if (res.ok) {
        const data = await res.json()
        const results: UserOption[] = (data.users ?? []).map((u: { id: string; email: string; display_name: string | null }) => ({
          id: u.id,
          email: u.email,
          display_name: u.display_name,
        }))
        setUserResults(results.filter(u => !selectedUsers.some(s => s.id === u.id)))
      }
    } catch {
      // Ignore search errors
    }
    setSearchingUsers(false)
  }, [selectedUsers])

  function handleUserSearchChange(value: string) {
    setUserSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => searchUsers(value), 300)
  }

  function addUser(user: UserOption) {
    setSelectedUsers(prev => [...prev, user])
    setUserResults(prev => prev.filter(u => u.id !== user.id))
    setUserSearch('')
  }

  function removeUser(userId: string) {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId))
  }

  // Load broadcast history
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingHistory(true)
      const res = await fetch('/api/admin/broadcast')
      if (!cancelled && res.ok) {
        const data = await res.json()
        setBroadcasts(data.broadcasts)
      }
      if (!cancelled) setLoadingHistory(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handlePreview() {
    if (!subject.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Subject and body are required' })
      return
    }

    setPreviewing(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, bodyMarkdown: body, category, preview: true }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Preview email sent to your inbox' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error ?? 'Preview failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setPreviewing(false)
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Subject and body are required' })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const payload: Record<string, unknown> = { subject, bodyMarkdown: body, category }
      if (sendMode === 'selected') {
        payload.recipientIds = selectedUsers.map(u => u.id)
      }

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `Sent to ${data.sent} recipients` })
        setSubject('')
        setBody('')
        setConfirmSend(false)

        // Refresh history
        const historyRes = await fetch('/api/admin/broadcast')
        if (historyRes.ok) {
          const historyData = await historyRes.json()
          setBroadcasts(historyData.broadcasts)
        }
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Send failed' })
        setConfirmSend(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
      setConfirmSend(false)
    }
    setSending(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/broadcast/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        // Insert markdown image at cursor position
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const imgMarkdown = `![${file.name}](${data.url})`
          const newBody = body.slice(0, start) + imgMarkdown + body.slice(end)
          setBody(newBody)

          // Restore cursor position after the inserted text
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = start + imgMarkdown.length
            textarea.focus()
          })
        } else {
          setBody(prev => prev + `\n![${file.name}](${data.url})`)
        }
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error ?? 'Upload failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Upload failed' })
    }

    setUploading(false)
    // Reset file input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Broadcast</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Category
            </label>
            <TacticalSelect
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What's new in this update..."
              className="w-full px-3 py-2.5 rounded-lg border border-subtle bg-surface text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent/40"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                Body (Markdown)
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading...' : 'Insert Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={14}
              placeholder="Write your broadcast content in markdown...&#10;&#10;# Heading&#10;&#10;Regular text with **bold** and *italic*.&#10;&#10;- Bullet points&#10;- Work great&#10;&#10;![alt text](image-url)"
              className="w-full px-3 py-2.5 rounded-lg border border-subtle bg-surface text-primary text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent/40 resize-y"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Recipients
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setSendMode('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  sendMode === 'all'
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-subtle text-secondary hover:bg-elevated'
                )}
              >
                All Users
              </button>
              <button
                onClick={() => setSendMode('selected')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  sendMode === 'selected'
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-subtle text-secondary hover:bg-elevated'
                )}
              >
                Select Users
              </button>
            </div>

            {sendMode === 'selected' && (
              <div className="space-y-2">
                {/* Selected users chips */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map(user => (
                      <span
                        key={user.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium"
                      >
                        {user.display_name ?? user.email}
                        <button
                          onClick={() => removeUser(user.id)}
                          className="hover:text-accent/70 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => handleUserSearchChange(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-subtle bg-surface text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent/40"
                  />
                </div>

                {/* Search results dropdown */}
                {(userResults.length > 0 || searchingUsers) && (
                  <div className="rounded-lg border border-subtle bg-surface max-h-40 overflow-y-auto">
                    {searchingUsers ? (
                      <p className="px-3 py-2 text-muted text-xs">Searching...</p>
                    ) : (
                      userResults.map(user => (
                        <button
                          key={user.id}
                          onClick={() => addUser(user)}
                          className="w-full text-left px-3 py-2 hover:bg-elevated transition-colors border-b border-subtle last:border-0"
                        >
                          <p className="text-primary text-sm">{user.display_name ?? '—'}</p>
                          <p className="text-muted text-xs">{user.email}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <p className="text-muted text-xs">{selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={cn(
              'px-4 py-3 rounded-lg text-sm flex items-center gap-2',
              message.type === 'success' ? 'bg-accent/10 text-accent' : 'bg-red-400/10 text-red-400'
            )}>
              {message.type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              disabled={previewing || sending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-subtle text-secondary text-sm font-medium hover:bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              {previewing ? 'Sending...' : 'Preview'}
            </button>

            {!confirmSend ? (
              <button
                onClick={() => setConfirmSend(true)}
                disabled={previewing || sending || !subject.trim() || !body.trim() || (sendMode === 'selected' && selectedUsers.length === 0)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {sendMode === 'all' ? 'Send to All' : `Send to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : 'Confirm Send'}
                </button>
                <button
                  onClick={() => setConfirmSend(false)}
                  disabled={sending}
                  className="px-3 py-2.5 rounded-lg text-muted text-sm hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Past Broadcasts
          </h2>
          <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
            {loadingHistory ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-elevated rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-elevated rounded animate-pulse w-1/2" />
                  </div>
                ))}
              </div>
            ) : broadcasts.length === 0 ? (
              <p className="p-4 text-muted text-sm text-center">No broadcasts sent yet.</p>
            ) : (
              <div className="divide-y divide-subtle">
                {broadcasts.map(b => {
                  const config = STATUS_CONFIG[b.status]
                  const StatusIcon = config.icon
                  return (
                    <div key={b.id} className="p-3">
                      <p className="text-primary text-sm font-medium truncate">{b.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', config.bg, config.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {b.status}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-elevated text-muted">
                          {CATEGORY_OPTIONS.find(c => c.value === b.category)?.label ?? b.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-muted text-xs">
                        <span>{b.recipient_count} sent</span>
                        <span>{new Date(b.sent_at ?? b.created_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      {b.error_message && (
                        <p className="text-red-400 text-xs mt-1 truncate">{b.error_message}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
