'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Share2, ArrowUpRight } from 'lucide-react'

interface ShareRecord {
  id: string
  status: string
  direction: string
  partner_name: string
  plan_type: string | null
  plan_goal: string | null
  created_on: string
}

export function SharedPlansList() {
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/fitness/plans/share?direction=all')
      .then(r => r.json())
      .then(d => {
        const accepted = (d.shares ?? []).filter((s: ShareRecord) => s.status === 'accepted')
        setShares(accepted)
        setLoaded(true)
      })
  }, [])

  if (!loaded || shares.length === 0) return null

  const planTypeLabel: Record<string, string> = { run: 'Run', strength: 'Strength', meal: 'Meal' }

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-accent" />
        <h3 className="text-primary font-bold text-sm">Shared Plans</h3>
      </div>

      <div className="space-y-2">
        {shares.map(share => (
          <div key={share.id} className="flex items-center justify-between gap-3 rounded border border-subtle bg-elevated p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface border border-subtle text-muted uppercase font-medium">
                  {share.plan_type ? planTypeLabel[share.plan_type] ?? share.plan_type : '—'}
                </span>
                <span className="text-primary text-sm font-medium truncate">
                  {share.direction === 'sent' ? `Shared with ${share.partner_name}` : `From ${share.partner_name}`}
                </span>
              </div>
              {share.plan_goal && (
                <p className="text-muted text-xs mt-0.5 truncate">{share.plan_goal}</p>
              )}
            </div>

            <Link
              href={`/fitness/compare/${share.id}`}
              className="flex items-center gap-1 text-accent hover:text-primary text-xs font-medium whitespace-nowrap transition-colors"
            >
              Compare
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
