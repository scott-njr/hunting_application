import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, forbidden, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'
import type { Json } from '@/types/database.types'

// POST /api/fitness/challenges — Create a workout challenge
export const POST = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { challenged_id, item_type, item_snapshot, scoring_type, message } = body as {
    challenged_id: string
    item_type: string
    item_snapshot: Json
    scoring_type: string
    message: string
  }

  if (!challenged_id || !item_type || !item_snapshot || !scoring_type) {
    return badRequest('challenged_id, item_type, item_snapshot, and scoring_type are required')
  }

  if (!['run_session', 'strength_session'].includes(item_type)) {
    return badRequest('Invalid item_type (must be run_session or strength_session)')
  }

  if (!['time', 'reps'].includes(scoring_type)) {
    return badRequest('Invalid scoring_type (must be time or reps)')
  }

  if (challenged_id === user.id) {
    return badRequest('Cannot challenge yourself')
  }

  // Verify friend
  const { data: friends } = await supabase
    .from('my_friends')
    .select('friend_id')
    .eq('status', 'accepted')

  const isFriend = friends?.some(f => f.friend_id === challenged_id)
  if (!isFriend) return forbidden()

  const { data: challenge, error } = await supabase
    .from('fitness_challenges')
    .insert({
      challenger_id: user.id,
      challenged_id,
      item_type: item_type as 'run_session' | 'strength_session',
      item_snapshot,
      scoring_type: scoring_type as 'time' | 'reps',
      message: message?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[Fitness Challenges] insert error:', error)
    return serverError()
  }

  return apiOk({ challenge }, 201)
})


// GET /api/fitness/challenges — List challenges
export const GET = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const status = req.nextUrl.searchParams.get('status')

  let query = supabase
    .from('fitness_challenges')
    .select('*')
    .order('created_on', { ascending: false })

  if (status) {
    query = query.eq('status', status as 'pending' | 'accepted' | 'declined' | 'completed')
  }

  const { data: challenges, error } = await query

  if (error) {
    console.error('[Fitness Challenges] fetch error:', error)
    return serverError()
  }

  // Enrich with partner names + submissions
  const userIds = new Set<string>()
  const challengeIds: string[] = []
  for (const c of challenges ?? []) {
    userIds.add(c.challenger_id === user.id ? c.challenged_id : c.challenger_id)
    challengeIds.push(c.id)
  }

  const { data: profiles } = userIds.size > 0
    ? await supabase
        .from('user_profile')
        .select('id, display_name')
        .in('id', [...userIds])
    : { data: [] }

  const { data: submissions } = challengeIds.length > 0
    ? await supabase
        .from('fitness_challenge_submissions')
        .select('*')
        .in('challenge_id', challengeIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))
  const submissionMap = new Map<string, typeof submissions>()
  for (const s of submissions ?? []) {
    const existing = submissionMap.get(s.challenge_id) ?? []
    existing.push(s)
    submissionMap.set(s.challenge_id, existing)
  }

  const enriched = (challenges ?? []).map(c => {
    const partnerId = c.challenger_id === user.id ? c.challenged_id : c.challenger_id
    const subs = submissionMap.get(c.id) ?? []
    const mySubmission = subs.find(s => s.user_id === user.id)
    const opponentSubmission = subs.find(s => s.user_id !== user.id)

    return {
      ...c,
      direction: c.challenger_id === user.id ? 'sent' : 'received',
      partner_name: profileMap.get(partnerId) ?? 'Unknown',
      my_submission: mySubmission ?? null,
      opponent_submission: opponentSubmission ?? null,
    }
  })

  return apiOk({ challenges: enriched })
})

