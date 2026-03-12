import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/format'
import { MODULE_BADGE_COLORS } from '@/lib/modules'

interface TopPost {
  id: string
  post_type: string
  content: string
  module: string
  created_on: string
  reactionCount: number
  commentCount: number
}

export function TopPosts({ posts }: { posts: TopPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-5 text-center">
        <p className="text-muted text-sm">No community posts yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <Link
          key={post.id}
          href={`/${post.module}/community`}
          className="block rounded-lg border border-subtle bg-surface p-4 hover:border-default transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded',
              MODULE_BADGE_COLORS[post.module] ?? 'bg-surface text-muted'
            )}>
              {post.module}
            </span>
            <span className="text-[10px] text-muted capitalize">{post.post_type.replace(/_/g, ' ')}</span>
            <span className="text-[10px] text-muted ml-auto">{timeAgo(post.created_on)}</span>
          </div>
          <p className="text-secondary text-sm line-clamp-2">{post.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted">
              <Heart className="h-3 w-3" /> {post.reactionCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <MessageCircle className="h-3 w-3" /> {post.commentCount}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
