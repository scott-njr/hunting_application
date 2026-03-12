import { createClient } from '@/lib/supabase/server'
import { apiOk, apiDone, unauthorized, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

// GET /api/community/posts/[id]/comments
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { id: postId } = await params

  const { data: comments, error } = await supabase
    .from('social_comments')
    .select('id, post_id, user_id, content, created_on')
    .eq('post_id', postId)
    .order('created_on', { ascending: true })
    .limit(100)

  if (error) {
    console.error('[community/posts/comments GET] fetch error:', error.message)
    return serverError()
  }
  if (!comments || comments.length === 0) return apiOk({ comments: [] })

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

  return apiOk({
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
  if (!user) return unauthorized()

  const { id: postId } = await params
  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const trimmed = String(body.content ?? '').trim()

  if (!trimmed) return badRequest('Content is required')
  if (trimmed.length > 1000) return badRequest('Comment must be 1000 characters or fewer')

  const { data: comment, error } = await supabase
    .from('social_comments')
    .insert({ post_id: postId, user_id: user.id, content: trimmed })
    .select('id, post_id, user_id, content, created_on')
    .single()

  if (error) {
    console.error('[community/posts/comments POST] insert error:', error.message)
    return serverError()
  }

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name, user_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return apiOk({ comment: { ...comment, display_name: profile?.display_name ?? null, user_name: profile?.user_name ?? null, avatar_url: profile?.avatar_url ?? null } }, 201)
}

// DELETE /api/community/posts/[id]/comments?comment_id=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  await params // satisfy params type
  const { searchParams } = new URL(req.url)
  const commentId = searchParams.get('comment_id')
  if (!commentId) return badRequest('comment_id required')

  const { error } = await supabase
    .from('social_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id) // RLS + belt-and-suspenders: own comment only

  if (error) {
    console.error('[community/posts/comments DELETE] delete error:', error.message)
    return serverError()
  }
  return apiDone()
}
