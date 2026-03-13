import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

export const GET = withHandler(async (req: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const postType = searchParams.get('type')
  const postModule = (searchParams.get('module') ?? 'hunting') as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'

  // If filtering to a specific non-blog type, skip blog posts
  const includeBlog = !postType || postType === 'all' || postType === 'blog'
  const includeSocial = !postType || postType === 'all' || postType !== 'blog'

  // Fetch social posts and blog posts in parallel
  const [socialResult, blogResult] = await Promise.all([
    includeSocial
      ? (() => {
          let query = supabase
            .from('social_posts')
            .select('id, user_id, post_type, entity_name, content, module, metadata, created_on')
            .eq('module', postModule)
            .order('created_on', { ascending: false })
            .limit(50)
          if (postType && postType !== 'all' && postType !== 'blog') {
            query = query.eq('post_type', postType as 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review')
          }
          return query
        })()
      : Promise.resolve({ data: [] as never[], error: null }),
    includeBlog
      ? supabase
          .from('blog_post')
          .select('id, title, slug, excerpt, cover_image_url, author_id, created_on')
          .eq('status', 'published')
          .contains('targets', [postModule])
          .order('created_on', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] as never[], error: null }),
  ])

  if (socialResult.error) {
    console.error('[community/posts GET] social fetch error:', socialResult.error.message)
    return serverError()
  }

  const posts = socialResult.data ?? []
  const blogPosts = blogResult.data ?? []

  if (posts.length === 0 && blogPosts.length === 0) return apiOk({ posts: [] })

  const postIds = posts.map(p => p.id)
  const userIds = [...new Set(posts.map(p => p.user_id))]

  // Also resolve blog post author names
  const blogAuthorIds = [...new Set(blogPosts.map(p => p.author_id).filter(Boolean))] as string[]
  const allProfileIds = [...new Set([...userIds, ...blogAuthorIds])]

  // Fetch display names, comment counts, reaction counts, and user's own reactions in parallel
  const profilesPromise = allProfileIds.length > 0
    ? supabase.from('user_profile').select('id, display_name, user_name, avatar_url').in('id', allProfileIds)
    : Promise.resolve({ data: [] as { id: string; display_name: string | null; user_name: string | null; avatar_url: string | null }[] })

  const commentsPromise = postIds.length > 0
    ? supabase.from('social_comments').select('post_id').in('post_id', postIds)
    : Promise.resolve({ data: [] as { post_id: string }[] })

  const reactionsPromise = postIds.length > 0
    ? supabase.from('social_reactions').select('post_id').in('post_id', postIds)
    : Promise.resolve({ data: [] as { post_id: string }[] })

  const userReactionsPromise = postIds.length > 0
    ? supabase.from('social_reactions').select('post_id').in('post_id', postIds).eq('user_id', user.id)
    : Promise.resolve({ data: [] as { post_id: string }[] })

  const [profilesResult, commentCountsResult, reactionCountsResult, userReactionsResult] = await Promise.all([
    profilesPromise,
    commentsPromise,
    reactionsPromise,
    userReactionsPromise,
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

  // Map social posts
  const socialItems = posts.map(p => ({
    ...p,
    is_blog: false as const,
    display_name: nameMap[p.user_id] ?? null,
    user_name: userNameMap[p.user_id] ?? null,
    avatar_url: avatarMap[p.user_id] ?? null,
    comment_count: commentCountMap[p.id] ?? 0,
    reaction_count: reactionCountMap[p.id] ?? 0,
    liked_by_me: likedSet.has(p.id),
  }))

  // Map blog posts to a feed-compatible shape
  const blogItems = blogPosts.map(bp => ({
    id: bp.id,
    user_id: bp.author_id,
    post_type: 'blog' as const,
    entity_name: null,
    content: bp.excerpt ?? '',
    module: postModule,
    metadata: null,
    created_on: bp.created_on,
    is_blog: true as const,
    blog_title: bp.title,
    blog_slug: bp.slug,
    blog_cover_image_url: bp.cover_image_url,
    display_name: bp.author_id ? nameMap[bp.author_id] ?? 'Lead the Wild' : 'Lead the Wild',
    user_name: bp.author_id ? userNameMap[bp.author_id] ?? null : null,
    avatar_url: bp.author_id ? avatarMap[bp.author_id] ?? null : null,
    comment_count: 0,
    reaction_count: 0,
    liked_by_me: false,
  }))

  // Merge and sort by created_on DESC
  const combined = [...socialItems, ...blogItems].sort(
    (a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
  )

  return apiOk({ posts: combined })
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

