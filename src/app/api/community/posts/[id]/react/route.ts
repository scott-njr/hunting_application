import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, withHandler, serverError } from '@/lib/api-response'

// POST /api/community/posts/[id]/react — toggle like on/off
export const POST = withHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { id: postId } = await params

  // Check if already liked
  const { data: existing } = await supabase
    .from('social_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Unlike
    await supabase.from('social_reactions').delete().eq('id', existing.id)
  } else {
    // Like
    await supabase.from('social_reactions').insert({ post_id: postId, user_id: user.id })
  }

  // Return updated count
  const { data: reactions } = await supabase
    .from('social_reactions')
    .select('id')
    .eq('post_id', postId)

  return apiOk({
    liked: !existing,
    reaction_count: reactions?.length ?? 0,
  })
})

