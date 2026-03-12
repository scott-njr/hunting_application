import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, apiError, forbidden, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts, error } = await admin
    .from('blog_post')
    .select('*')
    .order('created_on', { ascending: false })

  if (error) return serverError('Failed to fetch posts')

  // Enrich with author display names
  const authorIds = [...new Set((posts ?? []).map(p => p.author_id))]
  const { data: profiles } = authorIds.length > 0
    ? await admin.from('user_profile').select('id, display_name').in('id', authorIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))
  const enriched = (posts ?? []).map(p => ({
    ...p,
    author_name: profileMap.get(p.author_id) ?? 'Unknown',
  }))

  return apiOk({ posts: enriched })
}

export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { title, slug, content, excerpt, cover_image_url, category, status } = body

  if (!title || !slug || !category) {
    return badRequest('Title, slug, and category are required')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const insertData: Record<string, unknown> = {
    title,
    slug,
    content: content ?? '',
    excerpt: excerpt || null,
    cover_image_url: cover_image_url || null,
    category,
    status: status ?? 'draft',
    author_id: adminUser.id,
  }

  // Auto-set published_on when publishing
  if (insertData.status === 'published') {
    insertData.published_on = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('blog_post')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return apiError('A post with this slug already exists', 409)
    }
    return serverError('Failed to create post')
  }

  return apiOk({ post: data }, 201)
}
