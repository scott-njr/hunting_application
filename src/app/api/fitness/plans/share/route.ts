import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/fitness/plans/share — Share a plan with a friend
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan_id, friend_id } = await req.json()

  if (!plan_id || !friend_id) {
    return NextResponse.json({ error: 'plan_id and friend_id are required' }, { status: 400 })
  }

  // Verify plan belongs to the current user and is active
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('id, plan_type, goal')
    .eq('id', plan_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!plan) return NextResponse.json({ error: 'Plan not found or not active' }, { status: 404 })

  // Verify friend_id is an accepted friend
  const { data: friends } = await supabase
    .from('my_friends')
    .select('friend_id')
    .eq('status', 'accepted')

  const isFriend = friends?.some(f => f.friend_id === friend_id)
  if (!isFriend) return NextResponse.json({ error: 'Not a confirmed friend' }, { status: 403 })

  // Check for existing share (allow re-share if previously declined)
  const { data: existing } = await supabase
    .from('fitness_shared_plans')
    .select('id, status')
    .eq('source_plan_id', plan_id)
    .eq('target_user_id', friend_id)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'Already shared and pending' }, { status: 409 })
    }
    if (existing.status === 'accepted') {
      return NextResponse.json({ error: 'Already shared and accepted' }, { status: 409 })
    }
    // Declined — re-share by updating back to pending
    const { data: updated, error } = await supabase
      .from('fitness_shared_plans')
      .update({ status: 'pending' as const, shared_at: new Date().toISOString(), target_plan_id: null, accepted_at: null })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ share: updated })
  }

  // Create new share
  const { data: share, error } = await supabase
    .from('fitness_shared_plans')
    .insert({
      source_plan_id: plan_id,
      source_user_id: user.id,
      target_user_id: friend_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ share })
}

// GET /api/fitness/plans/share — List shared plans
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const direction = req.nextUrl.searchParams.get('direction') ?? 'all'

  let query = supabase
    .from('fitness_shared_plans')
    .select('*')
    .order('shared_at', { ascending: false })

  if (direction === 'sent') {
    query = query.eq('source_user_id', user.id)
  } else if (direction === 'received') {
    query = query.eq('target_user_id', user.id)
  }
  // 'all' — RLS handles visibility (both directions)

  const { data: shares, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with partner display names and plan info
  const userIds = new Set<string>()
  const planIds = new Set<string>()
  for (const s of shares ?? []) {
    userIds.add(s.source_user_id === user.id ? s.target_user_id : s.source_user_id)
    planIds.add(s.source_plan_id)
  }

  // Fetch display names
  const { data: profiles } = userIds.size > 0
    ? await supabase
        .from('user_profile')
        .select('id, display_name')
        .in('id', [...userIds])
    : { data: [] }

  // Fetch plan info (type + goal)
  const { data: plans } = planIds.size > 0
    ? await supabase
        .from('fitness_training_plans')
        .select('id, plan_type, goal')
        .in('id', [...planIds])
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))
  const planMap = new Map((plans ?? []).map(p => [p.id, { plan_type: p.plan_type, goal: p.goal }]))

  const enriched = (shares ?? []).map(s => {
    const partnerId = s.source_user_id === user.id ? s.target_user_id : s.source_user_id
    const planInfo = planMap.get(s.source_plan_id)
    return {
      ...s,
      direction: s.source_user_id === user.id ? 'sent' : 'received',
      partner_name: profileMap.get(partnerId) ?? 'Unknown',
      plan_type: planInfo?.plan_type ?? null,
      plan_goal: planInfo?.goal ?? null,
    }
  })

  return NextResponse.json({ shares: enriched })
}
