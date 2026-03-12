import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiDone, forbidden, badRequest, notFound, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'scott-njr/hunting_application'

/** POST — Manually trigger AI triage on an existing issue */
export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { issueId } = body
  if (!issueId) {
    return badRequest('issueId required')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch the issue
  const { data: record, error } = await admin
    .from('issue_reports')
    .select('*')
    .eq('id', issueId)
    .single()

  if (error || !record) {
    return notFound('Issue not found')
  }

  // AI classification
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
    return serverError('AI classification failed')
  }

  // Update issue with triage data
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
    .eq('id', issueId)

  // Create GitHub Issue if not already created
  let githubIssueUrl: string | null = record.github_issue_url ?? null

  if (GITHUB_TOKEN && !githubIssueUrl) {
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
          .eq('id', issueId)
      } else {
        console.error('[Issue Triage] GitHub Issue creation failed:', await ghResponse.text())
      }
    } catch (err) {
      console.error('[Issue Triage] GitHub API error:', err)
    }
  }

  return apiDone({
    severity,
    proposedFix,
    reasoning,
    githubIssueUrl,
    ai_classified_at: updateData.ai_classified_at as string,
  })
}
