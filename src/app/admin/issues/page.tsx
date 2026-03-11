'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { CheckCircle, Clock, ChevronDown, Save, Zap, ExternalLink } from 'lucide-react'

interface Issue {
  id: string
  user_id: string
  module: string
  category: string
  title: string
  description: string
  page_url: string | null
  status: string
  admin_notes: string | null
  resolution: string | null
  resolved_at: string | null
  release_tag: string | null
  severity: 'easy' | 'major' | null
  ai_proposed_fix: string | null
  ai_classified_at: string | null
  github_issue_url: string | null
  created_at: string
  members: { email: string; full_name: string | null } | null
}

interface Stats {
  totalResolved: number
  resolvedThisMonth: number
  avgResolutionDays: number
  byModule: Record<string, number>
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'wont_fix', label: "Won't Fix" },
]

const FILTER_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
]

const MODULE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'hunting', label: 'Hunting' },
  { value: 'archery', label: 'Archery' },
  { value: 'firearms', label: 'Firearms' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'medical', label: 'Medical' },
]

const MODULE_COLORS: Record<string, string> = {
  hunting: 'bg-amber-500/15 text-amber-400',
  archery: 'bg-red-500/15 text-red-400',
  firearms: 'bg-orange-500/15 text-orange-400',
  fishing: 'bg-blue-500/15 text-blue-400',
  fitness: 'bg-accent/15 text-accent',
  medical: 'bg-rose-500/15 text-rose-400',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/15 text-red-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  resolved: 'bg-accent/15 text-accent',
  wont_fix: 'bg-muted/15 text-muted',
}

const SEVERITY_COLORS: Record<string, string> = {
  easy: 'bg-accent/15 text-accent',
  major: 'bg-red-500/15 text-red-400',
}

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-500/15 text-red-400',
  feature_request: 'bg-blue-500/15 text-blue-400',
  content_error: 'bg-amber-500/15 text-amber-400',
  other: 'bg-muted/15 text-muted',
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState('open')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [triaging, setTriaging] = useState<string | null>(null)
  const [triageSuccess, setTriageSuccess] = useState<string | null>(null)

  // Stats & changelog state
  const [stats, setStats] = useState<Stats | null>(null)
  const [resolvedIssues, setResolvedIssues] = useState<Issue[]>([])
  const [changelogExpanded, setChangelogExpanded] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Refs for textarea values
  const notesRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const resolutionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const releaseTagRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadIssues = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ status: filter })
    if (moduleFilter !== 'all') params.set('module', moduleFilter)
    const res = await fetch(`/api/admin/issues?${params}`)
    if (res.ok) {
      const data = await res.json()
      setIssues(data.issues)
    }
    setLoading(false)
  }, [filter, moduleFilter])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    const res = await fetch('/api/admin/issues?status=all&include_stats=true')
    if (res.ok) {
      const data = await res.json()
      setStats(data.stats)
      setResolvedIssues(data.resolvedIssues ?? [])
    }
    setStatsLoading(false)
  }, [])

  useEffect(() => { loadIssues() }, [loadIssues])
  useEffect(() => { loadStats() }, [loadStats])

  async function updateIssue(issueId: string, updates: Record<string, unknown>) {
    setSaving(issueId)
    const res = await fetch('/api/admin/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueId, ...updates }),
    })
    if (res.ok) {
      setIssues(prev => prev.map(i =>
        i.id === issueId ? { ...i, ...updates } as Issue : i
      ))
    }
    setSaving(null)
  }

  async function saveField(issueId: string, field: string, value: string | null) {
    setSaving(issueId)
    const res = await fetch('/api/admin/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueId, [field]: value }),
    })
    if (res.ok) {
      setIssues(prev => prev.map(i =>
        i.id === issueId ? { ...i, [field]: value } as Issue : i
      ))
      setSavedField(`${issueId}:${field}`)
      setTimeout(() => setSavedField(null), 2000)
    }
    setSaving(null)
  }

  async function triageIssue(issueId: string) {
    setTriaging(issueId)
    const res = await fetch('/api/admin/issues/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueId }),
    })
    if (res.ok) {
      const data = await res.json()
      setIssues(prev => prev.map(i =>
        i.id === issueId ? {
          ...i,
          severity: data.severity,
          ai_proposed_fix: data.proposedFix || null,
          ai_classified_at: data.ai_classified_at,
          github_issue_url: data.githubIssueUrl || i.github_issue_url,
          admin_notes: data.reasoning ? `AI Reasoning: ${data.reasoning}` : i.admin_notes,
        } : i
      ))
      setTriageSuccess(issueId)
      setTimeout(() => setTriageSuccess(null), 3000)
    } else {
      const err = await res.json()
      alert(`Triage failed: ${err.error ?? 'Unknown error'}`)
    }
    setTriaging(null)
  }

  // Group resolved issues by release_tag
  const releaseGroups = useMemo(() => {
    const groups = new Map<string, Issue[]>()
    for (const issue of resolvedIssues) {
      const tag = issue.release_tag || 'Untagged'
      const list = groups.get(tag) ?? []
      list.push(issue)
      groups.set(tag, list)
    }
    return Array.from(groups.entries()).sort(([a, aIssues], [b, bIssues]) => {
      if (a === 'Untagged') return 1
      if (b === 'Untagged') return -1
      const aDate = Math.max(...aIssues.map(i => new Date(i.resolved_at!).getTime()))
      const bDate = Math.max(...bIssues.map(i => new Date(i.resolved_at!).getTime()))
      return bDate - aDate
    })
  }, [resolvedIssues])

  const totalByModule = stats?.byModule ?? {}
  const maxModuleCount = Math.max(...Object.values(totalByModule), 1)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Issues</h1>
        <p className="text-muted text-sm mt-1">Issue tracking, resolution stats, and release changelog.</p>
      </div>

      {/* Summary Stats Dashboard */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">Total Resolved</span>
            </div>
            <p className="text-primary text-3xl font-bold">{stats.totalResolved}</p>
            <p className="text-muted text-xs mt-1">all time</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">Resolved This Month</span>
            </div>
            <p className="text-primary text-3xl font-bold">{stats.resolvedThisMonth}</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted" />
              <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">Avg Resolution</span>
            </div>
            <p className="text-primary text-3xl font-bold">
              {stats.avgResolutionDays < 1
                ? `${Math.round(stats.avgResolutionDays * 24)}h`
                : `${stats.avgResolutionDays}d`}
            </p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface p-5">
            <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">By Module</span>
            <div className="mt-2 space-y-1.5">
              {Object.entries(totalByModule).sort((a, b) => b[1] - a[1]).map(([mod, count]) => (
                <div key={mod}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-secondary capitalize">{mod}</span>
                    <span className="text-muted">{count}</span>
                  </div>
                  <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent/40"
                      style={{ width: `${(count / maxModuleCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(totalByModule).length === 0 && (
                <p className="text-muted text-xs">No data yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Release Changelog */}
      {releaseGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Release Changelog</h2>
          <div className="space-y-2">
            {releaseGroups.map(([tag, groupIssues]) => {
              const newestDate = Math.max(...groupIssues.map(i => new Date(i.resolved_at!).getTime()))
              return (
                <div key={tag} className="rounded-lg border border-subtle bg-surface overflow-hidden">
                  <button
                    onClick={() => setChangelogExpanded(changelogExpanded === tag ? null : tag)}
                    className="w-full text-left px-4 py-3 hover:bg-elevated/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-sm font-semibold',
                          tag === 'Untagged' ? 'text-muted' : 'text-primary'
                        )}>
                          {tag}
                        </span>
                        <span className="text-[10px] font-semibold bg-accent/15 text-accent px-2 py-0.5 rounded">
                          {groupIssues.length} fix{groupIssues.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted text-xs">
                          {new Date(newestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', changelogExpanded === tag && 'rotate-180')} />
                      </div>
                    </div>
                  </button>

                  {changelogExpanded === tag && (
                    <div className="px-4 pb-4 border-t border-subtle pt-3 space-y-2">
                      {groupIssues.map(issue => (
                        <div key={issue.id} className="flex items-start gap-2 py-1.5 border-b border-subtle last:border-0">
                          <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-primary text-sm">{issue.title}</span>
                              <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', MODULE_COLORS[issue.module] || 'bg-muted/15 text-muted')}>
                                {issue.module}
                              </span>
                              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', CATEGORY_COLORS[issue.category] || 'bg-muted/15 text-muted')}>
                                {issue.category.replace('_', ' ')}
                              </span>
                            </div>
                            {issue.resolution && (
                              <p className="text-muted text-xs mt-0.5">{issue.resolution}</p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                              <span>{issue.members?.full_name || issue.members?.email || 'Unknown'}</span>
                              <span>&middot;</span>
                              <span>Resolved {new Date(issue.resolved_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Issues */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">{issues.length} Active Issue{issues.length !== 1 ? 's' : ''}</h2>
        <div className="flex items-center gap-2">
          <TacticalSelect
            value={moduleFilter}
            onChange={val => { setModuleFilter(val); setExpanded(null) }}
            options={MODULE_FILTER_OPTIONS}
            className="text-xs"
          />
          <TacticalSelect
            value={filter}
            onChange={val => { setFilter(val); setExpanded(null) }}
            options={FILTER_OPTIONS}
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))
        ) : issues.length === 0 ? (
          <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
            <p className="text-muted text-sm">No issues found.</p>
          </div>
        ) : (
          issues.map(issue => (
            <div key={issue.id} className="rounded-lg border border-subtle bg-surface overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
                className="w-full text-left px-4 py-3 hover:bg-elevated/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-primary text-sm font-medium">{issue.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', MODULE_COLORS[issue.module] || 'bg-muted/15 text-muted')}>
                        {issue.module}
                      </span>
                      <span>{issue.members?.full_name || issue.members?.email || 'Unknown'}</span>
                      <span>&middot;</span>
                      <span>{issue.category}</span>
                      <span>&middot;</span>
                      <span>{new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {issue.severity && (
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded', SEVERITY_COLORS[issue.severity])}>
                        {issue.severity}
                      </span>
                    )}
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded', STATUS_COLORS[issue.status] || STATUS_COLORS.open)}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </button>

              {expanded === issue.id && (
                <div className={cn('px-4 pb-4 border-t border-subtle pt-3 space-y-3', saving === issue.id && 'opacity-50')}>
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

                  {/* AI Triage Section */}
                  <div className="rounded border border-subtle bg-base p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted uppercase tracking-wider">AI Triage</p>
                      <div className="flex items-center gap-2">
                        {issue.ai_classified_at && issue.severity && (
                          <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded', SEVERITY_COLORS[issue.severity])}>
                            {issue.severity}
                          </span>
                        )}
                        <button
                          onClick={() => triageIssue(issue.id)}
                          disabled={triaging === issue.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors disabled:opacity-50"
                        >
                          <Zap className="h-3 w-3" />
                          {triaging === issue.id ? 'Triaging...' : issue.ai_classified_at ? 'Re-triage' : 'Triage'}
                        </button>
                        {triageSuccess === issue.id && (
                          <span className="text-accent text-xs flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                    {issue.ai_proposed_fix && (
                      <div>
                        <p className="text-xs text-muted mb-1">Proposed Fix</p>
                        <p className="text-secondary text-sm whitespace-pre-wrap font-mono">{issue.ai_proposed_fix}</p>
                      </div>
                    )}
                    {issue.github_issue_url && (
                      <a
                        href={issue.github_issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent text-xs hover:text-accent/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                        GitHub Issue
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted uppercase tracking-wider">Status</p>
                    <TacticalSelect
                      value={issue.status}
                      onChange={val => updateIssue(issue.id, { status: val })}
                      options={STATUS_OPTIONS}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Release Tag</p>
                    <div className="flex items-center gap-2">
                      <input
                        ref={el => { releaseTagRefs.current[issue.id] = el }}
                        type="text"
                        defaultValue={issue.release_tag || ''}
                        placeholder="e.g., v1.2.0"
                        className="flex-1 px-3 py-2 rounded border border-subtle bg-base text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent/40"
                      />
                      <button
                        onClick={() => {
                          const val = releaseTagRefs.current[issue.id]?.value ?? ''
                          saveField(issue.id, 'release_tag', val || null)
                        }}
                        disabled={saving === issue.id}
                        className="flex items-center gap-1 px-3 py-2 rounded bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                      {savedField === `${issue.id}:release_tag` && (
                        <span className="text-accent text-xs">Saved</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Admin Notes</p>
                    <textarea
                      ref={el => { notesRefs.current[issue.id] = el }}
                      defaultValue={issue.admin_notes || ''}
                      placeholder="Internal notes..."
                      className="w-full px-3 py-2 rounded border border-subtle bg-base text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent/40 resize-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          const val = notesRefs.current[issue.id]?.value ?? ''
                          saveField(issue.id, 'admin_notes', val)
                        }}
                        disabled={saving === issue.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                      {savedField === `${issue.id}:admin_notes` && (
                        <span className="text-accent text-xs">Saved</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Resolution</p>
                    <textarea
                      ref={el => { resolutionRefs.current[issue.id] = el }}
                      defaultValue={issue.resolution || ''}
                      placeholder="Resolution description (visible to user)..."
                      className="w-full px-3 py-2 rounded border border-subtle bg-base text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent/40 resize-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => {
                          const val = resolutionRefs.current[issue.id]?.value ?? ''
                          saveField(issue.id, 'resolution', val)
                        }}
                        disabled={saving === issue.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                      {savedField === `${issue.id}:resolution` && (
                        <span className="text-accent text-xs">Saved</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
