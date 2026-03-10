import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: issue, error } = await supabase
    .from('issue_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ issue })
}

export async function PATCH(
  req: Request,
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

  const body = await req.json()
  const { status, resolution, admin_notes, release_tag } = body

  const updates: Record<string, unknown> = {}

  if (status) {
    const validStatuses = ['open', 'in_progress', 'resolved', 'wont_fix']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data: issue, error } = await supabase
    .from('issue_reports')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ issue })
}
