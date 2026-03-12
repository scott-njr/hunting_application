import { createClient } from '@/lib/supabase/server'
import { apiOk, apiDone, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

/** GET /api/firearms/matches/[matchId] — Match detail with members and course */
export const GET = withHandler(async (_req: Request, { params }: RouteParams) => {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: match, error: matchError } = await supabase
    .from('firearms_match')
    .select('*')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return notFound('Match not found')

  const { data: members } = await supabase
    .from('firearms_match_member')
    .select('*, user:user_profile(display_name, user_name, avatar_url), session:firearms_shot_session(points, hit_factor, alpha, bravo, charlie, delta, miss, status, course_name, total_strings, ended_at)')
    .eq('match_id', matchId)
    .order('shoot_order', { ascending: true })

  let course = null
  if (match.course_of_fire_id) {
    const { data } = await supabase
      .from('firearms_course_of_fire')
      .select('*')
      .eq('id', match.course_of_fire_id)
      .single()
    course = data
  }

  return apiOk({ match, members: members ?? [], course })
})


/** PATCH /api/firearms/matches/[matchId] — Update match (organizer only) */
export const PATCH = withHandler(async (req: Request, { params }: RouteParams) => {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Verify organizer
  const { data: existing } = await supabase
    .from('firearms_match')
    .select('organizer_id')
    .eq('id', matchId)
    .single()

  if (!existing) return notFound('Match not found')
  if (existing.organizer_id !== user.id) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name
  if (body.status !== undefined) {
    if (!['setup', 'active', 'complete'].includes(body.status)) {
      return badRequest('Invalid status')
    }
    updates.status = body.status
  }
  if (body.match_date !== undefined) updates.match_date = body.match_date

  if (Object.keys(updates).length === 0) return badRequest('No fields to update')

  const { data: match, error } = await supabase
    .from('firearms_match')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single()

  if (error) return serverError()

  return apiOk({ match })
})


/** DELETE /api/firearms/matches/[matchId] — Delete match (organizer only) */
export const DELETE = withHandler(async (_req: Request, { params }: RouteParams) => {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { error } = await supabase
    .from('firearms_match')
    .delete()
    .eq('id', matchId)
    .eq('organizer_id', user.id)

  if (error) return serverError()

  return apiDone()
})

