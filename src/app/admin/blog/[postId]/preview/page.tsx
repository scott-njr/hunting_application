import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { BlogContent } from '@/components/blog/blog-content'
import { BLOG_CATEGORY_LABELS } from '@/lib/blog-utils'

export default async function PreviewBlogPostPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: post, error } = await admin
    .from('blog_post')
    .select('*')
    .eq('id', postId)
    .single()

  if (error || !post) notFound()

  // Get author name
  const { data: profile } = await admin
    .from('user_profile')
    .select('display_name')
    .eq('id', post.author_id)
    .single()

  return (
    <div className="space-y-6">
      {/* Admin banner */}
      <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          Preview Mode — this post is <span className="font-semibold capitalize">{post.status}</span>
        </div>
        <Link
          href={`/admin/blog/${postId}/edit`}
          className="flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to edit
        </Link>
      </div>

      {/* Post preview (mirrors public layout) */}
      <article className="max-w-3xl mx-auto">
        {post.cover_image_url && (
          <div className="relative h-64 sm:h-80 rounded-lg overflow-hidden mb-6">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-500/15 text-blue-400">
            {BLOG_CATEGORY_LABELS[post.category] ?? post.category}
          </span>
          {post.published_on && (
            <span className="text-muted text-xs">
              {new Date(post.published_on).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">{post.title}</h1>

        <p className="text-secondary text-sm mb-6">
          By {profile?.display_name ?? 'Unknown'}
        </p>

        {post.excerpt && (
          <p className="text-secondary text-base italic mb-8 border-l-2 border-accent pl-4">
            {post.excerpt}
          </p>
        )}

        <BlogContent html={post.content} />
      </article>
    </div>
  )
}
