import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/friends/respond — accept or decline an incoming friend request
// Body: { friendship_id: string, action: 'accept' | 'decline' }
// Only the recipient can respond (enforced by RLS)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { friendship_id, action } = body

  if (!friendship_id || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined'

  const { data, error } = await supabase
    .from('social_friendships')
    .update({ status: newStatus })
    .eq('id', friendship_id)
    .eq('recipient_id', user.id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Request not found or already responded' }, { status: 404 })

  return NextResponse.json({ friendship: data })
}
