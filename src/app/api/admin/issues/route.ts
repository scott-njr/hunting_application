import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'

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
    .select('*')
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

  // Enrich issues with email from members and display_name from user_profile
  const issueUserIds = [...new Set((data ?? []).map(i => i.user_id))]
  const [{ data: issueMembers }, { data: issueProfiles }] = issueUserIds.length > 0
    ? await Promise.all([
        admin.from('members').select('id, email').in('id', issueUserIds),
        admin.from('user_profile').select('id, display_name').in('id', issueUserIds),
      ])
    : [{ data: [] }, { data: [] }]
  const issueEmailMap = new Map((issueMembers ?? []).map(m => [m.id, m.email]))
  const issueProfileMap = new Map((issueProfiles ?? []).map(p => [p.id, p.display_name]))

  const enrichedIssues = (data ?? []).map(i => ({
    ...i,
    members: { email: issueEmailMap.get(i.user_id) ?? '', display_name: issueProfileMap.get(i.user_id) ?? null },
  }))

  if (!includeStats) {
    return NextResponse.json({ issues: enrichedIssues })
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
      .select('id, user_id, module, category, title, resolution, resolved_at, created_at, release_tag')
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

  // Enrich resolved issues with email and display_name
  const resolvedUserIds = [...new Set((resolvedIssues ?? []).map(i => i.user_id))]
  const [{ data: resolvedMembers }, { data: resolvedProfiles }] = resolvedUserIds.length > 0
    ? await Promise.all([
        admin.from('members').select('id, email').in('id', resolvedUserIds),
        admin.from('user_profile').select('id, display_name').in('id', resolvedUserIds),
      ])
    : [{ data: [] }, { data: [] }]
  const resolvedEmailMap = new Map((resolvedMembers ?? []).map(m => [m.id, m.email]))
  const resolvedProfileMap = new Map((resolvedProfiles ?? []).map(p => [p.id, p.display_name]))

  const enrichedResolved = (resolvedIssues ?? []).map(i => ({
    ...i,
    members: { email: resolvedEmailMap.get(i.user_id) ?? '', display_name: resolvedProfileMap.get(i.user_id) ?? null },
  }))

  return NextResponse.json({
    issues: enrichedIssues,
    stats: {
      totalResolved: totalResolved ?? 0,
      resolvedThisMonth: resolvedThisMonth ?? 0,
      avgResolutionDays,
      byModule,
    },
    resolvedIssues: enrichedResolved,
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
