'use client'

import { useState } from 'react'
import { AlertTriangle, ExternalLink, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FailedRequest {
  id: string
  user_email: string
  user_name: string | null
  module: string
  feature: string
  flags: string[]
  sanitized_input: string | null
  raw_response: string | null
  duration_ms: number
  created_at: string
}

interface FailedRequestsPanelProps {
  failures: FailedRequest[]
  failedCount: number
}

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

export function FailedRequestsPanel({ failures, failedCount }: FailedRequestsPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [creatingIssue, setCreatingIssue] = useState<string | null>(null)

  async function createBugFromFailure(failure: FailedRequest) {
    setCreatingIssue(failure.id)
    const title = `[AI] ${failure.feature} failure (${failure.module})`
    const description = [
      `**Module:** ${failure.module}`,
      `**Feature:** ${failure.feature}`,
      `**User:** ${failure.user_name || failure.user_email}`,
      `**Timestamp:** ${new Date(failure.created_at).toLocaleString()}`,
      `**Duration:** ${failure.duration_ms}ms`,
      `**Flags:** ${failure.flags.length > 0 ? failure.flags.join(', ') : 'none'}`,
      '',
      `**User Input:**`,
      failure.sanitized_input ? '```\n' + failure.sanitized_input.slice(0, 500) + '\n```' : '(not captured)',
      '',
      `**AI Response (first 500 chars):**`,
      failure.raw_response ? '```\n' + failure.raw_response.slice(0, 500) + '\n```' : '(empty)',
    ].join('\n')

    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: failure.module,
        category: 'bug',
        title,
        description,
        page_url: '/admin/ai-logs',
      }),
    })

    if (res.ok) {
      alert('Bug issue created successfully')
    } else {
      alert('Failed to create issue')
    }
    setCreatingIssue(null)
  }

  return (
    <div className="rounded-lg border border-red-500/20 bg-surface p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <h2 className="text-sm font-semibold">Failed Requests</h2>
        <span className="text-[10px] font-semibold bg-red-500/15 text-red-400 px-2 py-0.5 rounded">
          {failedCount} this month
        </span>
      </div>

      <div className="space-y-2">
        {failures.map(failure => (
          <div key={failure.id} className="rounded border border-red-500/20 bg-base overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === failure.id ? null : failure.id)}
              className="w-full text-left px-3 py-2.5 hover:bg-elevated/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                  <span className="text-primary text-sm font-medium">{failure.feature}</span>
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', MODULE_COLORS[failure.module] || 'bg-muted/15 text-muted')}>
                    {failure.module}
                  </span>
                  {failure.flags.map(f => (
                    <span key={f} className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', FLAG_COLORS[f] || 'bg-muted/15 text-muted')}>
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-muted text-xs">
                    {new Date(failure.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', expanded === failure.id && 'rotate-180')} />
                </div>
              </div>
              <p className="text-muted text-xs mt-0.5">
                {failure.user_name || failure.user_email} &middot; {failure.duration_ms}ms
              </p>
            </button>

            {expanded === failure.id && (
              <div className="px-3 pb-3 border-t border-subtle pt-3 space-y-3">
                {failure.sanitized_input && (
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">User Input</p>
                    <pre className="text-secondary text-xs bg-elevated rounded p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words border border-subtle">
                      {failure.sanitized_input}
                    </pre>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Raw AI Response</p>
                  {failure.raw_response ? (
                    <pre className="text-secondary text-xs bg-elevated rounded p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words border border-subtle">
                      {failure.raw_response.slice(0, 1000)}
                    </pre>
                  ) : (
                    <p className="text-muted text-xs italic">Empty response</p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-subtle">
                  <button
                    onClick={() => createBugFromFailure(failure)}
                    disabled={creatingIssue === failure.id}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {creatingIssue === failure.id ? 'Creating...' : 'Create Bug'}
                  </button>
                  <span className="text-muted text-xs">ID: {failure.id.slice(0, 8)}...</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {failures.length === 0 && (
          <p className="text-muted text-xs">No recent failures.</p>
        )}
      </div>
    </div>
  )
}
