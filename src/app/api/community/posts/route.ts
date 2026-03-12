import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

export const GET = withHandler(async (req: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const postType = searchParams.get('type')
  const postModule = (searchParams.get('module') ?? 'hunting') as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'

  let query = supabase
    .from('social_posts')
    .select('id, user_id, post_type, entity_name, content, module, metadata, created_on')
    .eq('module', postModule)
    .order('created_on', { ascending: false })
    .limit(50)

  if (postType && postType !== 'all') {
    query = query.eq('post_type', postType as 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review')
  }

  const { data: posts, error } = await query
  if (error) {
    console.error('[community/posts GET] fetch error:', error.message)
    return serverError()
  }
  if (!posts || posts.length === 0) return apiOk({ posts: [] })

  const postIds = posts.map(p => p.id)
  const userIds = [...new Set(posts.map(p => p.user_id))]

  // Fetch display names, comment counts, reaction counts, and user's own reactions in parallel
  const [profilesResult, commentCountsResult, reactionCountsResult, userReactionsResult] = await Promise.all([
    supabase.from('user_profile').select('id, display_name, user_name, avatar_url').in('id', userIds),
    supabase.from('social_comments').select('post_id').in('post_id', postIds),
    supabase.from('social_reactions').select('post_id').in('post_id', postIds),
    supabase.from('social_reactions').select('post_id').in('post_id', postIds).eq('user_id', user.id),
  ])

  const nameMap: Record<string, string | null> = {}
  const userNameMap: Record<string, string | null> = {}
  const avatarMap: Record<string, string | null> = {}
  for (const p of profilesResult.data ?? []) {
    nameMap[p.id] = p.display_name
    userNameMap[p.id] = p.user_name
    avatarMap[p.id] = p.avatar_url
  }

  const commentCountMap: Record<string, number> = {}
  for (const c of commentCountsResult.data ?? []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1
  }

  const reactionCountMap: Record<string, number> = {}
  for (const r of reactionCountsResult.data ?? []) {
    reactionCountMap[r.post_id] = (reactionCountMap[r.post_id] ?? 0) + 1
  }

  const likedSet = new Set((userReactionsResult.data ?? []).map(r => r.post_id))

  return apiOk({
    posts: posts.map(p => ({
      ...p,
      display_name: nameMap[p.user_id] ?? null,
      user_name: userNameMap[p.user_id] ?? null,
      avatar_url: avatarMap[p.user_id] ?? null,
      comment_count: commentCountMap[p.id] ?? 0,
      reaction_count: reactionCountMap[p.id] ?? 0,
      liked_by_me: likedSet.has(p.id),
    })),
  })
})


export const POST = withHandler(async (req: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { post_type, entity_name, content, module: postModule } = body as {
    post_type: string
    entity_name: string
    content: string
    module: string
  }
  const safeModule = String(postModule ?? 'hunting').trim() as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'

  const trimmedContent = String(content ?? '').trim()
  if (!trimmedContent) {
    return badRequest('Content is required')
  }
  if (trimmedContent.length > 5000) {
    return badRequest('Content must be 5000 characters or fewer')
  }

  const validTypes = ['discussion', 'unit_review', 'hunt_report', 'guide_review']
  if (!validTypes.includes(post_type)) {
    return badRequest('Invalid post type')
  }

  const safeEntityName = String(entity_name ?? '').trim().slice(0, 200) || null

  const { data: post, error } = await supabase
    .from('social_posts')
    .insert({
      user_id: user.id,
      post_type: post_type as 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review',
      entity_name: safeEntityName,
      content: trimmedContent,
      module: safeModule,
    })
    .select('id, user_id, post_type, entity_name, content, module, created_on')
    .single()

  if (error) {
    console.error('[community/posts POST] insert error:', error.message)
    return serverError()
  }

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name, user_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return apiOk({
    post: {
      ...post,
      display_name: profile?.display_name ?? null,
      user_name: profile?.user_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      comment_count: 0,
      reaction_count: 0,
      liked_by_me: false,
    },
  }, 201)
})

