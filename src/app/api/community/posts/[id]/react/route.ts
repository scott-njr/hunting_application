import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/community/posts/[id]/react — toggle like on/off
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params

  // Check if already liked
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Unlike
    await supabase.from('post_reactions').delete().eq('id', existing.id)
  } else {
    // Like
    await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id })
  }

  // Return updated count
  const { data: reactions } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', postId)

  return NextResponse.json({
    liked: !existing,
    reaction_count: reactions?.length ?? 0,
  })
}
