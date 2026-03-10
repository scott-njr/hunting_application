import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'scott-njr/hunting_application'

/**
 * Verify GitHub webhook signature (HMAC-SHA256).
 * Returns true if valid or if no secret is configured (dev/testing).
 */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!GITHUB_WEBHOOK_SECRET) return true // skip verification if secret not set
  if (!signature) return false

  const expected = 'sha256=' + crypto
    .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

/**
 * POST — GitHub webhook for workflow_run events.
 *
 * Fires when the "Auto Fix Issue" workflow completes.
 * Updates deploy_log status and resolves the linked issue on success.
 */
export async function POST(req: Request) {
  const rawBody = await req.text()

  // Verify GitHub signature
  const signature = req.headers.get('x-hub-signature-256')
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = req.headers.get('x-github-event')

  // Only handle workflow_run events
  if (event !== 'workflow_run') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const payload = JSON.parse(rawBody)
  const { action, workflow_run } = payload

  // Only process completed runs
  if (action !== 'completed') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Only process our auto-fix workflow
  if (workflow_run.name !== 'Auto Fix Issue') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const branch: string = workflow_run.head_branch ?? ''
  const conclusion: string = workflow_run.conclusion ?? '' // success, failure, cancelled
  const runUrl: string = workflow_run.html_url ?? ''

  // Extract issue_id from branch name: "auto-fix/{uuid}"
  const issueIdMatch = branch.match(/^auto-fix\/(.+)$/)
  if (!issueIdMatch) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Not an auto-fix branch' })
  }

  const issueId = issueIdMatch[1]
  const isSuccess = conclusion === 'success'
  const deployStatus = isSuccess ? 'success' : 'failed'

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Update deploy_log for this issue
  const { data: deployLog } = await admin
    .from('deploy_log')
    .select('id')
    .eq('issue_id', issueId)
    .in('status', ['triggered', 'building'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (deployLog) {
    await admin
      .from('deploy_log')
      .update({
        status: deployStatus,
        completed_at: new Date().toISOString(),
        github_pr_url: runUrl,
      })
      .eq('id', deployLog.id)
  }

  if (isSuccess) {
    // Mark issue as resolved
    await admin
      .from('issue_reports')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution: 'Auto-fixed by AI deploy pipeline',
      })
      .eq('id', issueId)

    // Close the GitHub Issue if one exists
    const { data: issue } = await admin
      .from('issue_reports')
      .select('github_issue_url')
      .eq('id', issueId)
      .single()

    if (issue?.github_issue_url && GITHUB_TOKEN) {
      // Extract issue number from URL: https://github.com/owner/repo/issues/123
      const ghIssueMatch = issue.github_issue_url.match(/\/issues\/(\d+)$/)
      if (ghIssueMatch) {
        const issueNumber = ghIssueMatch[1]
        try {
          await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                state: 'closed',
                state_reason: 'completed',
              }),
            }
          )
        } catch (err) {
          console.error('[Deploy Status] Failed to close GitHub Issue:', err)
        }
      }
    }
  }

  console.log(`[Deploy Status] Issue ${issueId}: ${deployStatus} (run: ${runUrl})`)

  return NextResponse.json({ ok: true, issueId, status: deployStatus })
}
