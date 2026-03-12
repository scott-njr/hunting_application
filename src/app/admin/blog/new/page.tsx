import { BlogPostForm } from '@/components/blog/blog-post-form'

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">New Blog Post</h1>
      <BlogPostForm />
    </div>
  )
}
