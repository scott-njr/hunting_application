import Link from 'next/link'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/format'
import { MODULE_BADGE_COLORS } from '@/lib/modules'

interface FeedPost {
  id: string
  module: string
  displayName: string
  content: string
  created_on: string
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
                <span className="text-[10px] text-muted ml-auto">{timeAgo(post.created_on, { compact: true })}</span>
              </div>
              <p className="text-muted text-xs line-clamp-1">{post.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
