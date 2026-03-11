import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/fitness/challenges — Create a workout challenge
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { challenged_id, item_type, item_snapshot, scoring_type, message } = await req.json()

  if (!challenged_id || !item_type || !item_snapshot || !scoring_type) {
    return NextResponse.json({ error: 'challenged_id, item_type, item_snapshot, and scoring_type are required' }, { status: 400 })
  }

  if (!['run_session', 'strength_session'].includes(item_type)) {
    return NextResponse.json({ error: 'Invalid item_type (must be run_session or strength_session)' }, { status: 400 })
  }

  if (!['time', 'reps'].includes(scoring_type)) {
    return NextResponse.json({ error: 'Invalid scoring_type (must be time or reps)' }, { status: 400 })
  }

  if (challenged_id === user.id) {
    return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 })
  }

  // Verify friend
  const { data: friends } = await supabase
    .from('my_friends')
    .select('friend_id')
    .eq('status', 'accepted')

  const isFriend = friends?.some(f => f.friend_id === challenged_id)
  if (!isFriend) return NextResponse.json({ error: 'Not a confirmed friend' }, { status: 403 })

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
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ challenge })
}

// GET /api/fitness/challenges — List challenges
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status')

  let query = supabase
    .from('fitness_challenges')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status as 'pending' | 'accepted' | 'declined' | 'completed')
  }

  const { data: challenges, error } = await query

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
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

  return NextResponse.json({ challenges: enriched })
}
