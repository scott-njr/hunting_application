import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, forbidden, notFound, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Check if user is admin
  const { data: member } = await supabase
    .from('members')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const { data: issue, error } = await supabase
    .from('issue_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return serverError()
  if (!issue) return notFound()

  // Non-admin users can only see their own issues
  if (!member?.is_admin && issue.user_id !== user.id) {
    return notFound()
  }

  // Strip admin-only fields for non-admin users
  if (!member?.is_admin) {
    const { admin_notes: _, ai_proposed_fix: __, ...safeIssue } = issue
    return apiOk({ issue: safeIssue })
  }

  return apiOk({ issue })
}

export async function PATCH(
  req: Request,
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

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { status, resolution, admin_notes, release_tag } = body

  const updates: Record<string, unknown> = {}

  if (status) {
    const validStatuses = ['open', 'in_progress', 'resolved', 'wont_fix']
    if (!validStatuses.includes(status)) {
      return badRequest('Invalid status')
    }
    updates.status = status
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      updates.resolved_by = user.id
    }
  }

  if (resolution !== undefined) updates.resolution = String(resolution).trim().slice(0, 2000)
  if (admin_notes !== undefined) updates.admin_notes = String(admin_notes).trim().slice(0, 2000)
  if (release_tag !== undefined) updates.release_tag = String(release_tag).trim().slice(0, 50) || null

  if (Object.keys(updates).length === 0) {
    return badRequest('No updates provided')
  }

  const { data: issue, error } = await supabase
    .from('issue_reports')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return serverError()

  return apiOk({ issue })
}
