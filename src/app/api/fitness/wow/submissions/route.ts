import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateWeeklyPoints } from '@/lib/fitness/leaderboard-points'

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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workoutId = req.nextUrl.searchParams.get('workout_id')

  // If no workout_id, find current week's workout
  let resolvedWorkoutId = workoutId
  if (!resolvedWorkoutId) {
    const { data: workout } = await supabase
      .from('weekly_workouts')
      .select('id')
      .eq('week_start', getCurrentMonday())
      .maybeSingle()

    if (!workout) return NextResponse.json({ submissions: [], workout_id: null })
    resolvedWorkoutId = workout.id
  }

  // Fetch the workout to determine scoring type
  const { data: workout } = await supabase
    .from('weekly_workouts')
    .select('workout_details')
    .eq('id', resolvedWorkoutId)
    .single()

  const scoring = (workout?.workout_details as Record<string, unknown>)?.scoring as string | undefined
  const ascending = scoring !== 'amrap' // time = ASC (lower is better), amrap = DESC (higher is better)

  // Fetch submissions with correct sort direction
  const { data: submissions, error } = await supabase
    .from('workout_submissions')
    .select('*')
    .eq('workout_id', resolvedWorkoutId)
    .order('score_value', { ascending })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with user display names, date_of_birth, and fitness_level
  const userIds = [...new Set((submissions ?? []).map(s => s.user_id))]
  const [{ data: profiles }, { data: members }] = await Promise.all([
    supabase
      .from('hunter_profiles')
      .select('id, display_name, avatar_url, date_of_birth, gender')
      .in('id', userIds),
    supabase
      .from('members')
      .select('id, fitness_level')
      .in('id', userIds),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const memberMap = new Map((members ?? []).map(m => [m.id, m]))

  const enriched = (submissions ?? []).map((s, i) => {
    const profile = profileMap.get(s.user_id)
    const member = memberMap.get(s.user_id)
    return {
      ...s,
      rank: i + 1,
      display_name: profile?.display_name ?? 'Anonymous',
      avatar_url: profile?.avatar_url ?? null,
      date_of_birth: profile?.date_of_birth ?? null,
      gender: profile?.gender ?? null,
      fitness_level: member?.fitness_level ?? null,
      is_mine: s.user_id === user.id,
    }
  })

  return NextResponse.json({ submissions: enriched, workout_id: resolvedWorkoutId, scoring: scoring ?? 'time' })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workout_id, scaling, score_value, score_display, notes } = await req.json()

  if (!workout_id || !scaling || score_value == null || !score_display) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['rx', 'scaled', 'beginner'].includes(scaling)) {
    return NextResponse.json({ error: 'Invalid scaling' }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Upsert submission (one per user per workout)
  const { data: submission, error } = await admin
    .from('workout_submissions')
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch workout title for the community post
  const { data: workout } = await admin
    .from('weekly_workouts')
    .select('title')
    .eq('id', workout_id)
    .single()

  const scalingLabel = scaling === 'rx' ? 'RX' : scaling === 'scaled' ? 'Scaled' : 'Beginner'
  const postContent = `Completed "${workout?.title ?? 'WOW'}" — ${score_display} (${scalingLabel}) 💪`

  // Auto-post to fitness community feed with metadata
  const { data: post } = await admin
    .from('community_posts')
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
      .from('workout_submissions')
      .update({ community_post_id: post.id })
      .eq('id', submission.id)
  }

  // Recalculate leaderboard points for this workout
  await calculateWeeklyPoints(workout_id, admin)

  return NextResponse.json({ submission: { ...submission, community_post_id: post?.id ?? null } })
}
