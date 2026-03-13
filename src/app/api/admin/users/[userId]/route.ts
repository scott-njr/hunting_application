import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, apiDone, forbidden, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

export const GET = withHandler(async (_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const { userId } = await params

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: member }, { data: profile }, { data: subscriptions }, { data: plans }] = await Promise.all([
    admin
      .from('members')
      .select('id, email, is_admin, created_on')
      .eq('id', userId)
      .single(),
    admin
      .from('user_profile')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('module_subscriptions')
      .select('module_slug, tier, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
    admin
      .from('fitness_training_plans')
      .select('id, plan_type, status, goal, weeks_total, started_at, created_on')
      .eq('user_id', userId)
      .order('created_on', { ascending: false }),
  ])

  if (!member) return notFound('User not found')

  return apiOk({
    member: { ...member, display_name: profile?.display_name ?? null },
    subscriptions: subscriptions ?? [],
    plans: plans ?? [],
  })
})


export const PATCH = withHandler(async (req: NextRequest, { params }: { params: Promise<{ userId: string }> }) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const { userId } = await params
  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { planId, status } = body

  if (!planId || !status) {
    return badRequest('Missing planId or status')
  }

  const validStatuses = ['active', 'completed', 'abandoned']
  if (!validStatuses.includes(status)) {
    return badRequest('Invalid status')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('fitness_training_plans')
    .update({ status })
    .eq('id', planId)
    .eq('user_id', userId)

  if (error) return serverError()

  return apiDone()
})

