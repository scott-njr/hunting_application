import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiDone, unauthorized, serverError, withHandler } from '@/lib/api-response'

// DELETE /api/friends/[id] — remove a friend or cancel/decline a pending request
// Either party can delete their shared friendship row (enforced by RLS)

export const DELETE = withHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { id } = await params

  const { error } = await supabase
    .from('social_friendships')
    .delete()
    .eq('id', id)
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  if (error) return serverError('Failed to remove friendship')

  return apiDone()
})

