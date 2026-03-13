'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, Check, X, ChevronDown, ChevronUp, Calendar, Dumbbell } from 'lucide-react'

interface WeekPreview {
  theme: string | null
  session_count: number
}

interface PendingShare {
  id: string
  source_plan_id: string
  source_user_id: string
  status: string
  partner_name: string
  plan_type: string | null
  plan_goal: string | null
  weeks_total: number | null
  total_sessions: number | null
  week_previews: WeekPreview[] | null
}

export function SharedPlanInbox({ hasActivePlanTypes }: { hasActivePlanTypes: string[] }) {
  const router = useRouter()
  const [shares, setShares] = useState<PendingShare[]>([])
  const [responding, setResponding] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/fitness/plans/share?direction=received')
      .then(r => r.json())
      .then(d => {
        const pending = (d.shares ?? []).filter((s: PendingShare) => s.status === 'pending')
        setShares(pending)
      })
  }, [])

  async function respond(shareId: string, action: 'accept' | 'decline') {
    setResponding(shareId)
    setError(null)
    try {
      const res = await fetch('/api/fitness/plans/share/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_id: shareId, action }),
      })

      if (res.ok) {
        setShares(prev => prev.filter(s => s.id !== shareId))
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('Failed to respond to share:', err)
      setError('Network error. Please try again.')
    } finally {
      setResponding(null)
    }
  }

  if (shares.length === 0) return null

  const planTypeLabel: Record<string, string> = { run: 'Run', strength: 'Strength', meal: 'Meal' }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {shares.map(share => {
        const willReplace = share.plan_type && hasActivePlanTypes.includes(share.plan_type)
        const isExpanded = expanded === share.id
        const hasPreview = share.weeks_total || share.total_sessions || share.week_previews?.length

        return (
          <div key={share.id} className="rounded-lg border border-accent/30 bg-surface overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Share2 className="h-4 w-4 text-accent flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-primary text-sm">
                    <span className="font-medium">{share.partner_name}</span>
                    {' shared their '}
                    <span className="font-medium">{share.plan_type ? planTypeLabel[share.plan_type] ?? share.plan_type : ''} Plan</span>
                  </p>
                  {share.plan_goal && (
                    <p className="text-muted text-xs truncate">{share.plan_goal}</p>
                  )}
                  {willReplace && (
                    <p className="text-amber-400 text-xs mt-0.5">
                      Accepting will replace your current {planTypeLabel[share.plan_type!] ?? share.plan_type} plan
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {hasPreview && (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : share.id)}
                    className="px-2 py-1.5 text-xs rounded border border-subtle text-muted hover:text-secondary hover:border-default transition-colors"
                    title="Preview plan"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
                <button
                  onClick={() => respond(share.id, 'accept')}
                  disabled={responding === share.id}
                  className="btn-primary px-3 py-1.5 text-xs rounded flex items-center gap-1 disabled:opacity-40"
                >
                  <Check className="h-3 w-3" />
                  Accept
                </button>
                <button
                  onClick={() => respond(share.id, 'decline')}
                  disabled={responding === share.id}
                  className="px-3 py-1.5 text-xs rounded border border-subtle text-muted hover:text-secondary hover:border-default transition-colors disabled:opacity-40"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {isExpanded && hasPreview && (
              <div className="px-4 pb-4 pt-0 border-t border-subtle">
                <div className="flex items-center gap-4 text-xs text-secondary mt-3 mb-2">
                  {share.weeks_total && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted" />
                      {share.weeks_total} weeks
                    </span>
                  )}
                  {share.total_sessions && (
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3 text-muted" />
                      {share.total_sessions} sessions
                    </span>
                  )}
                </div>
                {share.week_previews && share.week_previews.length > 0 && (
                  <div className="space-y-1">
                    {share.week_previews.map((w, i) => (
                      <div key={i} className="text-xs text-muted">
                        <span className="text-secondary">Week {i + 1}</span>
                        {w.theme && <span> — {w.theme}</span>}
                        <span className="text-muted/60"> · {w.session_count} sessions</span>
                      </div>
                    ))}
                    {(share.weeks_total ?? 0) > 2 && (
                      <p className="text-xs text-muted/50">+ {(share.weeks_total ?? 0) - 2} more weeks</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
