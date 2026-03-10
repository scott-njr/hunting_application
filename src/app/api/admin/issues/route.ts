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

  const status = req.nextUrl.searchParams.get('status') ?? 'open'
  const moduleParam = req.nextUrl.searchParams.get('module')
  const includeStats = req.nextUrl.searchParams.get('include_stats') === 'true'

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = admin
    .from('issue_reports')
    .select('*, members!issue_reports_user_id_members_fkey(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (moduleParam) {
    query = query.eq('module', moduleParam)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!includeStats) {
    return NextResponse.json({ issues: data })
  }

  // Fetch stats and resolved issues for changelog
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: totalResolved },
    { count: resolvedThisMonth },
    { data: resolvedIssues },
  ] = await Promise.all([
    admin.from('issue_reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    admin.from('issue_reports').select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('resolved_at', monthStart),
    admin.from('issue_reports')
      .select('id, module, category, title, resolution, resolved_at, created_at, release_tag, members!issue_reports_user_id_members_fkey(email, full_name)')
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false })
      .limit(200),
  ])

  // Compute avg resolution time and by-module breakdown
  let totalResolutionMs = 0
  let resolutionCount = 0
  const byModule: Record<string, number> = {}

  for (const issue of resolvedIssues ?? []) {
    if (issue.resolved_at && issue.created_at) {
      totalResolutionMs += new Date(issue.resolved_at).getTime() - new Date(issue.created_at).getTime()
      resolutionCount++
    }
    byModule[issue.module] = (byModule[issue.module] ?? 0) + 1
  }

  const avgResolutionDays = resolutionCount > 0
    ? Math.round((totalResolutionMs / resolutionCount) / (1000 * 60 * 60 * 24) * 10) / 10
    : 0

  return NextResponse.json({
    issues: data,
    stats: {
      totalResolved: totalResolved ?? 0,
      resolvedThisMonth: resolvedThisMonth ?? 0,
      avgResolutionDays,
      byModule,
    },
    resolvedIssues: resolvedIssues ?? [],
  })
}

export async function PATCH(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { issueId, status, admin_notes, resolution, release_tag } = body

  if (!issueId) return NextResponse.json({ error: 'Missing issueId' }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (admin_notes !== undefined) update.admin_notes = admin_notes
  if (resolution !== undefined) update.resolution = resolution
  if (release_tag !== undefined) update.release_tag = release_tag
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString()
    update.resolved_by = adminUser.id
  }

  const { error } = await admin
    .from('issue_reports')
    .update(update)
    .eq('id', issueId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
