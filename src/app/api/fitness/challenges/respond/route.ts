import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

// POST /api/fitness/challenges/respond — Accept or decline a challenge
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { challenge_id, action } = body

  if (!challenge_id || !action) {
    return badRequest('challenge_id and action are required')
  }

  if (!['accept', 'decline'].includes(action)) {
    return badRequest('action must be accept or decline')
  }

  // Verify user is the challenged party
  const { data: challenge } = await supabase
    .from('fitness_challenges')
    .select('*')
    .eq('id', challenge_id)
    .eq('challenged_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!challenge) {
    return notFound('Challenge not found or already responded')
  }

  if (action === 'decline') {
    const { error } = await supabase
      .from('fitness_challenges')
      .update({ status: 'declined' as const })
      .eq('id', challenge_id)

    if (error) {
      console.error('[Fitness Challenge Respond] decline error:', error)
      return serverError()
    }
    return apiOk({ status: 'declined' })
  }

  // Accept
  const { error } = await supabase
    .from('fitness_challenges')
    .update({
      status: 'accepted' as const,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', challenge_id)

  if (error) {
    console.error('[Fitness Challenge Respond] accept error:', error)
    return serverError()
  }

  return apiOk({ status: 'accepted' })
}
