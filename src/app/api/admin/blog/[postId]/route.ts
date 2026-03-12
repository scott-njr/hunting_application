import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, apiDone, apiError, forbidden, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

export const GET = withHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const { postId } = await params

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('blog_post')
    .select('*')
    .eq('id', postId)
    .single()

  if (error || !data) return notFound('Post not found')

  return apiOk({ post: data })
})


export const PATCH = withHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const { postId } = await params
  const raw = await parseBody(req)
  if (isErrorResponse(raw)) return raw

  // Allowlist: only permit known blog_post fields
  const ALLOWED_FIELDS = [
    'title', 'slug', 'excerpt', 'content', 'cover_image_url',
    'status', 'published_on', 'meta_title', 'meta_description',
  ] as const
  const body: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in raw) body[key] = raw[key]
  }

  if (Object.keys(body).length === 0) {
    return badRequest('No valid fields provided')
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // If publishing and no published_on set yet, auto-set it
  if (body.status === 'published') {
    const { data: existing } = await admin
      .from('blog_post')
      .select('published_on')
      .eq('id', postId)
      .single()

    if (existing && !existing.published_on) {
      body.published_on = new Date().toISOString()
    }
  }

  const { data, error } = await admin
    .from('blog_post')
    .update(body)
    .eq('id', postId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return apiError('A post with this slug already exists', 409)
    }
    return serverError('Failed to update post')
  }

  return apiOk({ post: data })
})


export const DELETE = withHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const { postId } = await params

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('blog_post')
    .delete()
    .eq('id', postId)

  if (error) return serverError('Failed to delete post')

  return apiDone()
})

