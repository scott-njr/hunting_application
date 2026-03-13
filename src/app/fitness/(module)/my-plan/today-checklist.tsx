'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { CheckCircle, Circle, Activity, Dumbbell, UtensilsCrossed, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

type ChecklistItem = {
  id: string
  planId: string
  weekNumber: number
  sessionNumber: number
  label: string
  sublabel?: string
  type: 'run' | 'strength' | 'meal'
  isCompleted: boolean
  details?: Record<string, unknown>
}

const TYPE_ICONS = {
  run: Activity,
  strength: Dumbbell,
  meal: UtensilsCrossed,
}

function RunDetails({ details }: { details: Record<string, unknown> }) {
  const description = details.description as string | undefined
  const effortLevel = details.effort_level as string | undefined
  const intervals = details.intervals as Array<Record<string, unknown>> | undefined
  return (
    <div className="space-y-2 text-sm">
      {description && (
        <p className="text-secondary">{description}</p>
      )}
      {effortLevel && (
        <div>
          <span className="text-muted text-xs uppercase font-medium">Effort</span>
          <p className="text-secondary capitalize">{effortLevel}</p>
        </div>
      )}
      {intervals && intervals.length > 0 && (
        <div>
          <span className="text-muted text-xs uppercase font-medium">Intervals</span>
          <div className="space-y-1 mt-1">
            {intervals.map((interval, i) => (
              <div key={i} className="text-secondary text-xs">
                {(interval.description as string) || (interval.name as string) || JSON.stringify(interval)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StrengthDetails({ details }: { details: Record<string, unknown> }) {
  const description = details.description as string | undefined
  const warmup = details.warmup as string | undefined
  const cooldown = details.cooldown as string | undefined
  const exercises = details.exercises as Array<{ name: string; sets: number; reps: string; notes?: string }> | undefined
  return (
    <div className="space-y-2 text-sm">
      {description && (
        <p className="text-secondary">{description}</p>
      )}
      {warmup && (
        <div>
          <span className="text-muted text-xs uppercase font-medium">Warmup</span>
          <p className="text-secondary">{warmup}</p>
        </div>
      )}
      {exercises && exercises.length > 0 && (
        <div>
          <span className="text-muted text-xs uppercase font-medium">Exercises</span>
          <div className="space-y-1 mt-1">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-baseline gap-2 text-secondary">
                <span className="text-primary font-medium">{ex.name}</span>
                <span className="text-muted">—</span>
                <span>{ex.sets} × {ex.reps}</span>
                {ex.notes && <span className="text-muted text-xs">({ex.notes})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {cooldown && (
        <div>
          <span className="text-muted text-xs uppercase font-medium">Cooldown</span>
          <p className="text-secondary">{cooldown}</p>
        </div>
      )}
    </div>
  )
}

function MealDetails({ details }: { details: Record<string, unknown> }) {
  const description = details.description as string | undefined
  const ingredients = details.ingredients as string[] | undefined
  const instructions = details.instructions as string | undefined
  return (
    <div className="space-y-2 text-sm">
      {description && (
        <p className="text-secondary">{description}</p>
      )}
      {ingredients && ingredients.length > 0 && (
        <div>
          <span className="text-muted text-xs uppercase font-medium">Ingredients</span>
          <ul className="mt-1 space-y-0.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-secondary text-xs">• {ing}</li>
            ))}
          </ul>
        </div>
      )}
      {instructions && (
        <div>
          <span className="text-muted text-xs uppercase font-medium">Instructions</span>
          <p className="text-secondary">{instructions}</p>
        </div>
      )}
    </div>
  )
}

export function TodayChecklist({ items }: { items: ChecklistItem[] }) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(
    new Set(items.filter(i => i.isCompleted).map(i => i.id))
  )
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Position dropdown below the card using a portal
  const updateDropdownPos = useCallback(() => {
    if (!expandedItem) { setDropdownPos(null); return }
    const el = cardRefs.current[expandedItem]
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width })
  }, [expandedItem])

  useEffect(() => {
    updateDropdownPos()
    if (!expandedItem) return
    window.addEventListener('scroll', updateDropdownPos, true)
    window.addEventListener('resize', updateDropdownPos)
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true)
      window.removeEventListener('resize', updateDropdownPos)
    }
  }, [expandedItem, updateDropdownPos])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!expandedItem) return
    function handleClickOutside(e: MouseEvent) {
      const cardEl = cardRefs.current[expandedItem!]
      const ddEl = dropdownRef.current
      const target = e.target as Node
      if (cardEl && !cardEl.contains(target) && (!ddEl || !ddEl.contains(target))) {
        setExpandedItem(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedItem])

  async function toggleItem(item: ChecklistItem) {
    setToggling(item.id)
    const isCompleted = localCompleted.has(item.id)

    try {
      if (isCompleted) {
        await fetch(`/api/fitness/plans/${item.planId}/logs`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week_number: item.weekNumber,
            session_number: item.sessionNumber,
            completed: false,
          }),
        })
        setLocalCompleted(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      } else {
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
      // State was not updated yet (updates follow successful fetch), so no revert needed
    } finally {
      setToggling(null)
    }
  }

  function toggleExpand(id: string) {
    setExpandedItem(prev => prev === id ? null : id)
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
        const isExpanded = expandedItem === item.id
        const hasDetails = !!item.details

        return (
          <div
            key={item.id}
            ref={el => { if (el) cardRefs.current[item.id] = el }}
            className={`rounded-lg border transition-colors ${
              completed
                ? 'border-green-500/30 bg-green-950/10'
                : isExpanded
                ? 'border-accent/50 bg-elevated'
                : 'border-subtle bg-elevated'
            }`}
          >
            <div className="flex items-center gap-3 p-3">
              {/* Checkbox on left */}
              <button
                onClick={() => toggleItem(item)}
                disabled={isToggling}
                className="shrink-0 disabled:opacity-40"
                title={completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {isToggling ? (
                  <Loader2 className="h-5 w-5 text-muted animate-spin" />
                ) : completed ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-muted hover:text-accent transition-colors" />
                )}
              </button>
              <Icon className={`h-4 w-4 shrink-0 ${completed ? 'text-green-400/60' : 'text-accent'}`} />
              <button
                onClick={() => hasDetails && toggleExpand(item.id)}
                disabled={!hasDetails}
                className={`min-w-0 flex-1 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`text-sm font-medium ${completed ? 'text-muted line-through' : 'text-primary'}`}>
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className={`block text-xs ${completed ? 'text-muted/60' : 'text-muted'}`}>
                    {item.sublabel}
                  </span>
                )}
              </button>
              {hasDetails && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="text-muted hover:text-secondary p-1 shrink-0"
                  title={isExpanded ? 'Hide details' : 'Show details'}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        )
      })}
      {allDone && (
        <p className="text-xs text-green-400 text-center pt-1">All done for today!</p>
      )}

      {/* Portal dropdown — renders at body level so nothing can clip it */}
      {expandedItem && dropdownPos && (() => {
        const item = items.find(i => i.id === expandedItem)
        if (!item?.details) return null
        return createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 rounded-lg border border-subtle bg-surface shadow-xl max-h-[50vh] overflow-y-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, position: 'absolute' }}
          >
            <div className="px-4 py-3">
              {item.type === 'run' && <RunDetails details={item.details} />}
              {item.type === 'strength' && <StrengthDetails details={item.details} />}
              {item.type === 'meal' && <MealDetails details={item.details} />}
            </div>
          </div>,
          document.body
        )
      })()}
    </div>
  )
}
