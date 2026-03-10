import { SupabaseClient } from '@supabase/supabase-js'

const POINTS_TABLE: Record<number, number> = {
  1: 100,
  2: 85,
  3: 70,
  4: 60,
  5: 50,
}

const PARTICIPATION_BONUS = 10

function getPointsForPlacement(placement: number): number {
  if (POINTS_TABLE[placement]) return POINTS_TABLE[placement] + PARTICIPATION_BONUS
  if (placement <= 10) return 40 + PARTICIPATION_BONUS
  if (placement <= 20) return 30 + PARTICIPATION_BONUS
  return 20 + PARTICIPATION_BONUS
}

/**
 * Recalculate leaderboard points for all submissions of a given workout.
 * Groups by scaling (RX/Scaled/Beginner) — each pool ranked independently.
 * Respects scoring type: ASC for time (lower is better), DESC for AMRAP (higher is better).
 */
export async function calculateWeeklyPoints(
  workoutId: string,
  admin: SupabaseClient
): Promise<void> {
  // Fetch workout to get scoring type and week_start
  const { data: workout } = await admin
    .from('weekly_workouts')
    .select('week_start, workout_details')
    .eq('id', workoutId)
    .single()

  if (!workout) return

  const scoring = (workout.workout_details as Record<string, unknown>)?.scoring as string | undefined
  const ascending = scoring !== 'amrap' // time = ASC, amrap = DESC

  // Fetch all submissions for this workout
  const { data: submissions } = await admin
    .from('workout_submissions')
    .select('id, user_id, scaling, score_value')
    .eq('workout_id', workoutId)

  if (!submissions || submissions.length === 0) return

  // Group by scaling
  const groups: Record<string, typeof submissions> = {}
  for (const sub of submissions) {
    const key = sub.scaling as string
    if (!groups[key]) groups[key] = []
    groups[key].push(sub)
  }

  // Rank within each group and build points records
  const pointsRecords: {
    user_id: string
    workout_id: string
    week_start: string
    scaling: string
    placement: number
    points: number
  }[] = []

  for (const [scaling, subs] of Object.entries(groups)) {
    // Sort by score_value
    subs.sort((a, b) =>
      ascending
        ? a.score_value - b.score_value
        : b.score_value - a.score_value
    )

    subs.forEach((sub, index) => {
      const placement = index + 1
      pointsRecords.push({
        user_id: sub.user_id,
        workout_id: workoutId,
        week_start: workout.week_start,
        scaling,
        placement,
        points: getPointsForPlacement(placement),
      })
    })
  }

  // Upsert all points (one per user per workout)
  for (const record of pointsRecords) {
    await admin
      .from('leaderboard_points')
      .upsert(record, { onConflict: 'workout_id,user_id' })
  }
}
