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

  // Fetch user emails for display
  const userIds = [...new Set((logs ?? []).map(l => l.user_id))]
  let userMap: Record<string, { email: string; full_name: string | null }> = {}
  if (userIds.length > 0) {
    const { data: members } = await admin
      .from('members')
      .select('id, email, full_name')
      .in('id', userIds)
    for (const m of members ?? []) {
      userMap[m.id] = { email: m.email, full_name: m.full_name }
    }
  }

  // Attach user info to each log
  const enrichedLogs = (logs ?? []).map(log => ({
    ...log,
    user_email: userMap[log.user_id]?.email ?? '',
    user_name: userMap[log.user_id]?.full_name ?? null,
  }))

  // Get distinct features for filter dropdown
  const { data: features } = await admin
    .from('ai_responses')
    .select('feature')
    .limit(100)

  const distinctFeatures = [...new Set((features ?? []).map(f => f.feature))].sort()

  return NextResponse.json({ logs: enrichedLogs, total: count ?? 0, features: distinctFeatures })
}
