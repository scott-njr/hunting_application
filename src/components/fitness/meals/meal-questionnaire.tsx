'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'

const MEAL_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'performance', label: 'Performance / Endurance' },
]

const DIETARY_PREFS = [
  { value: 'none', label: 'No Restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'dairy_free', label: 'Dairy-Free' },
  { value: 'gluten_free', label: 'Gluten-Free' },
]

const BUDGET_OPTIONS = [
  { value: '50', label: '$50/week' },
  { value: '75', label: '$75/week' },
  { value: '100', label: '$100/week' },
  { value: '125', label: '$125/week' },
  { value: '150', label: '$150/week' },
  { value: '200', label: '$200/week' },
]

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

export function MealQuestionnaire() {
  const router = useRouter()
  const [goal, setGoal] = useState('')
  const [dietaryPref, setDietaryPref] = useState('none')
  const [weeklyBudget, setWeeklyBudget] = useState('100')
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set(['breakfast', 'lunch', 'dinner']))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal) {
      setError('Please select a goal')
      return
    }
    if (selectedMeals.size === 0) {
      setError('Please select at least one meal')
      return
    }

    setGenerating(true)
    setError(null)

    const config = {
      goal,
      dietaryPref,
      weeklyBudget: parseInt(weeklyBudget),
      mealsPerDay: Array.from(selectedMeals).join(','),
      notes,
    }

    const res = await fetch('/api/fitness/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_type: 'meal', config }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to generate meal plan')
      setGenerating(false)
      return
    }

    setGenerating(false)
    router.push('/fitness/my-plan')
  }

  return (
    <>
    <AIProgressModal
      open={generating}
      featureLabel="AI Meal Prep"
      steps={['Analyzing your goals…', 'Planning your meals…', 'Calculating macros…', 'Building grocery list…']}
    />
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-emerald-400" />
        <h2 className="text-primary font-bold text-lg">AI Meal Prep</h2>
      </div>
      <p className="text-secondary text-sm mb-6">
        Tell us about your dietary goals and we&apos;ll generate a personalized 7-day meal plan with grocery list and cost estimates.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-secondary text-sm mb-1.5">Goal</label>
          <TacticalSelect
            value={goal}
            onChange={setGoal}
            options={MEAL_GOALS}
            placeholder="Select a goal..."
          />
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">Dietary Preference</label>
          <TacticalSelect
            value={dietaryPref}
            onChange={setDietaryPref}
            options={DIETARY_PREFS}
          />
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">Weekly Budget</label>
          <TacticalSelect
            value={weeklyBudget}
            onChange={setWeeklyBudget}
            options={BUDGET_OPTIONS}
          />
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">Meals Per Day</label>
          <div className="flex flex-wrap gap-3 mt-1">
            {MEAL_OPTIONS.map(opt => {
              const checked = selectedMeals.has(opt.value)
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 cursor-pointer rounded border px-3 py-2 text-sm transition-colors ${
                    checked
                      ? 'border-accent/50 bg-accent/10 text-primary'
                      : 'border-default bg-elevated text-secondary hover:border-accent/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedMeals(prev => {
                        const next = new Set(prev)
                        if (next.has(opt.value)) {
                          next.delete(opt.value)
                        } else {
                          next.add(opt.value)
                        }
                        return next
                      })
                    }}
                    className="accent-accent"
                  />
                  {opt.label}
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">
            Notes <span className="text-muted">(allergies, dislikes, preferences)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full input-field resize-none"
            rows={2}
            placeholder="Any allergies, foods you dislike, or dietary needs?"
          />
        </div>

        <button
          type="submit"
          disabled={generating}
          className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded transition-colors"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Generating Meal Plan...
            </span>
          ) : (
            'Generate My Meal Plan'
          )}
        </button>

        {generating && (
          <p className="text-muted text-xs text-center">
            This may take 15–20 seconds while AI builds your personalized meal plan.
          </p>
        )}
      </form>

      <p className="text-muted text-xs mt-4">
        AI-generated meal plan is general guidance. Consult a healthcare provider for specific dietary needs.
      </p>
    </div>
    </>
  )
}
