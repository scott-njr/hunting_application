import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { BlogPostForm } from '@/components/blog/blog-post-form'

export default async function EditBlogPostPage({
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Edit Post</h1>
      <BlogPostForm initialData={post} />
    </div>
  )
}
