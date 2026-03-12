import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ matchId: string }>
}

/** GET /api/firearms/matches/[matchId]/members — List members with scores */
export async function GET(_req: Request, { params }: RouteParams) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Try with session scoring join, fall back to base if scoring columns don't exist
  let memberList: Record<string, unknown>[] = []
  const { data: fullMembers, error: fullErr } = await supabase
    .from('firearms_match_member')
    .select('*, session:firearms_shot_session(points, hit_factor, alpha, bravo, charlie, delta, miss, status, course_name, total_strings, ended_at)')
    .eq('match_id', matchId)
    .order('shoot_order', { ascending: true })

  if (!fullErr) {
    memberList = (fullMembers ?? []) as Record<string, unknown>[]
  } else {
    console.error('[match-members-get] full query failed, retrying base:', fullErr.message)
    const { data: baseMembers, error: baseErr } = await supabase
      .from('firearms_match_member')
      .select('*')
      .eq('match_id', matchId)
      .order('shoot_order', { ascending: true })
    if (baseErr) {
      console.error('[match-members-get]', baseErr.message, baseErr.code)
      return serverError()
    }
    memberList = (baseMembers ?? []).map(m => ({ ...m, session: null })) as Record<string, unknown>[]
  }

  // Fetch user profiles separately
  const userIds = memberList.map(m => m.user_id as string)
  const profileMap: Record<string, { display_name: string | null; user_name: string | null; avatar_url: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profile')
      .select('id, display_name, user_name, avatar_url')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = { display_name: p.display_name, user_name: p.user_name, avatar_url: p.avatar_url }
    }
  }

  const members = memberList.map(m => ({
    ...m,
    user: profileMap[m.user_id as string] ?? null,
  }))

  return apiOk({ members })
}

/** POST /api/firearms/matches/[matchId]/members — Add member */
export async function POST(req: Request, { params }: RouteParams) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Verify match exists and user is organizer
  const { data: match } = await supabase
    .from('firearms_match')
    .select('organizer_id')
    .eq('id', matchId)
    .single()

  if (!match) return notFound('Match not found')
  if (match.organizer_id !== user.id) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  if (!body.user_id) return badRequest('user_id is required')

  const { data: member, error } = await supabase
    .from('firearms_match_member')
    .insert({
      match_id: matchId,
      user_id: body.user_id,
      squad: body.squad ?? null,
      division: body.division ?? null,
      power_factor: body.power_factor ?? null,
      classification: body.classification ?? null,
      shoot_order: body.shoot_order ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[match-member-add]', error.message, error.code)
    if (error.code === '23505') return badRequest('Shooter already in match')
    return serverError()
  }

  return apiOk({ member }, 201)
}
