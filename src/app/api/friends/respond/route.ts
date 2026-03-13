import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, badRequest, notFound, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

// POST /api/friends/respond — accept or decline an incoming friend request
// Body: { friendship_id: string, action: 'accept' | 'decline' }
// Only the recipient can respond (enforced by RLS)

export const POST = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { friendship_id, action } = body

  if (!friendship_id || !['accept', 'decline'].includes(action)) {
    return badRequest('Invalid request')
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

  if (error) {
    console.error('[friends/respond POST] update error:', error.message)
    return serverError()
  }
  if (!data) return notFound('Request not found or already responded')

  return apiOk({ friendship: data })
})

