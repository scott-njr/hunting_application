import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, apiError, unauthorized, notFound, forbidden, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

// POST /api/fitness/plans/share — Share a plan with a friend
export const POST = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { plan_id, friend_id } = body

  if (!plan_id || !friend_id) {
    return badRequest('plan_id and friend_id are required')
  }

  // Verify plan belongs to the current user and is active
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('id, plan_type, goal')
    .eq('id', plan_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!plan) return notFound('Plan not found or not active')

  // Verify friend_id is an accepted friend
  const { data: friends } = await supabase
    .from('my_friends')
    .select('friend_id')
    .eq('status', 'accepted')

  const isFriend = friends?.some(f => f.friend_id === friend_id)
  if (!isFriend) return forbidden()

  // Check for existing share (allow re-share if previously declined)
  const { data: existing } = await supabase
    .from('fitness_shared_plans')
    .select('id, status')
    .eq('source_plan_id', plan_id)
    .eq('target_user_id', friend_id)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'pending') {
      return apiError('Already shared and pending', 409)
    }
    if (existing.status === 'accepted') {
      return apiError('Already shared and accepted', 409)
    }
    // Declined — re-share by updating back to pending
    const { data: updated, error } = await supabase
      .from('fitness_shared_plans')
      .update({ status: 'pending' as const, created_on: new Date().toISOString(), target_plan_id: null, accepted_at: null })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('[Fitness Share Plan] re-share error:', error)
      return serverError()
    }
    return apiOk({ share: updated })
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

  if (error) {
    console.error('[Fitness Share Plan] insert error:', error)
    return serverError()
  }

  return apiOk({ share }, 201)
})


// GET /api/fitness/plans/share — List shared plans
export const GET = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const direction = req.nextUrl.searchParams.get('direction') ?? 'all'

  let query = supabase
    .from('fitness_shared_plans')
    .select('*')
    .order('created_on', { ascending: false })

  if (direction === 'sent') {
    query = query.eq('source_user_id', user.id)
  } else if (direction === 'received') {
    query = query.eq('target_user_id', user.id)
  }
  // 'all' — RLS handles visibility (both directions)

  const { data: shares, error } = await query

  if (error) {
    console.error('[Fitness Share Plan] fetch error:', error)
    return serverError()
  }

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

  // Fetch plan info (type + goal + plan_data for preview)
  const { data: plans } = planIds.size > 0
    ? await supabase
        .from('fitness_training_plans')
        .select('id, plan_type, goal, weeks_total, plan_data')
        .in('id', [...planIds])
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  interface PlanWeek {
    theme?: string
    sessions?: { title?: string; type?: string; meal_type?: string }[]
  }

  const planMap = new Map((plans ?? []).map(p => {
    // Build a lightweight preview from plan_data
    const weeks = (p.plan_data as { weeks?: PlanWeek[] })?.weeks ?? []
    const totalSessions = weeks.reduce((sum: number, w: PlanWeek) => sum + (w.sessions?.length ?? 0), 0)
    const weekPreviews = weeks.slice(0, 2).map((w: PlanWeek) => ({
      theme: w.theme ?? null,
      session_count: w.sessions?.length ?? 0,
    }))

    return [p.id, {
      plan_type: p.plan_type,
      goal: p.goal,
      weeks_total: p.weeks_total,
      total_sessions: totalSessions,
      week_previews: weekPreviews,
    }]
  }))

  const enriched = (shares ?? []).map(s => {
    const partnerId = s.source_user_id === user.id ? s.target_user_id : s.source_user_id
    const planInfo = planMap.get(s.source_plan_id)
    return {
      ...s,
      direction: s.source_user_id === user.id ? 'sent' : 'received',
      partner_name: profileMap.get(partnerId) ?? 'Unknown',
      plan_type: planInfo?.plan_type ?? null,
      plan_goal: planInfo?.goal ?? null,
      weeks_total: planInfo?.weeks_total ?? null,
      total_sessions: planInfo?.total_sessions ?? null,
      week_previews: planInfo?.week_previews ?? null,
    }
  })

  return apiOk({ shares: enriched })
})

