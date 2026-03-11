'use client'

import { History } from 'lucide-react'
import Link from 'next/link'

export function PlanHistoryButton({ planType }: { planType: 'run' | 'strength' | 'meal' }) {
  return (
    <Link
      href={`/fitness/plan-history?type=${planType}`}
      className="flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors"
      title="Plan history"
    >
      <History className="h-3.5 w-3.5" />
      History
    </Link>
  )
}
