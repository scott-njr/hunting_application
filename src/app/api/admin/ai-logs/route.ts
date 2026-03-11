import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'

export async function GET(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const params = req.nextUrl.searchParams
  const moduleParam = params.get('module')
  const feature = params.get('feature')
  const success = params.get('success') // 'true', 'false', or null (all)
  const flag = params.get('flag')
  const page = parseInt(params.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(params.get('limit') ?? '50', 10), 100)
  const offset = (page - 1) * limit

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Build query
  let query = admin
    .from('ai_responses')
    .select('id, user_id, module, feature, input_length, output_length, raw_response, tokens_input, tokens_output, parse_success, flags, duration_ms, sanitized_input, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (moduleParam) query = query.eq('module', moduleParam)
  if (feature) query = query.eq('feature', feature)
  if (success === 'true') query = query.eq('parse_success', true)
  if (success === 'false') query = query.eq('parse_success', false)
  if (flag) query = query.contains('flags', [flag])

  const { data: logs, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch user emails and display names
  const userIds = [...new Set((logs ?? []).map(l => l.user_id))]
  const emailMap: Record<string, string> = {}
  const nameMap: Record<string, string | null> = {}
  if (userIds.length > 0) {
    const [{ data: members }, { data: profiles }] = await Promise.all([
      admin.from('members').select('id, email').in('id', userIds),
      admin.from('user_profile').select('id, display_name').in('id', userIds),
    ])
    for (const m of members ?? []) emailMap[m.id] = m.email
    for (const p of profiles ?? []) nameMap[p.id] = p.display_name
  }

  // Attach user info to each log
  const enrichedLogs = (logs ?? []).map(log => ({
    ...log,
    user_email: emailMap[log.user_id] ?? '',
    user_name: nameMap[log.user_id] ?? null,
  }))

  // Get distinct features for filter dropdown
  const { data: features } = await admin
    .from('ai_responses')
    .select('feature')
    .limit(100)

  const distinctFeatures = [...new Set((features ?? []).map(f => f.feature))].sort()

  return NextResponse.json({ logs: enrichedLogs, total: count ?? 0, features: distinctFeatures })
}
