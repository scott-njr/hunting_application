import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen, Crosshair, Wrench, Map, Users,
  TrendingUp,
} from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { AuthCtaButton } from '@/components/ui/auth-cta-button'
import { PublicFooter } from '@/components/layout/public-footer'
import { createClient } from '@/lib/supabase/server'
import { BLOG_CATEGORY_LABELS } from '@/lib/blog-utils'

export const metadata: Metadata = {
  title: 'Blog — Field Reports, Gear Reviews & Strategy',
  description: 'Field reports, gear reviews, draw strategy breakdowns, scouting intel, and community stories from hunters and outdoor athletes who actually do this.',
  alternates: { canonical: '/blog' },
}

const categories = [
  {
    icon: Crosshair,
    title: 'Field Reports',
    value: 'field_reports',
    description: 'Real hunt recaps from the community — what worked, what didn\'t, and lessons learned in the field.',
  },
  {
    icon: Wrench,
    title: 'Gear Reviews',
    value: 'gear_reviews',
    description: 'Honest, no-sponsor reviews on optics, packs, clothing, and tools — tested in the backcountry, not a studio.',
  },
  {
    icon: TrendingUp,
    title: 'Strategy Breakdowns',
    value: 'strategy_breakdowns',
    description: 'Draw odds analysis, point strategy, unit selection, and application timing — data-driven decisions for western big game.',
  },
  {
    icon: Map,
    title: 'Scouting Intel',
    value: 'scouting_intel',
    description: 'E-scouting workflows, map layer breakdowns, and how to read terrain before you ever set foot in the unit.',
  },
  {
    icon: Users,
    title: 'Community Stories',
    value: 'community_stories',
    description: 'First hunts, mentor moments, and the experiences that keep us coming back — told by the people who lived them.',
  },
  {
    icon: BookOpen,
    title: 'How-To Guides',
    value: 'how_to_guides',
    description: 'Step-by-step guides on everything from field dressing to building a hunt plan to applying for your first draw.',
  },
]

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: filterCategory } = await searchParams
  const supabase = await createClient()

  // RLS filters to published only
  let query = supabase
    .from('blog_post')
    .select('id, title, slug, excerpt, cover_image_url, category, published_on')
    .order('published_on', { ascending: false })
    .limit(9)

  if (filterCategory && filterCategory in BLOG_CATEGORY_LABELS) {
    query = query.eq('category', filterCategory as 'field_reports' | 'gear_reviews' | 'strategy_breakdowns' | 'scouting_intel' | 'community_stories' | 'how_to_guides')
  }

  const { data: posts } = await query

  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/exploring/bear_lake_2.JPG"
            alt="Mountain lake with golden aspens"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-7 w-7 text-accent" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Blog</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-4">Stories from the Field</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Field reports, gear reviews, strategy breakdowns, and stories from the community — written by people who actually do this.
          </p>
        </div>

      {/* About */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What You&apos;ll Find Here</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Praevius blog is where real-world experience meets actionable advice. No fluff, no clickbait — just genuine field knowledge from hunters, anglers, and outdoor athletes who have been there. Every article is written or reviewed by someone who has actually done what they&apos;re writing about.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Expect deep dives into draw strategy with real data, honest gear reviews from multi-day backcountry trips, scouting breakdowns that show you exactly how to read a unit before you get there, and field reports that don&apos;t sugarcoat the hard parts. We also highlight community stories — first hunts, mentoring moments, and the experiences that remind us why we do this.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          Whether you&apos;re researching your next application, shopping for a new pack, or just looking for something good to read — the blog is here for you.
        </p>
      </div>
      </section>

      {/* Categories grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">Content Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {categories.map(({ icon: FIcon, title, description, value }) => (
            <Link
              key={title}
              href={filterCategory === value ? '/blog' : `/blog?category=${value}`}
              className={`glass-card border rounded-lg p-5 transition-colors ${
                filterCategory === value ? 'border-accent bg-accent/5' : 'border-subtle hover:border-strong'
              }`}
            >
              <FIcon className="h-5 w-5 text-accent mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">
          {filterCategory ? BLOG_CATEGORY_LABELS[filterCategory] ?? 'Posts' : 'Latest Posts'}
        </h2>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="glass-card border border-subtle rounded-lg overflow-hidden hover:border-strong transition-colors group"
              >
                {post.cover_image_url ? (
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      width={800}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-elevated flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted/30" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-400">
                      {BLOG_CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                    {post.published_on && (
                      <span className="text-muted text-[10px]">
                        {new Date(post.published_on).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-primary font-semibold text-sm mb-1 group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted text-xs line-clamp-2">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted text-sm">Articles coming soon. Check back after launch.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16 text-center">
        <AuthCtaButton view="signup" className="btn-primary inline-flex items-center gap-2 text-sm rounded-full px-8 py-2.5 font-semibold">
          Get Started <ArrowRight className="h-4 w-4" />
        </AuthCtaButton>
        <p className="text-muted text-xs mt-3">Free tier available. No credit card required.</p>
      </section>

      </main>
      <PublicFooter />
    </div>
  )
}
