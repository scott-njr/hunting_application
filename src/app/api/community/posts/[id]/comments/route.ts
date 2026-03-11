import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/community/posts/[id]/comments
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params

  const { data: comments, error } = await supabase
    .from('social_comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('[community/posts/comments GET] fetch error:', error.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
  if (!comments || comments.length === 0) return NextResponse.json({ comments: [] })

  const userIds = [...new Set(comments.map(c => c.user_id))]
  const { data: profiles } = await supabase
    .from('user_profile')
    .select('id, display_name, user_name, avatar_url')
    .in('id', userIds)

  const nameMap: Record<string, string | null> = {}
  const userNameMap: Record<string, string | null> = {}
  const avatarMap: Record<string, string | null> = {}
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.display_name
    userNameMap[p.id] = p.user_name
    avatarMap[p.id] = p.avatar_url
  }

  return NextResponse.json({
    comments: comments.map(c => ({
      ...c,
      display_name: nameMap[c.user_id] ?? null,
      user_name: userNameMap[c.user_id] ?? null,
      avatar_url: avatarMap[c.user_id] ?? null,
    })),
  })
}

// POST /api/community/posts/[id]/comments
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params
  const body = await req.json()
  const trimmed = String(body.content ?? '').trim()

  if (!trimmed) return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  if (trimmed.length > 1000) return NextResponse.json({ error: 'Comment must be 1000 characters or fewer' }, { status: 400 })

  const { data: comment, error } = await supabase
    .from('social_comments')
    .insert({ post_id: postId, user_id: user.id, content: trimmed })
    .select('id, post_id, user_id, content, created_at')
    .single()

  if (error) {
    console.error('[community/posts/comments POST] insert error:', error.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name, user_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({ comment: { ...comment, display_name: profile?.display_name ?? null, user_name: profile?.user_name ?? null, avatar_url: profile?.avatar_url ?? null } })
}

// DELETE /api/community/posts/[id]/comments?comment_id=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await params // satisfy params type
  const { searchParams } = new URL(req.url)
  const commentId = searchParams.get('comment_id')
  if (!commentId) return NextResponse.json({ error: 'comment_id required' }, { status: 400 })

  const { error } = await supabase
    .from('social_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id) // RLS + belt-and-suspenders: own comment only

  if (error) {
    console.error('[community/posts/comments DELETE] delete error:', error.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
