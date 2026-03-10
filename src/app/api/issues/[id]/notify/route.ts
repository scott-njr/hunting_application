import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin
  const { data: member } = await supabase
    .from('members')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch the issue
  const { data: issue, error: issueError } = await supabase
    .from('issue_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (issueError || !issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  if (issue.status !== 'resolved') {
    return NextResponse.json({ error: 'Issue must be resolved before notifying' }, { status: 400 })
  }

  // Get reporter email
  const { data: reporter } = await supabase
    .from('members')
    .select('email, full_name')
    .eq('id', issue.user_id)
    .single()

  if (!reporter?.email) {
    return NextResponse.json({ error: 'Reporter email not found' }, { status: 404 })
  }

  // Send email via Resend
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Lead the Wild <noreply@praevius.com>',
      to: reporter.email,
      subject: `Your issue report has been resolved: ${issue.title}`,
      text: `Hi ${reporter.full_name ?? 'there'},\n\nYour issue report "${issue.title}" has been resolved.\n\n${issue.resolution ? `Resolution: ${issue.resolution}` : 'The issue has been fixed.'}\n\nThank you for helping us improve Lead the Wild!\n\n— The Lead the Wild Team`,
    })
  } else {
    console.log('[Issue Notify]', { to: reporter.email, issue: issue.title, resolution: issue.resolution })
  }

  // Update notified_at
  await supabase
    .from('issue_reports')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
