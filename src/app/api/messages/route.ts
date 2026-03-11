import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/messages?friend_id=xxx — fetch conversation with a specific friend
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const friendId = searchParams.get('friend_id')
  if (!friendId) return NextResponse.json({ error: 'friend_id required' }, { status: 400 })
  if (!UUID_RE.test(friendId)) return NextResponse.json({ error: 'Invalid friend_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('social_messages')
    .select('id, sender_id, recipient_id, content, read_at, created_at')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('[messages GET] fetch error:', error.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Mark unread messages as read
  await supabase
    .from('social_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', friendId)
    .eq('recipient_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ messages: data ?? [] })
}

// POST /api/messages — send a direct message
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { recipient_id, content } = body

  const trimmedContent = String(content ?? '').trim()
  if (!recipient_id || !trimmedContent) {
    return NextResponse.json({ error: 'recipient_id and content are required' }, { status: 400 })
  }
  if (!UUID_RE.test(recipient_id)) {
    return NextResponse.json({ error: 'Invalid recipient_id' }, { status: 400 })
  }
  if (trimmedContent.length > 2000) {
    return NextResponse.json({ error: 'Message must be 2000 characters or fewer' }, { status: 400 })
  }

  // Verify they are friends (accepted)
  const { data: friendship } = await supabase
    .from('social_friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${user.id})`)
    .maybeSingle()

  if (!friendship) {
    return NextResponse.json({ error: 'You can only message friends' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('social_messages')
    .insert({
      sender_id: user.id,
      recipient_id,
      content: trimmedContent,
    })
    .select('id, sender_id, recipient_id, content, read_at, created_at')
    .single()

  if (error) {
    console.error('[messages POST] insert error:', error.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
  return NextResponse.json({ message: data })
}
