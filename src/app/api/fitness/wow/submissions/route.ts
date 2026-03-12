import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { calculateWeeklyPoints } from '@/lib/fitness/leaderboard-points'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

function computeAgeGroup(dob: string | null): string | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  if (age >= 56) return '56+'
  if (age >= 46) return '46-55'
  if (age >= 36) return '36-45'
  if (age >= 26) return '26-35'
  if (age >= 18) return '18-25'
  return null
}

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

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const workoutId = req.nextUrl.searchParams.get('workout_id')

  // If no workout_id, find current week's workout
  let resolvedWorkoutId = workoutId
  if (!resolvedWorkoutId) {
    const { data: workout } = await supabase
      .from('fitness_weekly_workouts')
      .select('id')
      .eq('week_start', getCurrentMonday())
      .maybeSingle()

    if (!workout) return apiOk({ submissions: [], workout_id: null })
    resolvedWorkoutId = workout.id
  }

  // Fetch the workout to determine scoring type
  const { data: workout } = await supabase
    .from('fitness_weekly_workouts')
    .select('workout_details')
    .eq('id', resolvedWorkoutId)
    .single()

  const scoring = (workout?.workout_details as Record<string, unknown>)?.scoring as string | undefined
  const ascending = scoring !== 'amrap' // time = ASC (lower is better), amrap = DESC (higher is better)

  // Fetch submissions with correct sort direction
  const { data: submissions, error } = await supabase
    .from('fitness_workout_submissions')
    .select('*')
    .eq('workout_id', resolvedWorkoutId)
    .order('score_value', { ascending })

  if (error) {
    console.error('[fitness/wow/submissions GET] fetch error:', error.message)
    return serverError()
  }

  // Enrich with user display names, age_group, and fitness_level
  const userIds = [...new Set((submissions ?? []).map(s => s.user_id))]
  const [{ data: profiles }, { data: fitnessProfiles }] = await Promise.all([
    supabase
      .from('user_profile')
      .select('id, display_name, user_name, avatar_url, date_of_birth, gender')
      .in('id', userIds),
    supabase
      .from('fitness_profile')
      .select('id, fitness_level')
      .in('id', userIds),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const fitnessMap = new Map((fitnessProfiles ?? []).map(f => [f.id, f]))

  const enriched = (submissions ?? []).map((s, i) => {
    const profile = profileMap.get(s.user_id)
    const fitProfile = fitnessMap.get(s.user_id)
    return {
      ...s,
      rank: i + 1,
      display_name: profile?.display_name ?? 'Anonymous',
      user_name: profile?.user_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      age_group: computeAgeGroup(profile?.date_of_birth ?? null),
      gender: profile?.gender ?? null,
      fitness_level: fitProfile?.fitness_level ?? null,
      is_mine: s.user_id === user.id,
    }
  })

  return apiOk({ submissions: enriched, workout_id: resolvedWorkoutId, scoring: scoring ?? 'time' })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { workout_id, scaling, score_value, score_display, notes } = body

  if (!workout_id || !scaling || score_value == null || !score_display) {
    return badRequest('Missing required fields')
  }

  if (!['rx', 'scaled', 'beginner'].includes(scaling)) {
    return badRequest('Invalid scaling')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Upsert submission (one per user per workout)
  const { data: submission, error } = await admin
    .from('fitness_workout_submissions')
    .upsert({
      workout_id,
      user_id: user.id,
      scaling,
      score_value,
      score_display,
      notes: notes || null,
    }, { onConflict: 'workout_id,user_id' })
    .select()
    .single()

  if (error) {
    console.error('[fitness/wow/submissions POST] upsert error:', error.message)
    return serverError()
  }

  // Fetch workout title for the community post
  const { data: workout } = await admin
    .from('fitness_weekly_workouts')
    .select('title')
    .eq('id', workout_id)
    .single()

  const scalingLabel = scaling === 'rx' ? 'RX' : scaling === 'scaled' ? 'Scaled' : 'Beginner'
  const postContent = `Completed "${workout?.title ?? 'WOW'}" — ${score_display} (${scalingLabel}) 💪`

  // Auto-post to fitness community feed with metadata
  const { data: post } = await admin
    .from('social_posts')
    .insert({
      user_id: user.id,
      post_type: 'wow_result' as const,
      content: postContent,
      module: 'fitness',
      metadata: {
        wow_submission_id: submission.id,
        workout_id,
        score_display,
        scaling,
        workout_title: workout?.title ?? 'WOW',
      },
    })
    .select('id')
    .single()

  // Link community post back to submission
  if (post) {
    await admin
      .from('fitness_workout_submissions')
      .update({ community_post_id: post.id })
      .eq('id', submission.id)
  }

  // Recalculate leaderboard points for this workout
  await calculateWeeklyPoints(workout_id, admin)

  return apiOk({ submission: { ...submission, community_post_id: post?.id ?? null } }, 201)
}
