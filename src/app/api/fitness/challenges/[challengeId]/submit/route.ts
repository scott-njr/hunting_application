import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/fitness/challenges/[challengeId]/submit — Submit or update a challenge score
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { challengeId } = await params
  const { score_value, score_display, scaling, notes } = await req.json()

  if (score_value == null || !score_display) {
    return NextResponse.json({ error: 'score_value and score_display are required' }, { status: 400 })
  }

  // Verify user is a participant and challenge is accepted
  const { data: challenge } = await supabase
    .from('fitness_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found or not active' }, { status: 404 })
  }

  if (challenge.challenger_id !== user.id && challenge.challenged_id !== user.id) {
    return NextResponse.json({ error: 'Not a participant in this challenge' }, { status: 403 })
  }

  // Upsert submission
  const { data: submission, error } = await supabase
    .from('fitness_challenge_submissions')
    .upsert(
      {
        challenge_id: challengeId,
        user_id: user.id,
        score_value: parseFloat(score_value),
        score_display,
        scaling: (scaling ?? 'rx') as 'rx' | 'scaled' | 'beginner',
        notes: notes?.trim() || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'challenge_id,user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Check if both parties have submitted — mark challenge completed
  const { data: allSubs } = await supabase
    .from('fitness_challenge_submissions')
    .select('user_id')
    .eq('challenge_id', challengeId)

  const submittedUserIds = new Set((allSubs ?? []).map(s => s.user_id))
  if (submittedUserIds.has(challenge.challenger_id) && submittedUserIds.has(challenge.challenged_id)) {
    await supabase
      .from('fitness_challenges')
      .update({
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
  }

  return NextResponse.json({ submission })
}
