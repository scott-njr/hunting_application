import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/friends/[id] — remove a friend or cancel/decline a pending request
// Either party can delete their shared friendship row (enforced by RLS)

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('social_friendships')
    .delete()
    .eq('id', id)
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  if (error) return NextResponse.json({ error: 'Failed to remove friendship' }, { status: 500 })

  return NextResponse.json({ success: true })
}
