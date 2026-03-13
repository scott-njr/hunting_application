import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, forbidden, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/messages?friend_id=xxx — fetch conversation with a specific friend
export const GET = withHandler(async (req: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const friendId = searchParams.get('friend_id')
  if (!friendId) return badRequest('friend_id required')
  if (!UUID_RE.test(friendId)) return badRequest('Invalid friend_id')

  const { data, error } = await supabase
    .from('social_messages')
    .select('id, sender_id, recipient_id, content, read_at, created_on')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`)
    .order('created_on', { ascending: true })
    .limit(100)

  if (error) {
    console.error('[messages GET] fetch error:', error.message)
    return serverError()
  }

  // Mark unread messages as read
  await supabase
    .from('social_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', friendId)
    .eq('recipient_id', user.id)
    .is('read_at', null)

  return apiOk({ messages: data ?? [] })
})


// POST /api/messages — send a direct message
export const POST = withHandler(async (req: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { recipient_id, content } = body as { recipient_id: string; content: string }

  const trimmedContent = String(content ?? '').trim()
  if (!recipient_id || !trimmedContent) {
    return badRequest('recipient_id and content are required')
  }
  if (!UUID_RE.test(recipient_id)) {
    return badRequest('Invalid recipient_id')
  }
  if (trimmedContent.length > 2000) {
    return badRequest('Message must be 2000 characters or fewer')
  }

  // Verify they are friends (accepted)
  const { data: friendship } = await supabase
    .from('social_friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${user.id})`)
    .maybeSingle()

  if (!friendship) {
    return forbidden()
  }

  const { data, error } = await supabase
    .from('social_messages')
    .insert({
      sender_id: user.id,
      recipient_id,
      content: trimmedContent,
    })
    .select('id, sender_id, recipient_id, content, read_at, created_on')
    .single()

  if (error) {
    console.error('[messages POST] insert error:', error.message)
    return serverError()
  }
  return apiOk({ message: data }, 201)
})

