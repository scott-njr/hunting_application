import { NextRequest } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiDone, apiError, forbidden, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'scott-njr/hunting_application'

/** POST — Trigger the Auto Fix Issue GitHub Actions workflow */
export const POST = withHandler(async (req: NextRequest) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  if (!GITHUB_TOKEN) {
    return serverError('GITHUB_TOKEN not configured')
  }

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { issueId, title, description, proposedFix, adminNotes, severity, pageUrl } = body

  if (!issueId || !title || !description || !proposedFix || !severity) {
    return badRequest('Missing required fields')
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/auto-fix.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        ref: 'dev',
        inputs: {
          issue_id: issueId,
          title,
          description,
          proposed_fix: proposedFix,
          admin_notes: adminNotes || '',
          severity,
          page_url: pageUrl || '',
        },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error(`[auto-fix] GitHub API error ${res.status}:`, text)
    return apiError('External service error', 502)
  }

  return apiDone()
})

