import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'

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
    .select('id, email, is_admin, onboarding_completed, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    // Sanitize search to prevent PostgREST filter injection
    const safe = search.replace(/[(),."'\\]/g, '')
    if (safe) {
      query = query.or(`email.ilike.%${safe}%`)
    }
  }

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch display names and module subscriptions for all returned users
  const userIds = (data ?? []).map(u => u.id)
  const [{ data: profiles }, { data: subs }] = userIds.length > 0
    ? await Promise.all([
        admin.from('user_profile').select('id, display_name').in('id', userIds),
        admin.from('module_subscriptions').select('user_id, module_slug, tier, status').in('user_id', userIds),
      ])
    : [{ data: [] }, { data: [] }]

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))
  const subsByUser = new Map<string, { module_slug: string; tier: string; status: string }[]>()
  for (const sub of subs ?? []) {
    const list = subsByUser.get(sub.user_id) ?? []
    list.push({ module_slug: sub.module_slug, tier: sub.tier, status: sub.status })
    subsByUser.set(sub.user_id, list)
  }

  const users = (data ?? []).map(u => ({
    ...u,
    display_name: profileMap.get(u.id) ?? null,
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
