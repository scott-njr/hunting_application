'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'
import { ShareItemButton } from '@/components/fitness/coach/share-item-button'

export interface Meal {
  meal_number: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  title: string
  calories: number
  protein_g: number
  ingredients: string[]
  instructions: string
  estimated_cost_usd: number
}

interface MealCardProps {
  meal: Meal
  planId: string
  dayNumber: number
  isLogged: boolean
  compact?: boolean
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function MealCard({ meal, planId, dayNumber, isLogged, compact }: MealCardProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [logging, setLogging] = useState(false)
  const [logged, setLogged] = useState(isLogged)
  const [swapping, setSwapping] = useState(false)

  async function handleLog() {
    setLogging(true)
    if (logged) {
      // Uncheck — delete the log
      const res = await fetch(`/api/fitness/plans/${planId}/logs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_number: dayNumber,
          session_number: meal.meal_number,
        }),
      })
      if (res.ok) {
        setLogged(false)
        router.refresh()
      }
    } else {
      // Check — create the log
      const res = await fetch(`/api/fitness/plans/${planId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_number: dayNumber,
          session_number: meal.meal_number,
        }),
      })
      if (res.ok) {
        setLogged(true)
        router.refresh()
      }
    }
    setLogging(false)
  }

  async function handleSwap() {
    setSwapping(true)
    const res = await fetch(`/api/fitness/plans/${planId}/swap-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_number: dayNumber,
        meal_number: meal.meal_number,
      }),
    })
    if (res.ok) {
      router.refresh()
    }
    setSwapping(false)
  }

  return (
    <>
    <AIProgressModal
      open={swapping}
      featureLabel="Meal Swap"
      steps={['Finding alternatives…', 'Matching your macros…', 'Swapping meal…']}
    />
    <div className={`rounded border ${logged ? 'border-green-500/30 bg-green-950/10' : 'border-subtle bg-elevated'} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button
            onClick={handleLog}
            disabled={logging}
            className={`mt-0.5 h-7 w-7 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 ${
              logged
                ? 'bg-green-500/20 hover:bg-red-500/20'
                : 'border border-subtle hover:border-accent'
            }`}
            title={logged ? 'Unmark' : 'Mark as eaten'}
          >
            {logging ? (
              <span className="h-3 w-3 border border-accent/30 border-t-accent rounded-full animate-spin" />
            ) : logged ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : null}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-subtle text-muted uppercase font-medium">
                {MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className={`font-medium text-sm text-left ${logged ? 'text-muted line-through' : 'text-primary hover:text-accent'}`}
              >
                {meal.title}
              </button>
            </div>
            <div className="flex gap-3 mt-1 text-xs text-muted">
              <span>{meal.calories} cal</span>
              <span>{meal.protein_g}g protein</span>
              <span>${meal.estimated_cost_usd.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <ShareItemButton
              itemType="meal"
              itemSnapshot={meal as unknown as Record<string, unknown>}
              sourcePlanId={planId}
            />
            {!logged && (
              <button
                onClick={handleSwap}
                disabled={swapping}
                className="text-muted hover:text-secondary p-2 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-40"
                title="Swap meal"
              >
                {swapping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted hover:text-secondary p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-subtle space-y-2 text-sm">
          <div>
            <span className="text-muted text-xs font-medium uppercase">Ingredients</span>
            <ul className="mt-1 space-y-0.5">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="text-secondary text-xs">• {ing}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-muted text-xs font-medium uppercase">Instructions</span>
            <p className="text-secondary text-xs mt-1">{meal.instructions}</p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
