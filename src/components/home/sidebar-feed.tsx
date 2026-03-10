import Link from 'next/link'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULE_BADGE_COLORS: Record<string, string> = {
  hunting: 'bg-emerald-500/15 text-emerald-400',
  archery: 'bg-blue-500/15 text-blue-400',
  firearms: 'bg-red-500/15 text-red-400',
  medical: 'bg-pink-500/15 text-pink-400',
  fishing: 'bg-cyan-500/15 text-cyan-400',
  fitness: 'bg-amber-500/15 text-amber-400',
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface FeedPost {
  id: string
  module: string
  displayName: string
  content: string
  created_at: string
}

export function SidebarFeed({ posts }: { posts: FeedPost[] }) {
  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-subtle">
        <Users className="h-4 w-4 text-accent" />
        <span className="text-primary font-semibold text-sm">Community Feed</span>
      </div>

      {posts.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-muted text-xs">No recent community activity.</p>
        </div>
      ) : (
        <div className="divide-y divide-subtle">
          {posts.map(post => (
            <Link
              key={post.id}
              href={`/${post.module}/community`}
              className="block px-4 py-2.5 hover:bg-elevated transition-colors"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn(
                  'text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded',
                  MODULE_BADGE_COLORS[post.module] ?? 'bg-surface text-muted'
                )}>
                  {post.module}
                </span>
                <span className="text-xs text-primary font-medium">{post.displayName}</span>
                <span className="text-[10px] text-muted ml-auto">{timeAgo(post.created_at)}</span>
              </div>
              <p className="text-muted text-xs line-clamp-1">{post.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
