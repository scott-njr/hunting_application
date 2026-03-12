import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Plus, FileText, Globe, Archive, PenLine } from 'lucide-react'
import { BlogPostsTable } from '@/components/blog/blog-posts-table'

export default async function AdminBlogPage() {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts } = await admin
    .from('blog_post')
    .select('*')
    .order('created_on', { ascending: false })

  // Enrich with author names
  const authorIds = [...new Set((posts ?? []).map(p => p.author_id))]
  const { data: profiles } = authorIds.length > 0
    ? await admin.from('user_profile').select('id, display_name').in('id', authorIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))
  const enriched = (posts ?? []).map(p => ({
    ...p,
    author_name: profileMap.get(p.author_id) ?? 'Unknown',
  }))

  const total = enriched.length
  const published = enriched.filter(p => p.status === 'published').length
  const drafts = enriched.filter(p => p.status === 'draft').length
  const archived = enriched.filter(p => p.status === 'archived').length

  const stats = [
    { label: 'Total Posts', value: total, icon: FileText },
    { label: 'Published', value: published, icon: Globe },
    { label: 'Drafts', value: drafts, icon: PenLine },
    { label: 'Archived', value: archived, icon: Archive },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Blog Posts</h1>
        <Link
          href="/admin/blog/new"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-card border border-subtle rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-accent" />
              <span className="text-muted text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Posts table */}
      <div className="glass-card border border-subtle rounded-lg overflow-hidden">
        <BlogPostsTable posts={enriched} />
      </div>
    </div>
  )
}
