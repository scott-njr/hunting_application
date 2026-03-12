'use client'

import { useEffect, useState } from 'react'
import { Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { TacticalSelect } from '@/components/ui/tactical-select'

interface Post {
  id: string
  user_id: string
  post_type: string
  entity_name: string | null
  content: string
  module: string
  created_on: string
  display_name: string | null
}

const MODULE_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'hunting', label: 'Hunting' },
  { value: 'archery', label: 'Archery' },
  { value: 'firearms', label: 'Firearms' },
  { value: 'medical', label: 'Medical' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'fitness', label: 'Fitness' },
]

const TYPE_COLORS: Record<string, string> = {
  discussion: 'bg-blue-500/15 text-blue-400',
  unit_review: 'bg-accent/15 text-accent',
  hunt_report: 'bg-amber-500/15 text-amber-400',
  guide_review: 'bg-purple-500/15 text-purple-400',
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [moduleFilter, setModuleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadPosts() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('social_posts')
        .select('id, user_id, post_type, entity_name, content, module, created_on')
        .order('created_on', { ascending: false })
        .limit(50)

      if (moduleFilter !== 'all') {
        query = query.eq('module', moduleFilter as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness')
      }

      const { data: rawPosts } = await query
      const posts = (rawPosts ?? []) as { id: string; user_id: string; post_type: string; entity_name: string | null; content: string; module: string; created_on: string }[]

      // Fetch display names from user_profile
      const userIds = [...new Set(posts.map(p => p.user_id))]
      const profileMap = new Map<string, string | null>()
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profile')
          .select('id, display_name')
          .in('id', userIds)
        for (const p of profiles ?? []) profileMap.set(p.id, p.display_name)
      }

      if (!cancelled) {
        setPosts(posts.map(p => ({ ...p, display_name: profileMap.get(p.user_id) ?? null })))
        setLoading(false)
      }
    }
    loadPosts()
    return () => { cancelled = true }
  }, [moduleFilter])

  async function deletePost(postId: string) {
    setConfirmDelete(null)
    setDeleting(postId)
    const supabase = createClient()

    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', postId)

    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
    setDeleting(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-muted text-sm mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <TacticalSelect
          value={moduleFilter}
          onChange={val => setModuleFilter(val)}
          options={MODULE_OPTIONS}
          className="text-xs"
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-surface border border-subtle animate-pulse" />
          ))
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
            <p className="text-muted text-sm">No community posts found.</p>
          </div>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              className={cn(
                'rounded-lg border border-subtle bg-surface p-4 transition-opacity',
                deleting === post.id && 'opacity-50'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary text-sm font-medium">
                      {post.display_name || 'Unknown'}
                    </span>
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', TYPE_COLORS[post.post_type] || TYPE_COLORS.discussion)}>
                      {post.post_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-muted uppercase">{post.module}</span>
                  </div>
                  {post.entity_name && (
                    <p className="text-accent text-xs mb-1">{post.entity_name}</p>
                  )}
                  <p className="text-secondary text-sm line-clamp-3">{post.content}</p>
                  <p className="text-muted text-xs mt-2">
                    {new Date(post.created_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={`/${post.module}/community`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded text-muted hover:text-secondary hover:bg-elevated transition-colors"
                    title="View in community"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {confirmDelete === post.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deletePost(post.id)}
                        disabled={deleting === post.id}
                        className="text-[10px] font-semibold text-red-400 bg-red-500/15 hover:bg-red-500/25 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {deleting === post.id ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] text-muted hover:text-secondary px-2 py-1 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(post.id)}
                      disabled={deleting === post.id}
                      className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
