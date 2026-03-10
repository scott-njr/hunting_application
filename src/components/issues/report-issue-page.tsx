'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { cn } from '@/lib/utils'
import type { ModuleSlug } from '@/lib/modules'

type IssueReport = {
  id: string
  module: string
  category: string
  title: string
  description: string
  page_url: string | null
  status: string
  resolution: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

const CATEGORY_OPTIONS = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'content_error', label: 'Content Error' },
  { value: 'other', label: 'Other' },
]

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-900/30 text-amber-400 border-amber-700/50',
  in_progress: 'bg-blue-900/30 text-blue-400 border-blue-700/50',
  resolved: 'bg-green-900/30 text-green-400 border-green-700/50',
  wont_fix: 'bg-zinc-800/50 text-muted border-zinc-700/50',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
}

export default function ReportIssuePage({ moduleSlug }: { moduleSlug: ModuleSlug }) {
  const [issues, setIssues] = useState<IssueReport[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchIssues = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const res = await fetch(`/api/issues?module=${moduleSlug}`)
    if (res.ok) {
      const data = await res.json()
      setIssues(data.issues)
    }
    setLoading(false)
  }, [moduleSlug, supabase.auth])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTitle) { setError('Title is required'); return }
    if (!trimmedDescription) { setError('Description is required'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleSlug,
          category,
          title: trimmedTitle,
          description: trimmedDescription,
          page_url: window.location.href,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit report')
        return
      }

      setTitle('')
      setDescription('')
      setCategory('bug')
      setSuccess(true)
      fetchIssues()
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Submit Form */}
      <div className="bg-surface border border-subtle rounded-lg p-6">
        <h1 className="text-xl font-semibold text-primary mb-1">Report an Issue</h1>
        <p className="text-sm text-secondary mb-6">
          Found a bug or have a suggestion? Let us know and we&apos;ll look into it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-1.5">Category</label>
            <TacticalSelect
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={200}
              className="w-full px-3 py-2 bg-elevated border border-default rounded text-sm text-primary placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What happened? What did you expect? Steps to reproduce..."
              rows={5}
              maxLength={5000}
              className="w-full px-3 py-2 bg-elevated border border-default rounded text-sm text-primary placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors resize-y"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-400">Report submitted — thank you!</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'px-4 py-2 rounded text-sm font-medium transition-colors',
              'bg-accent text-white hover:bg-accent-hover',
              submitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>

      {/* My Reports */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-4">My Reports</h2>

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : issues.length === 0 ? (
          <p className="text-sm text-muted">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <div
                key={issue.id}
                className="bg-surface border border-subtle rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-primary truncate">{issue.title}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      {CATEGORY_OPTIONS.find(c => c.value === issue.category)?.label ?? issue.category}
                      {' · '}
                      {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded border shrink-0',
                    STATUS_STYLES[issue.status] ?? STATUS_STYLES.open
                  )}>
                    {STATUS_LABELS[issue.status] ?? issue.status}
                  </span>
                </div>

                <p className="text-sm text-secondary mt-2 line-clamp-2">{issue.description}</p>

                {issue.resolution && (
                  <div className="mt-3 pt-3 border-t border-subtle">
                    <p className="text-xs text-muted mb-0.5">Resolution</p>
                    <p className="text-sm text-green-400">{issue.resolution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
