import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('members')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return member?.is_admin ? user : null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: member }, { data: subscriptions }, { data: plans }] = await Promise.all([
    admin
      .from('members')
      .select('id, email, full_name, is_admin, created_at')
      .eq('id', userId)
      .single(),
    admin
      .from('module_subscriptions')
      .select('module_slug, tier, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
    admin
      .from('training_plans')
      .select('id, plan_type, status, goal, weeks_total, started_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (!member) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ member, subscriptions: subscriptions ?? [], plans: plans ?? [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  const body = await req.json()
  const { planId, status } = body

  if (!planId || !status) {
    return NextResponse.json({ error: 'Missing planId or status' }, { status: 400 })
  }

  const validStatuses = ['active', 'completed', 'abandoned']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('training_plans')
    .update({ status })
    .eq('id', planId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
