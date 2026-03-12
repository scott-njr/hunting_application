import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, notFound, forbidden, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

// POST /api/fitness/challenges/[challengeId]/submit — Submit or update a challenge score
export const POST = withHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { challengeId } = await params
  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { score_value, score_display, scaling, notes } = body

  if (score_value == null || !score_display) {
    return badRequest('score_value and score_display are required')
  }

  // Verify user is a participant and challenge is accepted
  const { data: challenge } = await supabase
    .from('fitness_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!challenge) {
    return notFound('Challenge not found or not active')
  }

  if (challenge.challenger_id !== user.id && challenge.challenged_id !== user.id) {
    return forbidden()
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
        created_on: new Date().toISOString(),
      },
      { onConflict: 'challenge_id,user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('[Fitness Challenge Submit] upsert error:', error)
    return serverError()
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

  return apiOk({ submission }, 201)
})

