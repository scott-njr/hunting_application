'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'

interface AILog {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  module: string
  feature: string
  input_length: number
  output_length: number
  raw_response: string | null
  tokens_input: number | null
  tokens_output: number | null
  parse_success: boolean
  flags: string[]
  duration_ms: number
  sanitized_input: string | null
  created_at: string
}

const MODULE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'hunting', label: 'Hunting' },
  { value: 'archery', label: 'Archery' },
  { value: 'firearms', label: 'Firearms' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'medical', label: 'Medical' },
]

const SUCCESS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Success' },
  { value: 'false', label: 'Failed' },
]

const MODULE_COLORS: Record<string, string> = {
  hunting: 'bg-amber-500/15 text-amber-400',
  archery: 'bg-red-500/15 text-red-400',
  firearms: 'bg-orange-500/15 text-orange-400',
  fishing: 'bg-blue-500/15 text-blue-400',
  fitness: 'bg-accent/15 text-accent',
  medical: 'bg-rose-500/15 text-rose-400',
}

const FLAG_COLORS: Record<string, string> = {
  parse_failed: 'bg-red-500/15 text-red-400',
  api_error: 'bg-red-500/15 text-red-400',
  billing_error: 'bg-red-500/15 text-red-400',
  truncated: 'bg-amber-500/15 text-amber-400',
  rate_limited: 'bg-amber-500/15 text-amber-400',
  prompt_injection: 'bg-orange-500/15 text-orange-400',
  sql_injection: 'bg-orange-500/15 text-orange-400',
  xss_detected: 'bg-orange-500/15 text-orange-400',
  content_filtered: 'bg-orange-500/15 text-orange-400',
}

export default function AdminAILogsPage() {
  const [logs, setLogs] = useState<AILog[]>([])
  const [total, setTotal] = useState(0)
  const [features, setFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [moduleFilter, setModuleFilter] = useState('all')
  const [featureFilter, setFeatureFilter] = useState('all')
  const [successFilter, setSuccessFilter] = useState('all')
  const [creatingIssue, setCreatingIssue] = useState<string | null>(null)
  const limit = 50

  useEffect(() => {
    let cancelled = false
    async function loadLogs() {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (moduleFilter !== 'all') params.set('module', moduleFilter)
      if (featureFilter !== 'all') params.set('feature', featureFilter)
      if (successFilter !== 'all') params.set('success', successFilter)

      const res = await fetch(`/api/admin/ai-logs?${params}`)
      if (!cancelled && res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
        if (data.features) setFeatures(data.features)
      }
      if (!cancelled) setLoading(false)
    }
    loadLogs()
    return () => { cancelled = true }
  }, [page, moduleFilter, featureFilter, successFilter])

  const totalPages = Math.ceil(total / limit)

  const featureOptions = [
    { value: 'all', label: 'All Features' },
    ...features.map(f => ({ value: f, label: f })),
  ]

  async function createIssueFromLog(log: AILog) {
    setCreatingIssue(log.id)
    const title = `[AI] ${log.feature} parse failure (${log.module})`
    const description = [
      `**Module:** ${log.module}`,
      `**Feature:** ${log.feature}`,
      `**User:** ${log.user_name || log.user_email}`,
      `**Timestamp:** ${new Date(log.created_at).toLocaleString()}`,
      `**Duration:** ${log.duration_ms}ms`,
      `**Flags:** ${log.flags.length > 0 ? log.flags.join(', ') : 'none'}`,
      '',
      `**User Input:**`,
      log.sanitized_input ? '```\n' + log.sanitized_input.slice(0, 500) + '\n```' : '(not captured)',
      '',
      `**AI Response (first 500 chars):**`,
      log.raw_response ? '```\n' + log.raw_response.slice(0, 500) + '\n```' : '(empty)',
    ].join('\n')

    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: log.module,
        category: 'bug',
        title,
        description,
        page_url: `/admin/ai-logs`,
      }),
    })

    if (res.ok) {
      alert('Issue created successfully')
    } else {
      alert('Failed to create issue')
    }
    setCreatingIssue(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Logs</h1>
          <p className="text-muted text-sm mt-1">{total} response{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <TacticalSelect
            value={moduleFilter}
            onChange={val => { setModuleFilter(val); setPage(1); setExpanded(null) }}
            options={MODULE_FILTER_OPTIONS}
            className="text-xs"
          />
          <TacticalSelect
            value={featureFilter}
            onChange={val => { setFeatureFilter(val); setPage(1); setExpanded(null) }}
            options={featureOptions}
            className="text-xs"
          />
          <TacticalSelect
            value={successFilter}
            onChange={val => { setSuccessFilter(val); setPage(1); setExpanded(null) }}
            options={SUCCESS_FILTER_OPTIONS}
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))
        ) : logs.length === 0 ? (
          <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
            <p className="text-muted text-sm">No AI responses found.</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={cn(
              'rounded-lg border bg-surface overflow-hidden',
              !log.parse_success ? 'border-red-500/30' : 'border-subtle'
            )}>
              <button
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="w-full text-left px-4 py-3 hover:bg-elevated/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {log.parse_success ? (
                      <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-primary text-sm font-medium">{log.feature}</span>
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', MODULE_COLORS[log.module] || 'bg-muted/15 text-muted')}>
                          {log.module}
                        </span>
                        {log.flags.map(f => (
                          <span key={f} className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', FLAG_COLORS[f] || 'bg-muted/15 text-muted')}>
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                        <span>{log.user_name || log.user_email || 'Unknown'}</span>
                        <span>·</span>
                        <span>{new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{log.duration_ms}ms</span>
                        <span>·</span>
                        <span>{((log.tokens_input ?? 0) + (log.tokens_output ?? 0)).toLocaleString()} tok</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {expanded === log.id && (
                <div className="px-4 pb-4 border-t border-subtle pt-3 space-y-3">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Input Tokens</p>
                      <p className="text-secondary text-sm">{(log.tokens_input ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Output Tokens</p>
                      <p className="text-secondary text-sm">{(log.tokens_output ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Input Length</p>
                      <p className="text-secondary text-sm">{log.input_length.toLocaleString()} chars</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Output Length</p>
                      <p className="text-secondary text-sm">{log.output_length.toLocaleString()} chars</p>
                    </div>
                  </div>

                  {/* User Input */}
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">User Input (sanitized)</p>
                    {log.sanitized_input ? (
                      <pre className="text-secondary text-xs bg-base rounded p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words border border-subtle">{log.sanitized_input}</pre>
                    ) : (
                      <p className="text-muted text-xs italic">Not captured</p>
                    )}
                  </div>

                  {/* Raw Response */}
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Raw AI Response</p>
                    {log.raw_response ? (
                      <pre className="text-secondary text-xs bg-base rounded p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words border border-subtle">{log.raw_response}</pre>
                    ) : (
                      <p className="text-muted text-xs italic">Empty response</p>
                    )}
                  </div>

                  {/* Flags */}
                  {log.flags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-1">Flags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {log.flags.map(f => (
                          <span key={f} className={cn('text-xs font-medium px-2 py-0.5 rounded', FLAG_COLORS[f] || 'bg-muted/15 text-muted')}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2 border-t border-subtle">
                    <button
                      onClick={() => createIssueFromLog(log)}
                      disabled={creatingIssue === log.id}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {creatingIssue === log.id ? 'Creating...' : 'Create Issue'}
                    </button>
                    <span className="text-muted text-xs">ID: {log.id.slice(0, 8)}...</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-muted text-xs">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); setExpanded(null) }}
              disabled={page <= 1}
              className="p-1.5 rounded text-muted hover:text-primary transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setExpanded(null) }}
              disabled={page >= totalPages}
              className="p-1.5 rounded text-muted hover:text-primary transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
