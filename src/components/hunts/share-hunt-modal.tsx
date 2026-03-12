'use client'

import { useState, useEffect } from 'react'
import {
  X, FileDown, Mail, Plus, Trash2, Loader2,
  CheckCircle, MapPin, Users, Package, AlertCircle, Shield,
} from 'lucide-react'

interface ShareHuntModalProps {
  open: boolean
  onClose: () => void
  huntId: string
  huntTitle: string
  existingRecipients: { email: string }[]
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function ShareHuntModal({ open, onClose, huntId, huntTitle, existingRecipients }: ShareHuntModalProps) {
  const [recipients, setRecipients] = useState<{ email: string }[]>(existingRecipients)
  const [newEmail, setNewEmail] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [emailing, setEmailing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setRecipients(existingRecipients)
      setNewEmail('')
      setError(null)
      setSuccess(null)
    }
  }, [open, existingRecipients])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  function addRecipient() {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (recipients.some(r => r.email === email)) {
      setError('This email is already in the list.')
      return
    }
    setRecipients(prev => [...prev, { email }])
    setNewEmail('')
    setError(null)
  }

  function removeRecipient(email: string) {
    setRecipients(prev => prev.filter(r => r.email !== email))
  }

  async function handleDownload() {
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch(`/api/hunting/${huntId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Failed to generate PDF.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hunt-plan-${huntTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccess('PDF downloaded!')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleEmail() {
    if (recipients.length === 0) {
      setError('Add at least one email recipient.')
      return
    }
    setEmailing(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/hunting/${huntId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'email', recipients: recipients.map(r => r.email) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Failed to send email.')
        return
      }
      setSuccess(`PDF emailed to ${data?.sent ?? recipients.length} recipient${recipients.length !== 1 ? 's' : ''}!`)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setEmailing(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-default rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
          <div>
            <h3 className="text-primary font-semibold text-sm">Share Hunt Plan</h3>
            <p className="text-muted text-xs mt-0.5">{huntTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* What's included */}
          <div>
            <p className="text-secondary text-xs font-medium mb-2">PDF includes:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: FileDown, label: 'Hunt details & dates' },
                { icon: Users, label: 'Hunt party members' },
                { icon: MapPin, label: 'Locations with GPS' },
                { icon: Package, label: 'Gear checklist' },
                { icon: Shield, label: 'Emergency contacts' },
                { icon: AlertCircle, label: 'Scout report summaries' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted">
                  <Icon className="h-3 w-3 text-accent shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading || emailing}
            className="w-full flex items-center justify-center gap-2 btn-primary font-semibold rounded py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating PDF...</>
            ) : (
              <><FileDown className="h-4 w-4" /> Download PDF</>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="border-t border-subtle" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-muted text-xs">or email it</span>
          </div>

          {/* Email recipients */}
          <div>
            <p className="text-secondary text-xs font-medium mb-2">Email recipients</p>
            {recipients.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {recipients.map(r => (
                  <div key={r.email} className="flex items-center gap-2 bg-elevated border border-subtle rounded px-3 py-2">
                    <Mail className="h-3 w-3 text-muted shrink-0" />
                    <span className="text-primary text-xs flex-1 truncate">{r.email}</span>
                    <button onClick={() => removeRecipient(r.email)} className="text-muted hover:text-red-400 transition-colors p-2">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && addRecipient()}
                placeholder="Email address"
                className="flex-1 bg-elevated border border-default text-primary rounded px-3 py-1.5 text-base sm:text-xs focus:border-accent focus:outline-none placeholder:text-muted"
              />
              <button
                onClick={addRecipient}
                className="flex items-center gap-1 text-xs text-secondary hover:text-primary bg-elevated hover:bg-elevated border border-subtle rounded px-3 py-1.5 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
          </div>

          {/* Email button */}
          <button
            onClick={handleEmail}
            disabled={emailing || downloading || recipients.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-elevated hover:bg-surface border border-subtle text-primary font-semibold rounded py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {emailing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
            ) : (
              <><Mail className="h-4 w-4" /> Email PDF to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</>
            )}
          </button>

          {/* Feedback */}
          {error && (
            <div className="p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded bg-green-950/50 border border-green-500/30 text-green-400 text-xs">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
