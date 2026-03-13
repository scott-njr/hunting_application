import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, serverError, withHandler } from '@/lib/api-response'

// GET /api/friends — returns friends for the authenticated user
// ?status=accepted (default) — confirmed friends only (used by hunt party picker)
// ?status=all — all friendships including pending (used by friends page)

export const GET = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const statusFilter = req.nextUrl.searchParams.get('status') ?? 'accepted'

  let query = supabase
    .from('my_friends')
    .select('friendship_id, friend_id, display_name, email, direction, status, created_on')
    .order('display_name')

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter as 'accepted' | 'pending' | 'declined' | 'blocked')
  } else {
    query = query.in('status', ['accepted', 'pending'])
  }

  const { data, error } = await query

  if (error) {
    console.error('[Friends] fetch error:', error)
    return serverError()
  }

  return apiOk({ friends: data ?? [] })
})

