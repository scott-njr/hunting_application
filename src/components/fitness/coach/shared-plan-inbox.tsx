'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, Check, X } from 'lucide-react'

interface PendingShare {
  id: string
  source_plan_id: string
  source_user_id: string
  status: string
  partner_name: string
  plan_type: string | null
  plan_goal: string | null
}

export function SharedPlanInbox({ hasActivePlanTypes }: { hasActivePlanTypes: string[] }) {
  const router = useRouter()
  const [shares, setShares] = useState<PendingShare[]>([])
  const [responding, setResponding] = useState<string | null>(null)

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
    try {
      const res = await fetch('/api/fitness/plans/share/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_id: shareId, action }),
      })

      if (res.ok) {
        setShares(prev => prev.filter(s => s.id !== shareId))
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to respond to share:', err)
    } finally {
      setResponding(null)
    }
  }

  if (shares.length === 0) return null

  const planTypeLabel: Record<string, string> = { run: 'Run', strength: 'Strength', meal: 'Meal' }

  return (
    <div className="space-y-2">
      {shares.map(share => {
        const willReplace = share.plan_type && hasActivePlanTypes.includes(share.plan_type)
        return (
          <div key={share.id} className="rounded-lg border border-accent/30 bg-surface p-4 flex items-center justify-between gap-4">
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
        )
      })}
    </div>
  )
}
