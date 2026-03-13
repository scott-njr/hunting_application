import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Workout, WorkoutDetails } from '@/components/fitness/wow-card'
import { WowChallengeCard } from '@/components/fitness/wow-challenge-card'
import { WowLeaderboard } from '@/components/fitness/wow-leaderboard'
import { Dumbbell } from 'lucide-react'

function getCurrentMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const date = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

export default async function WeeklyChallengePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const weekStart = getCurrentMonday()

  // Fetch current week's workout, fall back to most recent
  let { data: workoutRow } = await supabase
    .from('fitness_weekly_workouts')
    .select('*')
    .eq('week_start', weekStart)
    .maybeSingle()

  if (!workoutRow) {
    const { data: latest } = await supabase
      .from('fitness_weekly_workouts')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()
    workoutRow = latest
  }

  // If workout exists, fetch user's existing submission
  let existing: { scaling: string; score_value: number; score_display: string; notes: string | null } | null = null
  if (workoutRow) {
    const { data: sub } = await supabase
      .from('fitness_workout_submissions')
      .select('scaling, score_value, score_display, notes')
      .eq('user_id', user.id)
      .eq('workout_id', workoutRow.id)
      .maybeSingle()
    existing = sub
  }

  if (!workoutRow) {
    return (
      <div>
        <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
          <Dumbbell className="h-8 w-8 text-muted mx-auto mb-3" />
          <h2 className="text-primary font-bold text-lg mb-2">Weekly Challenge Coming Soon</h2>
          <p className="text-secondary text-sm">
            The first AI-generated Workout of the Week will be posted Monday.
            Every week brings a fresh challenge with three scaling levels — RX, Scaled, and Beginner.
          </p>
        </div>
      </div>
    )
  }

  const workout: Workout = {
    id: workoutRow.id,
    week_start: workoutRow.week_start,
    title: workoutRow.title,
    description: workoutRow.description,
    workout_details: workoutRow.workout_details as unknown as WorkoutDetails,
    created_on: workoutRow.created_on,
  }

  return (
    <div className="space-y-6">
      <div>
        <WowChallengeCard
          workout={workout}
          scoringType={workout.workout_details.scoring}
          existing={existing as { scaling: 'rx' | 'scaled' | 'beginner'; score_value: number; score_display: string; notes: string | null } | null}
        />
      </div>

      <WowLeaderboard workoutId={workout.id} />
    </div>
  )
}
