import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, apiDone, forbidden, badRequest, notFound, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'scott-njr/hunting_application'

/** GET — Fetch deploy queue (triaged issues) + deploy history */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withHandler(async (_req: NextRequest) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch triaged issues (severity is set, not yet resolved)
  const { data: rawQueue } = await admin
    .from('issue_reports')
    .select('*')
    .not('severity', 'is', null)
    .in('status', ['open', 'in_progress'])
    .order('severity', { ascending: true }) // easy first
    .order('created_on', { ascending: false })
    .limit(50)

  // Enrich queue with email and display_name
  const queueUserIds = [...new Set((rawQueue ?? []).map(i => i.user_id))]
  const [{ data: queueMembers }, { data: queueProfiles }] = queueUserIds.length > 0
    ? await Promise.all([
        admin.from('members').select('id, email').in('id', queueUserIds),
        admin.from('user_profile').select('id, display_name').in('id', queueUserIds),
      ])
    : [{ data: [] }, { data: [] }]
  const queueEmailMap = new Map((queueMembers ?? []).map(m => [m.id, m.email]))
  const queueProfileMap = new Map((queueProfiles ?? []).map(p => [p.id, p.display_name]))
  const queue = (rawQueue ?? []).map(i => ({
    ...i,
    members: { email: queueEmailMap.get(i.user_id) ?? '', display_name: queueProfileMap.get(i.user_id) ?? null },
  }))

  // Fetch recent deploy history
  const { data: history } = await admin
    .from('deploy_log')
    .select('*')
    .order('created_on', { ascending: false })
    .limit(20)

  // Stats
  const { count: easyCount } = await admin
    .from('issue_reports')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'easy')
    .in('status', ['open', 'in_progress'])

  const { count: majorCount } = await admin
    .from('issue_reports')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'major')
    .in('status', ['open', 'in_progress'])

  // Deploys this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: deploysThisWeek } = await admin
    .from('deploy_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_on', weekAgo.toISOString())

  return apiOk({
    queue: queue ?? [],
    history: history ?? [],
    stats: {
      queueCount: (easyCount ?? 0) + (majorCount ?? 0),
      easyCount: easyCount ?? 0,
      majorCount: majorCount ?? 0,
      deploysThisWeek: deploysThisWeek ?? 0,
    },
  })
})


/** POST — Trigger fix & deploy via GitHub Action workflow_dispatch */
export const POST = withHandler(async (req: NextRequest) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { issueId, adminNotes } = body

  if (!issueId) {
    return badRequest('issueId required')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch the issue
  const { data: issue, error: issueError } = await admin
    .from('issue_reports')
    .select('*')
    .eq('id', issueId)
    .single()

  if (issueError || !issue) {
    return notFound('Issue not found')
  }

  // Save admin notes if provided
  if (adminNotes) {
    await admin
      .from('issue_reports')
      .update({ admin_deploy_notes: adminNotes })
      .eq('id', issueId)
  }

  // Trigger GitHub Action via workflow_dispatch
  if (!GITHUB_TOKEN) {
    return serverError('GITHUB_TOKEN not configured')
  }

  const dispatchResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/auto-fix.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'dev',
        inputs: {
          issue_id: issueId,
          title: issue.title,
          description: issue.description,
          proposed_fix: issue.ai_proposed_fix ?? '',
          admin_notes: adminNotes ?? issue.admin_deploy_notes ?? '',
          severity: issue.severity ?? 'major',
          page_url: issue.page_url ?? '',
        },
      }),
    }
  )

  if (!dispatchResponse.ok) {
    const errText = await dispatchResponse.text()
    console.error('[Deploy] GitHub Action dispatch failed:', errText)
    return serverError(`Failed to trigger GitHub Action: ${errText}`)
  }

  // Log the deploy
  await admin.from('deploy_log').insert({
    triggered_by: adminUser.id,
    issue_id: issueId,
    severity: issue.severity,
    status: 'triggered',
    admin_notes: adminNotes ?? null,
  })

  // Update issue status
  await admin
    .from('issue_reports')
    .update({ status: 'in_progress' })
    .eq('id', issueId)

  return apiDone({ message: 'GitHub Action triggered' })
})

