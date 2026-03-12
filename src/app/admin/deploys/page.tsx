'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'
import {
  Rocket, ChevronDown, ExternalLink, AlertCircle, CheckCircle, Clock, XCircle,
} from 'lucide-react'

interface Issue {
  id: string
  user_id: string
  module: string
  category: string
  title: string
  description: string
  page_url: string | null
  status: string
  severity: 'easy' | 'major' | null
  ai_proposed_fix: string | null
  ai_classified_at: string | null
  github_issue_url: string | null
  admin_deploy_notes: string | null
  admin_notes: string | null
  created_on: string
  members: { email: string; display_name: string | null } | null
}

interface DeployEntry {
  id: string
  triggered_by: string | null
  issue_id: string | null
  severity: string | null
  status: 'triggered' | 'building' | 'success' | 'failed'
  github_pr_url: string | null
  admin_notes: string | null
  created_on: string
  completed_at: string | null
}

interface Stats {
  queueCount: number
  easyCount: number
  majorCount: number
  deploysThisWeek: number
}

const MODULE_COLORS: Record<string, string> = {
  hunting: 'bg-amber-500/15 text-amber-400',
  archery: 'bg-red-500/15 text-red-400',
  firearms: 'bg-orange-500/15 text-orange-400',
  fishing: 'bg-blue-500/15 text-blue-400',
  fitness: 'bg-accent/15 text-accent',
  medical: 'bg-rose-500/15 text-rose-400',
}

const SEVERITY_COLORS: Record<string, string> = {
  easy: 'bg-accent/15 text-accent',
  major: 'bg-red-500/15 text-red-400',
}

const DEPLOY_STATUS_COLORS: Record<string, string> = {
  triggered: 'bg-amber-500/15 text-amber-400',
  building: 'bg-blue-500/15 text-blue-400',
  success: 'bg-accent/15 text-accent',
  failed: 'bg-red-500/15 text-red-400',
}

const DEPLOY_STATUS_ICONS: Record<string, React.ElementType> = {
  triggered: Clock,
  building: Rocket,
  success: CheckCircle,
  failed: XCircle,
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Severity' },
  { value: 'easy', label: 'Easy' },
  { value: 'major', label: 'Major' },
]

export default function AdminDeploysPage() {
  const [queue, setQueue] = useState<Issue[]>([])
  const [history, setHistory] = useState<DeployEntry[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [deployError, setDeployError] = useState<string | null>(null)

  const notesRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  async function fetchDeployData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/deploys')
      if (res.ok) {
        const data = await res.json()
        setQueue(data.queue)
        setHistory(data.history)
        setStats(data.stats)
      }
    } catch {
      // Network error — will show empty state
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      const res = await fetch('/api/admin/deploys')
      if (!cancelled && res.ok) {
        const data = await res.json()
        setQueue(data.queue)
        setHistory(data.history)
        setStats(data.stats)
      }
      if (!cancelled) setLoading(false)
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  async function triggerDeploy(issueId: string) {
    setDeploying(issueId)
    const adminNotes = notesRefs.current[issueId]?.value ?? ''

    try {
      const res = await fetch('/api/admin/deploys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, adminNotes }),
      })

      if (res.ok) {
        setDeploySuccess(issueId)
        setTimeout(() => setDeploySuccess(null), 3000)
        fetchDeployData()
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        setDeployError(`Deploy failed: ${err.error ?? 'Unknown error'}`)
      }
    } catch {
      setDeployError('Deploy failed: Network error')
    }
    setDeploying(null)
  }

  const filteredQueue = severityFilter === 'all'
    ? queue
    : queue.filter(i => i.severity === severityFilter)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Deploys</h1>
        <p className="text-muted text-sm mt-1">AI-triaged issue queue and deployment management.</p>
      </div>

      {deployError && (
        <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>{deployError}</span>
          <button onClick={() => setDeployError(null)} className="text-red-400 hover:text-red-300 text-xs ml-4">Dismiss</button>
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-muted" />
              <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">Queue</span>
            </div>
            <p className="text-primary text-3xl font-bold">{stats.queueCount}</p>
            <p className="text-muted text-xs mt-1">triaged issues</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">Easy</span>
            </div>
            <p className="text-accent text-3xl font-bold">{stats.easyCount}</p>
            <p className="text-muted text-xs mt-1">quick fixes</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">Major</span>
            </div>
            <p className="text-red-400 text-3xl font-bold">{stats.majorCount}</p>
            <p className="text-muted text-xs mt-1">needs review</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-4 w-4 text-accent" />
              <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">Deploys</span>
            </div>
            <p className="text-primary text-3xl font-bold">{stats.deploysThisWeek}</p>
            <p className="text-muted text-xs mt-1">this week</p>
          </div>
        </div>
      )}

      {/* Deploy Queue */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">{filteredQueue.length} Queued Issue{filteredQueue.length !== 1 ? 's' : ''}</h2>
        <TacticalSelect
          value={severityFilter}
          onChange={val => { setSeverityFilter(val); setExpanded(null) }}
          options={FILTER_OPTIONS}
          className="text-xs"
        />
      </div>

      <div className="space-y-2 mb-10">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))
        ) : filteredQueue.length === 0 ? (
          <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
            <p className="text-muted text-sm">No triaged issues in the queue.</p>
          </div>
        ) : (
          filteredQueue.map(issue => (
            <div key={issue.id} className="rounded-lg border border-subtle bg-surface overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
                className="w-full text-left px-4 py-3 hover:bg-elevated/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-primary text-sm font-medium">{issue.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', MODULE_COLORS[issue.module] || 'bg-muted/15 text-muted')}>
                        {issue.module}
                      </span>
                      <span>{issue.members?.display_name || issue.members?.email || 'Unknown'}</span>
                      <span>&middot;</span>
                      <span>{issue.category}</span>
                      <span>&middot;</span>
                      <span>{new Date(issue.created_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {issue.github_issue_url && (
                        <a
                          href={issue.github_issue_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80 flex items-center gap-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {issue.severity && (
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded', SEVERITY_COLORS[issue.severity])}>
                        {issue.severity}
                      </span>
                    )}
                    <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', expanded === issue.id && 'rotate-180')} />
                  </div>
                </div>
              </button>

              {expanded === issue.id && (
                <div className={cn('px-4 pb-4 border-t border-subtle pt-3 space-y-3', deploying === issue.id && 'opacity-50')}>
                  {/* Description */}
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Description</p>
                    <p className="text-secondary text-sm whitespace-pre-wrap">{issue.description}</p>
                  </div>

                  {issue.page_url && (
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-1">Page URL</p>
                      <p className="text-accent text-sm">{issue.page_url}</p>
                    </div>
                  )}

                  {/* AI Proposed Fix */}
                  {issue.ai_proposed_fix && (
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-1">AI Proposed Fix</p>
                      <div className="rounded border border-subtle bg-base p-3">
                        <p className="text-secondary text-sm whitespace-pre-wrap font-mono">{issue.ai_proposed_fix}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Reasoning (from admin_notes) */}
                  {issue.admin_notes && (
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-1">AI Reasoning</p>
                      <p className="text-muted text-sm">{issue.admin_notes}</p>
                    </div>
                  )}

                  {/* Admin Deploy Notes */}
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Your Notes (sent to Claude Code)</p>
                    <textarea
                      ref={el => { notesRefs.current[issue.id] = el }}
                      defaultValue={issue.admin_deploy_notes || ''}
                      placeholder="Add context or instructions for the fix..."
                      className="w-full px-3 py-2 rounded border border-subtle bg-base text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent/40 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => triggerDeploy(issue.id)}
                      disabled={deploying === issue.id}
                      className="flex items-center gap-2 px-4 py-2 rounded bg-accent text-base font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      <Rocket className="h-4 w-4" />
                      {deploying === issue.id ? 'Triggering...' : 'Fix & Deploy'}
                    </button>

                    {deploySuccess === issue.id && (
                      <span className="text-accent text-sm flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        GitHub Action triggered
                      </span>
                    )}

                    {issue.github_issue_url && (
                      <a
                        href={issue.github_issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded border border-subtle text-secondary text-sm hover:bg-elevated/50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View on GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Deploy History */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Deploy History</h2>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))
        ) : history.length === 0 ? (
          <div className="rounded-lg border border-subtle bg-surface p-6 text-center">
            <p className="text-muted text-sm">No deploys yet.</p>
          </div>
        ) : (
          history.map(deploy => {
            const StatusIcon = DEPLOY_STATUS_ICONS[deploy.status] ?? Clock
            return (
              <div key={deploy.id} className="rounded-lg border border-subtle bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <StatusIcon className={cn('h-4 w-4 flex-shrink-0', deploy.status === 'success' ? 'text-accent' : deploy.status === 'failed' ? 'text-red-400' : 'text-amber-400')} />
                    <div className="min-w-0">
                      <p className="text-primary text-sm">
                        {deploy.admin_notes || `Deploy #${deploy.id.slice(0, 8)}`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                        <span>{new Date(deploy.created_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        {deploy.severity && (
                          <>
                            <span>&middot;</span>
                            <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded', SEVERITY_COLORS[deploy.severity] || 'bg-muted/15 text-muted')}>
                              {deploy.severity}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded', DEPLOY_STATUS_COLORS[deploy.status])}>
                      {deploy.status}
                    </span>
                    {deploy.github_pr_url && (
                      <a
                        href={deploy.github_pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent/80"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
