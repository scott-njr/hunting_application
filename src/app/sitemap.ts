import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://praevius.com'
  const now = new Date().toISOString()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/hunting`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/archery`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/firearms`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/fishing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/fitness`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/medical`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/spearfishing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/butcher-block`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/mindset`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/newsletter`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/auth/login`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/auth/signup`, changeFrequency: 'yearly', priority: 0.6 },
  ]

  // Dynamically fetch published blog posts
  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: posts } = await supabase
      .from('blog_post')
      .select('slug, published_on, updated_on')
      .order('published_on', { ascending: false })

    if (posts) {
      blogRoutes = posts.map(post => ({
        url: `${base}/blog/${post.slug}`,
        lastModified: post.updated_on ?? post.published_on ?? now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch {
    // Sitemap should not fail if blog query errors
  }

  return [...staticRoutes, ...blogRoutes]
}
