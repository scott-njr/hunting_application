import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/friends/request — send a friend request to another user
// Body: { recipient_id: string }

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { recipient_id } = body

  if (!recipient_id || recipient_id === user.id || !UUID_RE.test(recipient_id)) {
    return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
  }

  // Check if a friendship already exists in either direction
  const { data: existing } = await supabase
    .from('social_friendships')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${user.id})`)
    .maybeSingle() as { data: { id: string; status: string } | null }

  if (existing) {
    return NextResponse.json({ error: 'Friendship already exists', status: existing.status }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('social_friendships')
    .insert({ requester_id: user.id, recipient_id })
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ friendship: data }, { status: 201 })
}
