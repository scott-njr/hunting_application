import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { apiDone, unauthorized, forbidden, notFound, badRequest } from '@/lib/api-response'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Check admin
  const { data: member } = await supabase
    .from('members')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin) {
    return forbidden()
  }

  // Fetch the issue
  const { data: issue, error: issueError } = await supabase
    .from('issue_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (issueError || !issue) {
    return notFound('Issue not found')
  }

  if (issue.status !== 'resolved') {
    return badRequest('Issue must be resolved before notifying')
  }

  // Get reporter email and display name
  const [{ data: reporter }, { data: reporterProfile }] = await Promise.all([
    supabase.from('members').select('email').eq('id', issue.user_id).single(),
    supabase.from('user_profile').select('display_name').eq('id', issue.user_id).maybeSingle(),
  ])

  if (!reporter?.email) {
    return notFound('Reporter email not found')
  }

  const reporterName = reporterProfile?.display_name ?? 'there'

  // Send email via Resend
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Lead the Wild <noreply@praevius.com>',
      to: reporter.email,
      subject: `Your issue report has been resolved: ${issue.title}`,
      text: `Hi ${reporterName},\n\nYour issue report "${issue.title}" has been resolved.\n\n${issue.resolution ? `Resolution: ${issue.resolution}` : 'The issue has been fixed.'}\n\nThank you for helping us improve Lead the Wild!\n\n— The Lead the Wild Team`,
    })
  } else {
    console.warn(`[Issue Notify] No RESEND_API_KEY — skipped notifying reporter for issue ${id}`)
  }

  // Update notified_at
  await supabase
    .from('issue_reports')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', id)

  return apiDone()
}
