import { createClient as createServiceClient } from '@supabase/supabase-js'
import { aiCall, extractJSON } from '@/lib/ai'
import { timingSafeEqual } from 'crypto'
import { apiDone, unauthorized, badRequest, parseBody, isErrorResponse } from '@/lib/api-response'

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'scott-njr/hunting_application'

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(req: Request) {
  // 1. Verify webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (!WEBHOOK_SECRET || !secret || !secureCompare(secret, WEBHOOK_SECRET)) {
    return unauthorized()
  }

  // 2. Parse Supabase webhook payload
  const payload = await parseBody(req)
  if (isErrorResponse(payload)) return payload
  const record = payload.record

  if (!record?.id || !record?.title || !record?.description) {
    return badRequest('Invalid payload')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. AI classification via aiCall()
  let severity: 'easy' | 'major' | null = null
  let proposedFix = ''
  let reasoning = ''

  try {
    const result = await aiCall({
      module: 'admin',
      feature: 'admin_bug_triage',
      userId: 'system',
      maxTokens: 512,
      userMessage: `Classify this bug report and propose a fix.

Title: ${record.title}
Category: ${record.category}
Module: ${record.module}
Page URL: ${record.page_url ?? 'not provided'}

Description:
${record.description}`,
    })

    if (result.success) {
      try {
        const parsed = extractJSON(result.response)
        if (parsed.severity === 'easy' || parsed.severity === 'major') {
          severity = parsed.severity
          proposedFix = (parsed.proposed_fix as string) ?? ''
          reasoning = (parsed.reasoning as string) ?? ''
        }
      } catch {
        console.error('[Issue Triage] Failed to parse AI response:', result.response)
      }
    }
  } catch (err) {
    console.error('[Issue Triage] AI classification failed:', err)
  }

  // 4. Update issue_reports with triage data
  const updateData: Record<string, unknown> = {
    ai_classified_at: new Date().toISOString(),
  }
  if (severity) {
    updateData.severity = severity
    updateData.ai_proposed_fix = proposedFix
    updateData.admin_notes = `AI Reasoning: ${reasoning}`
  }

  await admin
    .from('issue_reports')
    .update(updateData)
    .eq('id', record.id)

  // 5. Create GitHub Issue (skip if already created — prevents duplicates from webhook retries)
  let githubIssueUrl: string | null = null

  // Re-fetch to check if another webhook invocation already created the GitHub Issue
  const { data: freshIssue } = await admin
    .from('issue_reports')
    .select('github_issue_url')
    .eq('id', record.id)
    .single()

  if (freshIssue?.github_issue_url) {
    return apiDone({ severity, githubIssueUrl: freshIssue.github_issue_url })
  }

  if (GITHUB_TOKEN) {
    try {
      const severityTag = severity === 'easy' ? 'EASY' : severity === 'major' ? 'MAJOR' : 'UNCLASSIFIED'
      const labels = ['bug']
      if (severity) labels.push(severity)

      const ghResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/issues`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `[${severityTag}] Bug: ${record.title}`,
            body: [
              `**Module:** ${record.module}`,
              `**Category:** ${record.category}`,
              `**Page:** ${record.page_url ?? 'N/A'}`,
              `**Reported by:** User ${record.user_id}`,
              '',
              '## Description',
              record.description,
              '',
              proposedFix ? `## AI Proposed Fix\n${proposedFix}` : '',
              reasoning ? `\n## AI Reasoning\n${reasoning}` : '',
            ].filter(Boolean).join('\n'),
            labels,
          }),
        }
      )

      if (ghResponse.ok) {
        const ghData = await ghResponse.json()
        githubIssueUrl = ghData.html_url

        await admin
          .from('issue_reports')
          .update({ github_issue_url: githubIssueUrl })
          .eq('id', record.id)
      } else {
        console.error('[Issue Triage] GitHub Issue creation failed:', await ghResponse.text())
      }
    } catch (err) {
      console.error('[Issue Triage] GitHub API error:', err)
    }
  } else {
    console.warn('[Issue Triage] GITHUB_TOKEN not set, skipping GitHub Issue creation')
  }

  return apiDone({ severity, githubIssueUrl })
}
