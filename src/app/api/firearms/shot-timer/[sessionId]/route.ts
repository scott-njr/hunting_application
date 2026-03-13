import { createClient } from '@/lib/supabase/server'
import { apiOk, apiDone, unauthorized, notFound, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/** GET /api/firearms/shot-timer/[sessionId] — Fetch session with strings */
export const GET = withHandler(async (_req: Request, { params }: RouteParams) => {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: session, error: sessionErr } = await supabase
    .from('firearms_shot_session')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionErr || !session) return notFound('Session not found')

  const { data: strings } = await supabase
    .from('firearms_shot_string')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('string_number', { ascending: true })

  return apiOk({ session, strings: strings ?? [] })
})


/** PATCH /api/firearms/shot-timer/[sessionId] — Update session */
export const PATCH = withHandler(async (req: Request, { params }: RouteParams) => {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name
  if (body.points !== undefined) updates.points = body.points
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.total_strings !== undefined) updates.total_strings = body.total_strings
  if (body.ended_at !== undefined) updates.ended_at = body.ended_at
  if (body.course_name !== undefined) updates.course_name = body.course_name
  if (body.status !== undefined) updates.status = body.status
  if (body.procedurals !== undefined) updates.procedurals = body.procedurals
  if (body.additional_penalty !== undefined) updates.additional_penalty = body.additional_penalty
  if (body.hit_factor !== undefined) updates.hit_factor = body.hit_factor
  if (body.shots_per_string !== undefined) updates.shots_per_string = body.shots_per_string
  if (body.alpha !== undefined) updates.alpha = body.alpha
  if (body.bravo !== undefined) updates.bravo = body.bravo
  if (body.charlie !== undefined) updates.charlie = body.charlie
  if (body.delta !== undefined) updates.delta = body.delta
  if (body.miss !== undefined) updates.miss = body.miss
  if (body.match_id !== undefined) updates.match_id = body.match_id
  if (body.match_member_id !== undefined) updates.match_member_id = body.match_member_id

  const { data: session, error } = await supabase
    .from('firearms_shot_session')
    .update(updates)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !session) return notFound('Session not found')

  // If session is linked to a match member, update the member's session_id
  if (body.match_member_id && session) {
    await supabase
      .from('firearms_match_member')
      .update({ session_id: sessionId })
      .eq('id', body.match_member_id)
  }

  return apiOk({ session })
})


/** DELETE /api/firearms/shot-timer/[sessionId] — Delete session */
export const DELETE = withHandler(async (_req: Request, { params }: RouteParams) => {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { error } = await supabase
    .from('firearms_shot_session')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return serverError()

  return apiDone()
})

