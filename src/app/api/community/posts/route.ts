import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const postType = searchParams.get('type')
  const postModule = searchParams.get('module') ?? 'hunting'

  let query = supabase
    .from('social_posts')
    .select('id, user_id, post_type, entity_name, content, module, metadata, created_at')
    .eq('module', postModule)
    .order('created_at', { ascending: false })
    .limit(50)

  if (postType && postType !== 'all') {
    query = query.eq('post_type', postType as 'discussion' | 'unit_review' | 'hunt_report' | 'guide_review')
  }

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts || posts.length === 0) return NextResponse.json({ posts: [] })

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

  return NextResponse.json({
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
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { post_type, entity_name, content, module: postModule } = body
  const safeModule = String(postModule ?? 'hunting').trim()

  const trimmedContent = String(content ?? '').trim()
  if (!trimmedContent) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }
  if (trimmedContent.length > 5000) {
    return NextResponse.json({ error: 'Content must be 5000 characters or fewer' }, { status: 400 })
  }

  const validTypes = ['discussion', 'unit_review', 'hunt_report', 'guide_review']
  if (!validTypes.includes(post_type)) {
    return NextResponse.json({ error: 'Invalid post type' }, { status: 400 })
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
    .select('id, user_id, post_type, entity_name, content, module, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name, user_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({
    post: {
      ...post,
      display_name: profile?.display_name ?? null,
      user_name: profile?.user_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      comment_count: 0,
      reaction_count: 0,
      liked_by_me: false,
    },
  })
}
