import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import { PublicFooter } from '@/components/layout/public-footer'
import { BlogContent } from '@/components/blog/blog-content'
import { BLOG_CATEGORY_LABELS } from '@/lib/blog-utils'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_post')
    .select('title, excerpt')
    .eq('slug', slug)
    .single()

  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.excerpt ?? `Read "${post.title}" on the Lead the Wild blog.`,
    alternates: { canonical: `/blog/${slug}` },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // RLS filters to published only
  const { data: post } = await supabase
    .from('blog_post')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!post) notFound()

  // Get author name
  const { data: profile } = post.author_id
    ? await supabase
        .from('user_profile')
        .select('display_name')
        .eq('id', post.author_id)
        .single()
    : { data: null }

  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            ...(post.published_on && { datePublished: post.published_on }),
            ...(post.cover_image_url && { image: post.cover_image_url }),
            author: {
              '@type': 'Person',
              name: profile?.display_name ?? 'Unknown',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Lead the Wild',
            },
          }),
        }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-accent hover:underline mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
        </Link>

        {post.cover_image_url && (
          <div className="relative h-64 sm:h-80 rounded-lg overflow-hidden mb-8">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={800}
              height={400}
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

        <p className="text-secondary text-sm mb-8">
          By {profile?.display_name ?? 'Unknown'}
        </p>

        {post.excerpt && (
          <p className="text-secondary text-base italic mb-8 border-l-2 border-accent pl-4">
            {post.excerpt}
          </p>
        )}

        <BlogContent html={post.content} />
      </main>

      <PublicFooter />
    </div>
  )
}
