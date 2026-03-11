import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = 'scott-njr/hunting_application'

/** POST — Trigger the Auto Fix Issue GitHub Actions workflow */
export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  const { issueId, title, description, proposedFix, adminNotes, severity, pageUrl } = await req.json()

  if (!issueId || !title || !description || !proposedFix || !severity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    return NextResponse.json(
      { error: `GitHub API error: ${res.status} — ${text}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
