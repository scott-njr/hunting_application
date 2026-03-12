import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, apiError, unauthorized, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/friends/request — send a friend request to another user
// Body: { recipient_id: string }

export const POST = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { recipient_id } = body as { recipient_id: string }

  if (!recipient_id || recipient_id === user.id || !UUID_RE.test(recipient_id)) {
    return badRequest('Invalid recipient')
  }

  // Check if a friendship already exists in either direction
  const { data: existing } = await supabase
    .from('social_friendships')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${user.id})`)
    .maybeSingle() as { data: { id: string; status: string } | null }

  if (existing) {
    return apiError('Friendship already exists', 409, { status: existing.status })
  }

  const { data, error } = await supabase
    .from('social_friendships')
    .insert({ requester_id: user.id, recipient_id })
    .select()
    .single()

  if (error) {
    console.error('[Friends Request] insert error:', error)
    return serverError()
  }

  return apiOk({ friendship: data }, 201)
})

