'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Circle, Activity, Dumbbell, UtensilsCrossed, Loader2 } from 'lucide-react'

type ChecklistItem = {
  id: string
  planId: string
  weekNumber: number
  sessionNumber: number
  label: string
  sublabel?: string
  type: 'run' | 'strength' | 'meal'
  isCompleted: boolean
}

const TYPE_ICONS = {
  run: Activity,
  strength: Dumbbell,
  meal: UtensilsCrossed,
}

export function TodayChecklist({ items }: { items: ChecklistItem[] }) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(
    new Set(items.filter(i => i.isCompleted).map(i => i.id))
  )

  async function toggleItem(item: ChecklistItem) {
    setToggling(item.id)
    const isCompleted = localCompleted.has(item.id)

    try {
      if (isCompleted) {
        // Unlog
        await fetch(`/api/fitness/plans/${item.planId}/logs`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week_number: item.weekNumber,
            session_number: item.sessionNumber,
          }),
        })
        setLocalCompleted(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      } else {
        // Log
        await fetch(`/api/fitness/plans/${item.planId}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week_number: item.weekNumber,
            session_number: item.sessionNumber,
          }),
        })
        setLocalCompleted(prev => new Set(prev).add(item.id))
      }
      router.refresh()
    } catch {
      // revert on error
    } finally {
      setToggling(null)
    }
  }

  const completedCount = [...localCompleted].filter(id => items.some(i => i.id === id)).length
  const allDone = completedCount === items.length && items.length > 0

  if (items.length === 0) {
    return (
      <p className="text-muted text-sm">Rest day — no sessions scheduled.</p>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => {
        const Icon = TYPE_ICONS[item.type]
        const completed = localCompleted.has(item.id)
        const isToggling = toggling === item.id

        return (
          <button
            key={item.id}
            onClick={() => toggleItem(item)}
            disabled={isToggling}
            className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              completed
                ? 'border-green-500/30 bg-green-950/10'
                : 'border-subtle bg-elevated hover:border-accent/30'
            }`}
          >
            <div className="shrink-0">
              {isToggling ? (
                <Loader2 className="h-5 w-5 text-muted animate-spin" />
              ) : completed ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted" />
              )}
            </div>
            <Icon className={`h-4 w-4 shrink-0 ${completed ? 'text-green-400/60' : 'text-accent'}`} />
            <div className="min-w-0 flex-1">
              <span className={`text-sm font-medium ${completed ? 'text-muted line-through' : 'text-primary'}`}>
                {item.label}
              </span>
              {item.sublabel && (
                <span className={`block text-xs ${completed ? 'text-muted/60' : 'text-muted'}`}>
                  {item.sublabel}
                </span>
              )}
            </div>
          </button>
        )
      })}
      {allDone && (
        <p className="text-xs text-green-400 text-center pt-1">All done for today!</p>
      )}
    </div>
  )
}
