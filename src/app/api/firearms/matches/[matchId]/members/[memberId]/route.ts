import { createClient } from '@/lib/supabase/server'
import { apiOk, apiDone, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ matchId: string; memberId: string }>
}

/** PATCH /api/firearms/matches/[matchId]/members/[memberId] — Update member */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { matchId, memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Verify match organizer
  const { data: match } = await supabase
    .from('firearms_match')
    .select('organizer_id')
    .eq('id', matchId)
    .single()

  if (!match) return notFound('Match not found')
  if (match.organizer_id !== user.id) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const updates: Record<string, unknown> = {}

  if (body.squad !== undefined) updates.squad = body.squad
  if (body.division !== undefined) updates.division = body.division
  if (body.power_factor !== undefined) updates.power_factor = body.power_factor
  if (body.classification !== undefined) updates.classification = body.classification
  if (body.session_id !== undefined) updates.session_id = body.session_id
  if (body.shoot_order !== undefined) updates.shoot_order = body.shoot_order

  if (Object.keys(updates).length === 0) return badRequest('No fields to update')

  const { data: member, error } = await supabase
    .from('firearms_match_member')
    .update(updates)
    .eq('id', memberId)
    .eq('match_id', matchId)
    .select()
    .single()

  if (error) return serverError()

  return apiOk({ member })
}

/** DELETE /api/firearms/matches/[matchId]/members/[memberId] — Remove member */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { matchId, memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Verify match organizer
  const { data: match } = await supabase
    .from('firearms_match')
    .select('organizer_id')
    .eq('id', matchId)
    .single()

  if (!match) return notFound('Match not found')
  if (match.organizer_id !== user.id) return unauthorized()

  const { error } = await supabase
    .from('firearms_match_member')
    .delete()
    .eq('id', memberId)
    .eq('match_id', matchId)

  if (error) return serverError()

  return apiDone()
}
