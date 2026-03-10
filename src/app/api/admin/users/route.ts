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

export async function GET(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const search = req.nextUrl.searchParams.get('search') ?? ''
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
  const limit = 25
  const offset = (page - 1) * limit

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = admin
    .from('members')
    .select('id, email, full_name, is_admin, onboarding_completed, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    // Sanitize search to prevent PostgREST filter injection
    const safe = search.replace(/[(),."'\\]/g, '')
    if (safe) {
      query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`)
    }
  }

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch module subscriptions for all returned users
  const userIds = (data ?? []).map(u => u.id)
  const { data: subs } = userIds.length > 0
    ? await admin.from('module_subscriptions').select('user_id, module_slug, tier, status').in('user_id', userIds)
    : { data: [] }

  const subsByUser = new Map<string, { module_slug: string; tier: string; status: string }[]>()
  for (const sub of subs ?? []) {
    const list = subsByUser.get(sub.user_id) ?? []
    list.push({ module_slug: sub.module_slug, tier: sub.tier, status: sub.status })
    subsByUser.set(sub.user_id, list)
  }

  const users = (data ?? []).map(u => ({
    ...u,
    subscriptions: subsByUser.get(u.id) ?? [],
  }))

  return NextResponse.json({ users, total: count, page, limit })
}

export async function PATCH(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { userId, field, value } = body

  if (!userId || !field) {
    return NextResponse.json({ error: 'Missing userId or field' }, { status: 400 })
  }

  const allowedFields = ['is_admin']
  if (!allowedFields.includes(field)) {
    return NextResponse.json({ error: 'Field not allowed' }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('members')
    .update({ [field]: value })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
