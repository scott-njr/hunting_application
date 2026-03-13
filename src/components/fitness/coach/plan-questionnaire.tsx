'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'
import { AlertBanner } from '@/components/ui/alert-banner'
import { EXERCISE_DISCLAIMER } from '@/lib/fitness/constants'

interface PlanQuestionnaireProps {
  planType: 'run' | 'strength'
}

const RUN_GOALS = [
  { value: '5K', label: 'Train for a 5K' },
  { value: '10K', label: 'Train for a 10K' },
  { value: 'half_marathon', label: 'Train for a Half Marathon' },
  { value: 'general_endurance', label: 'General Endurance' },
  { value: 'backcountry_fitness', label: 'Backcountry / Hunt Fitness' },
]

const STRENGTH_GOALS = [
  { value: 'functional_strength', label: 'Functional Strength' },
  { value: 'muscle_endurance', label: 'Muscle Endurance' },
  { value: 'backcountry_strength', label: 'Backcountry / Rucking Strength' },
  { value: 'general_fitness', label: 'General Fitness' },
]

const FITNESS_LEVELS = [
  { value: 'just_starting', label: 'Just Starting' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'very_active', label: 'Very Active' },
  { value: 'competitive', label: 'Competitive' },
]

const DAYS_PER_WEEK = [
  { value: '2', label: '2 days' },
  { value: '3', label: '3 days' },
  { value: '4', label: '4 days' },
  { value: '5', label: '5 days' },
  { value: '6', label: '6 days' },
]

const MILEAGE_OPTIONS = [
  { value: '0-5 miles', label: '0–5 miles' },
  { value: '5-10 miles', label: '5–10 miles' },
  { value: '10-20 miles', label: '10–20 miles' },
  { value: '20-30 miles', label: '20–30 miles' },
  { value: '30+ miles', label: '30+ miles' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'bodyweight', label: 'Bodyweight Only' },
  { value: 'dumbbells', label: 'Dumbbells / Kettlebells' },
  { value: 'full_gym', label: 'Full Gym' },
]

export function PlanQuestionnaire({ planType }: PlanQuestionnaireProps) {
  const router = useRouter()
  const [goal, setGoal] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('moderately_active')
  const [daysPerWeek, setDaysPerWeek] = useState('3')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Run-specific
  const [currentMileage, setCurrentMileage] = useState('')

  // Strength-specific
  const [equipment, setEquipment] = useState('bodyweight')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal) {
      setError('Please select a goal')
      return
    }
    if (planType === 'run' && !currentMileage) {
      setError('Please select your current weekly mileage')
      return
    }

    setGenerating(true)
    setError(null)

    const config = planType === 'run'
      ? { goal, fitnessLevel, daysPerWeek: parseInt(daysPerWeek), currentMileage, notes }
      : { goal, fitnessLevel, daysPerWeek: parseInt(daysPerWeek), equipment, notes }

    const res = await fetch('/api/fitness/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_type: planType, config }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to generate plan')
      setGenerating(false)
      return
    }

    setGenerating(false)
    router.push('/fitness/my-plan')
  }

  const isRun = planType === 'run'
  const canSubmit = goal && (isRun ? currentMileage : true)

  const progressSteps = isRun
    ? ['Analyzing your goals…', 'Designing your program…', 'Building weekly sessions…', 'Finalizing your plan…']
    : ['Analyzing your goals…', 'Designing your program…', 'Building exercises…', 'Finalizing your plan…']

  return (
    <>
    <AIProgressModal
      open={generating}
      featureLabel={isRun ? 'AI Run Coach' : 'AI Strength Coach'}
      steps={progressSteps}
    />
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-emerald-400" />
        <h2 className="text-primary font-bold text-lg">
          {isRun ? 'AI Run Coach' : 'AI Strength Coach'}
        </h2>
      </div>
      <p className="text-secondary text-sm mb-6">
        Tell us about your goals and we&apos;ll generate a personalized {isRun ? '8-week running' : '8-week strength training'} plan.
      </p>

      {error && <AlertBanner variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-secondary text-sm mb-1.5">
            {isRun ? 'Running Goal' : 'Strength Goal'}
          </label>
          <TacticalSelect
            value={goal}
            onChange={setGoal}
            options={isRun ? RUN_GOALS : STRENGTH_GOALS}
            placeholder="Select a goal..."
          />
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">Fitness Level</label>
          <TacticalSelect
            value={fitnessLevel}
            onChange={setFitnessLevel}
            options={FITNESS_LEVELS}
          />
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">Days Per Week</label>
          <TacticalSelect
            value={daysPerWeek}
            onChange={setDaysPerWeek}
            options={DAYS_PER_WEEK}
          />
        </div>

        {isRun ? (
          <div>
            <label className="block text-secondary text-sm mb-1.5">
              Current Weekly Mileage <span className="text-muted">(approximate)</span>
            </label>
            <TacticalSelect
              value={currentMileage}
              onChange={setCurrentMileage}
              options={MILEAGE_OPTIONS}
              placeholder="Select..."
            />
          </div>
        ) : (
          <div>
            <label className="block text-secondary text-sm mb-1.5">Equipment Access</label>
            <TacticalSelect
              value={equipment}
              onChange={setEquipment}
              options={EQUIPMENT_OPTIONS}
            />
          </div>
        )}

        <div>
          <label className="block text-secondary text-sm mb-1.5">
            Notes <span className="text-muted">(injuries, preferences, etc.)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full input-field resize-none"
            rows={2}
            placeholder="Any injuries, limitations, or preferences?"
          />
        </div>

        <button
          type="submit"
          disabled={generating || !canSubmit}
          className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded transition-colors"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Generating Plan...
            </span>
          ) : (
            `Generate My ${isRun ? 'Run' : 'Strength'} Plan`
          )}
        </button>

        {generating && (
          <p className="text-muted text-xs text-center">
            This may take 10–15 seconds while AI builds your personalized plan.
          </p>
        )}
      </form>

      <p className="text-muted text-xs mt-4">
        {EXERCISE_DISCLAIMER}
      </p>
    </div>
    </>
  )
}
