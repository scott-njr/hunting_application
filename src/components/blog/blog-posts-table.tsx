'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Eye, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOG_CATEGORY_LABELS, BLOG_TARGET_LABELS } from '@/lib/blog-utils'
import type { Database } from '@/types/database.types'

type BlogPostRow = Database['public']['Tables']['blog_post']['Row'] & { author_name: string }

interface BlogPostsTableProps {
  posts: BlogPostRow[]
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-500/15 text-amber-400',
  published: 'bg-accent/15 text-accent',
  archived: 'bg-[color:var(--color-muted)]/15 text-muted',
}

export function BlogPostsTable({ posts }: BlogPostsTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setDeleting(null)
    }
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        No blog posts yet. Create your first one.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-subtle text-muted text-xs uppercase tracking-wide">
            <th className="text-left py-3 px-4 font-semibold">Title</th>
            <th className="text-left py-3 px-4 font-semibold">Category</th>
            <th className="text-left py-3 px-4 font-semibold">Status</th>
            <th className="text-left py-3 px-4 font-semibold">Targets</th>
            <th className="text-left py-3 px-4 font-semibold">Published</th>
            <th className="text-left py-3 px-4 font-semibold">Author</th>
            <th className="text-right py-3 px-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} className="border-b border-subtle/50 hover:bg-elevated/50 transition-colors">
              <td className="py-3 px-4">
                <span className="text-primary font-medium">{post.title}</span>
                <span className="block text-muted text-xs font-mono mt-0.5">/blog/{post.slug}</span>
              </td>
              <td className="py-3 px-4">
                <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-500/15 text-blue-400">
                  {BLOG_CATEGORY_LABELS[post.category] ?? post.category}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={cn('inline-block px-2 py-0.5 rounded text-xs capitalize', STATUS_STYLES[post.status])}>
                  {post.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {(post.targets ?? ['public']).map(t => (
                    <span key={t} className={cn(
                      'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                      t === 'public' ? 'bg-accent/15 text-accent' : 'bg-purple-500/15 text-purple-400'
                    )}>
                      {BLOG_TARGET_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4 text-muted text-xs">
                {post.published_on
                  ? new Date(post.published_on).toLocaleDateString()
                  : '—'}
              </td>
              <td className="py-3 px-4 text-secondary text-xs">
                {post.author_name}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/blog/${post.id}/edit`}
                    className="p-1.5 rounded text-muted hover:text-primary hover:bg-elevated transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/blog/${post.id}/preview`}
                    className="p-1.5 rounded text-muted hover:text-primary hover:bg-elevated transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={deleting === post.id}
                    className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-elevated transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
