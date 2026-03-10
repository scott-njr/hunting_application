'use client'

import { UtensilsCrossed } from 'lucide-react'

type MealData = {
  meal_number: number
  meal_type: string
  title: string
  calories: number
  protein_g: number
}

type DayData = {
  day_number: number
  day_name: string
  meals: Array<Record<string, unknown>>
  total_calories: number
  total_protein_g: number
  total_cost_usd: number
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

// Today's meals snapshot (compact, read-only — no checkboxes)
export function MyPlanMeals({
  todayMeals,
  loggedMeals = new Set(),
}: {
  todayMeals: DayData
  planId: string
  loggedMeals?: Set<number>
}) {
  // Show only unlogged meals, capped at 2 (like run/strength)
  const upcoming = (todayMeals.meals as unknown as MealData[])
    .filter(m => !loggedMeals.has(m.meal_number))
    .slice(0, 2)

  const allDone = upcoming.length === 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 h-5">
        <UtensilsCrossed className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider truncate">
          {todayMeals.day_name}&apos;s Meals
        </span>
        <span className="text-xs text-muted whitespace-nowrap">
          {todayMeals.total_calories} cal · ${todayMeals.total_cost_usd?.toFixed(2) ?? '0.00'}
        </span>
      </div>
      <div className="space-y-2">
        {allDone ? (
          <p className="text-xs text-green-400">All meals logged for today!</p>
        ) : (
          upcoming.map((meal) => (
            <div key={meal.meal_number} className="rounded border border-subtle bg-elevated p-3">
              <div className="flex items-center gap-2">
                <span className="text-primary text-sm font-medium">{meal.title}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface border border-subtle text-muted capitalize">
                  {MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}
                </span>
              </div>
              <div className="flex gap-3 mt-1 text-xs text-muted">
                <span>{meal.calories} cal</span>
                <span>{meal.protein_g}g protein</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
