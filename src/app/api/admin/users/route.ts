import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, apiDone, forbidden, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

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
    .select('id, email, is_admin, onboarding_completed, created_on', { count: 'exact' })
    .order('created_on', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    // Sanitize search to prevent PostgREST filter injection
    const safe = search.replace(/[(),."'\\]/g, '')
    if (safe) {
      query = query.or(`email.ilike.%${safe}%`)
    }
  }

  const { data, count, error } = await query

  if (error) return serverError()

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

  return apiOk({ users, total: count, page, limit })
}

export async function PATCH(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { userId, field, value } = body

  if (!userId || !field) {
    return badRequest('Missing userId or field')
  }

  const allowedFields = ['is_admin']
  if (!allowedFields.includes(field)) {
    return badRequest('Field not allowed')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('members')
    .update({ [field]: value })
    .eq('id', userId)

  if (error) return serverError()

  return apiDone()
}
