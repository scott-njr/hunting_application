'use client'

import { MealCard } from './meal-card'
import type { Meal } from './meal-card'

interface MealDayViewProps {
  dayNumber: number
  dayName: string
  meals: Meal[]
  totalCalories: number
  totalProtein: number
  totalCost: number
  planId: string
  loggedMeals: Set<number>
}

export function MealDayView({
  dayName,
  dayNumber,
  meals,
  totalCalories,
  totalProtein,
  totalCost,
  planId,
  loggedMeals,
}: MealDayViewProps) {
  const completedCount = meals.filter(m => loggedMeals.has(m.meal_number)).length

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-primary font-bold text-sm">{dayName}</h3>
          <div className="flex gap-3 text-xs text-muted mt-0.5">
            <span>{totalCalories} cal</span>
            <span>{totalProtein}g protein</span>
            <span>${totalCost.toFixed(2)}</span>
          </div>
        </div>
        <span className="text-xs text-muted">
          {completedCount}/{meals.length} meals
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-elevated mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${meals.length > 0 ? (completedCount / meals.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-2">
        {meals.map((meal) => (
          <MealCard
            key={meal.meal_number}
            meal={meal}
            planId={planId}
            dayNumber={dayNumber}
            isLogged={loggedMeals.has(meal.meal_number)}
          />
        ))}
      </div>
    </div>
  )
}
