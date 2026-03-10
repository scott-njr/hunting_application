import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/friends — returns friends for the authenticated user
// ?status=accepted (default) — confirmed friends only (used by hunt party picker)
// ?status=all — all friendships including pending (used by friends page)

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const statusFilter = req.nextUrl.searchParams.get('status') ?? 'accepted'

  let query = supabase
    .from('my_friends')
    .select('friendship_id, friend_id, display_name, email, direction, status, created_at')
    .order('display_name')

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter as 'accepted' | 'pending' | 'declined' | 'blocked')
  } else {
    query = query.in('status', ['accepted', 'pending'])
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ friends: data ?? [] })
}
