'use client'

import { useState, useEffect } from 'react'
import { Share2, ChevronDown, ChevronUp } from 'lucide-react'

interface SharedItem {
  id: string
  sender_id: string
  sender_name: string
  item_type: 'run_session' | 'strength_session' | 'meal'
  item_snapshot: Record<string, unknown>
  message: string | null
  created_on: string
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  run_session: 'Run',
  strength_session: 'Strength',
  meal: 'Meal',
}

export function SharedItemsInbox() {
  const [items, setItems] = useState<SharedItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/fitness/plans/share-item?limit=10')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
  }, [])

  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs text-muted uppercase font-medium tracking-wide">Shared with You</h3>
      {items.map(item => {
        const expanded = expandedId === item.id
        const snapshot = item.item_snapshot
        const title = (snapshot.title as string) ?? 'Untitled'

        return (
          <div key={item.id} className="rounded-lg border border-subtle bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Share2 className="h-4 w-4 text-accent flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-primary text-sm">
                    <span className="font-medium">{item.sender_name}</span>
                    {' shared a '}
                    <span className="font-medium">{ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}</span>
                  </p>
                  <p className="text-secondary text-xs truncate">{title}</p>
                  {item.message && (
                    <p className="text-muted text-xs italic mt-0.5">&ldquo;{item.message}&rdquo;</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExpandedId(expanded ? null : item.id)}
                className="text-muted hover:text-secondary p-1 flex-shrink-0"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-subtle text-sm space-y-2">
                {item.item_type === 'meal' ? (
                  <MealSnapshot snapshot={snapshot} />
                ) : (
                  <SessionSnapshot snapshot={snapshot} itemType={item.item_type} />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SessionSnapshot({ snapshot, itemType }: { snapshot: Record<string, unknown>; itemType: string }) {
  const isStrength = itemType === 'strength_session'
  const exercises = (snapshot.exercises ?? []) as Array<{ name: string; sets: number; reps: string; notes?: string }>
  const desc = snapshot.description as string | undefined
  const dist = snapshot.distance_miles as number | undefined
  const dur = snapshot.duration_min as number | undefined
  const effort = snapshot.effort_level as string | undefined

  return (
    <>
      {desc ? <p className="text-secondary text-xs">{desc}</p> : null}
      <div className="flex gap-3 text-xs text-muted">
        {dist ? <span>{dist} mi</span> : null}
        {dur ? <span>{dur} min</span> : null}
        {effort ? <span>{effort}</span> : null}
      </div>
      {isStrength && exercises.length > 0 && (
        <div className="space-y-1">
          <span className="text-muted text-xs font-medium uppercase">Exercises</span>
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-baseline gap-2 text-secondary text-xs">
              <span className="text-primary font-medium">{ex.name}</span>
              <span className="text-muted">&mdash;</span>
              <span>{ex.sets} &times; {ex.reps}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function MealSnapshot({ snapshot }: { snapshot: Record<string, unknown> }) {
  const ingredients = (snapshot.ingredients ?? []) as string[]
  const cal = snapshot.calories as number | undefined
  const protein = snapshot.protein_g as number | undefined
  const cost = snapshot.estimated_cost_usd as number | undefined
  const instructions = snapshot.instructions as string | undefined

  return (
    <>
      <div className="flex gap-3 text-xs text-muted">
        {cal ? <span>{cal} cal</span> : null}
        {protein ? <span>{protein}g protein</span> : null}
        {cost ? <span>${cost.toFixed(2)}</span> : null}
      </div>
      {ingredients.length > 0 && (
        <div>
          <span className="text-muted text-xs font-medium uppercase">Ingredients</span>
          <ul className="mt-1 space-y-0.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-secondary text-xs">&bull; {ing}</li>
            ))}
          </ul>
        </div>
      )}
      {instructions ? (
        <div>
          <span className="text-muted text-xs font-medium uppercase">Instructions</span>
          <p className="text-secondary text-xs mt-1">{instructions}</p>
        </div>
      ) : null}
    </>
  )
}
