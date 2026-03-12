'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare, Send, FileText, Map, Star, BookOpen,
  ThumbsUp, MessageCircle, Trash2, Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/format'

type Post = {
  id: string
  user_id: string
  post_type: string
  entity_name: string | null
  content: string
  created_on: string
  display_name: string | null
  user_name: string | null
  avatar_url: string | null
  comment_count: number
  reaction_count: number
  liked_by_me: boolean
  metadata: Record<string, unknown> | null
}

type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_on: string
  display_name: string | null
  user_name: string | null
  avatar_url: string | null
}

type PostTypeConfig = {
  label: string
  icon: React.ElementType
  color: string
  entityPlaceholder?: string
  contentPlaceholder?: string
}

const MODULE_POST_TYPES: Record<string, Record<string, PostTypeConfig>> = {
  hunting: {
    discussion: { label: 'Discussion', icon: BookOpen, color: 'text-secondary bg-elevated', contentPlaceholder: "What's on your mind?" },
    unit_review: { label: 'Unit Review', icon: Map, color: 'text-blue-400 bg-blue-900/30', entityPlaceholder: 'Unit number or name (e.g. Unit 85, E-E-049-O1-R)', contentPlaceholder: 'Share what you know about this unit...' },
    hunt_report: { label: 'Hunt Report', icon: FileText, color: 'text-accent-hover bg-accent-dim', entityPlaceholder: 'Species + state (e.g. CO Elk 2026)', contentPlaceholder: 'How did the season go?' },
    guide_review: { label: 'Guide Review', icon: Star, color: 'text-amber-400 bg-amber-900/30', entityPlaceholder: 'Guide service name', contentPlaceholder: 'How was the guide service?' },
  },
  archery: {
    discussion: { label: 'Discussion', icon: BookOpen, color: 'text-secondary bg-elevated', contentPlaceholder: "What's on your mind?" },
    gear_review: { label: 'Gear Review', icon: Star, color: 'text-amber-400 bg-amber-900/30', entityPlaceholder: 'Bow or gear name (e.g. Hoyt RX8)', contentPlaceholder: 'Share your experience with this gear...' },
    range_report: { label: 'Range Report', icon: FileText, color: 'text-accent-hover bg-accent-dim', entityPlaceholder: 'Range or event name', contentPlaceholder: 'How did the session go?' },
    tip: { label: 'Tip', icon: Map, color: 'text-blue-400 bg-blue-900/30', contentPlaceholder: 'Share a helpful archery tip...' },
  },
  firearms: {
    discussion: { label: 'Discussion', icon: BookOpen, color: 'text-secondary bg-elevated', contentPlaceholder: "What's on your mind?" },
    gear_review: { label: 'Gear Review', icon: Star, color: 'text-amber-400 bg-amber-900/30', entityPlaceholder: 'Firearm or accessory name', contentPlaceholder: 'Share your experience with this gear...' },
    range_report: { label: 'Range Report', icon: FileText, color: 'text-accent-hover bg-accent-dim', entityPlaceholder: 'Range or event name', contentPlaceholder: 'How did the session go?' },
    tip: { label: 'Tip', icon: Map, color: 'text-blue-400 bg-blue-900/30', contentPlaceholder: 'Share a helpful firearms tip...' },
  },
  fitness: {
    discussion: { label: 'Discussion', icon: BookOpen, color: 'text-secondary bg-elevated', contentPlaceholder: "What's on your mind?" },
    wow_result: { label: 'WOW Result', icon: Trophy, color: 'text-amber-400 bg-amber-900/30' },
    progress: { label: 'Progress', icon: FileText, color: 'text-accent-hover bg-accent-dim', contentPlaceholder: 'Share your training progress...' },
    gear_review: { label: 'Gear Review', icon: Star, color: 'text-amber-400 bg-amber-900/30', entityPlaceholder: 'Gear or supplement name', contentPlaceholder: 'Share your experience...' },
    tip: { label: 'Tip', icon: Map, color: 'text-blue-400 bg-blue-900/30', contentPlaceholder: 'Share a fitness tip...' },
  },
  fishing: {
    discussion: { label: 'Discussion', icon: BookOpen, color: 'text-secondary bg-elevated', contentPlaceholder: "What's on your mind?" },
    catch_report: { label: 'Catch Report', icon: FileText, color: 'text-accent-hover bg-accent-dim', entityPlaceholder: 'Species + location', contentPlaceholder: 'How did the trip go?' },
    gear_review: { label: 'Gear Review', icon: Star, color: 'text-amber-400 bg-amber-900/30', entityPlaceholder: 'Rod, reel, or tackle name', contentPlaceholder: 'Share your experience with this gear...' },
    spot_review: { label: 'Spot Review', icon: Map, color: 'text-blue-400 bg-blue-900/30', entityPlaceholder: 'Lake, river, or spot name', contentPlaceholder: 'Share what you know about this spot...' },
  },
  medical: {
    discussion: { label: 'Discussion', icon: BookOpen, color: 'text-secondary bg-elevated', contentPlaceholder: "What's on your mind?" },
    training_log: { label: 'Training Log', icon: FileText, color: 'text-accent-hover bg-accent-dim', contentPlaceholder: 'Share your training experience...' },
    gear_review: { label: 'Gear Review', icon: Star, color: 'text-amber-400 bg-amber-900/30', entityPlaceholder: 'Kit or gear name', contentPlaceholder: 'Share your experience with this gear...' },
    tip: { label: 'Tip', icon: Map, color: 'text-blue-400 bg-blue-900/30', contentPlaceholder: 'Share a helpful tip...' },
  },
}

function getPostTypes(moduleSlug: string) {
  return MODULE_POST_TYPES[moduleSlug] ?? MODULE_POST_TYPES.hunting
}

// Keep legacy lookups for rendering posts that may have old types
const ALL_POST_TYPE_LABELS: Record<string, string> = {}
const ALL_POST_TYPE_ICONS: Record<string, React.ElementType> = {}
const ALL_POST_TYPE_COLORS: Record<string, string> = {}
for (const mod of Object.values(MODULE_POST_TYPES)) {
  for (const [key, cfg] of Object.entries(mod)) {
    ALL_POST_TYPE_LABELS[key] = cfg.label
    ALL_POST_TYPE_ICONS[key] = cfg.icon
    ALL_POST_TYPE_COLORS[key] = cfg.color
  }
}

export function FeedPanel({ currentUserId, module = 'hunting' }: { currentUserId: string; module?: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const postTypes = getPostTypes(module)
  const postTypeKeys = Object.keys(postTypes)
  const [feedFilter, setFeedFilter] = useState<string>('all')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostType, setNewPostType] = useState<string>('discussion')
  const [newPostEntity, setNewPostEntity] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [postSubmitting, setPostSubmitting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [commentsLoading, setCommentsLoading] = useState<string | null>(null)
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({})
  const [commentSubmitting, setCommentSubmitting] = useState<string | null>(null)
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({})

  useEffect(() => { loadPosts() }, [feedFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPosts() {
    setPostsLoading(true)
    try {
      const qs = new URLSearchParams({ module })
      if (feedFilter !== 'all') qs.set('type', feedFilter)
      const res = await fetch(`/api/community/posts?${qs}`)
      if (!res.ok) { setPosts([]); return }
      const data = await res.json()
      setPosts(data.posts ?? [])
    } finally {
      setPostsLoading(false)
    }
  }

  async function submitPost() {
    if (!newPostContent.trim()) return
    setPostSubmitting(true)
    setPostError(null)
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_type: newPostType, entity_name: newPostEntity, content: newPostContent, module }),
      })
      const data = await res.json()
      if (!res.ok) { setPostError(data.error ?? 'Failed to post'); return }
      setPosts(prev => [data.post, ...prev])
      setNewPostContent('')
      setNewPostEntity('')
      setShowCreatePost(false)
    } finally { setPostSubmitting(false) }
  }

  async function toggleLike(postId: string) {
    try {
      const res = await fetch(`/api/community/posts/${postId}/react`, { method: 'POST' })
      if (!res.ok) return
      const data = await res.json()
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked_by_me: data.liked, reaction_count: data.reaction_count } : p
      ))
    } catch {
      // Network error — silently fail, user can retry
    }
  }

  async function loadComments(postId: string) {
    if (postComments[postId]) return
    setCommentsLoading(postId)
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`)
      if (!res.ok) { setPostComments(prev => ({ ...prev, [postId]: [] })); return }
      const data = await res.json()
      setPostComments(prev => ({ ...prev, [postId]: data.comments ?? [] }))
    } finally { setCommentsLoading(null) }
  }

  function toggleComments(postId: string) {
    if (expandedPostId === postId) { setExpandedPostId(null) }
    else { setExpandedPostId(postId); loadComments(postId) }
  }

  async function submitComment(postId: string) {
    const text = (newCommentText[postId] ?? '').trim()
    if (!text) return
    setCommentSubmitting(postId)
    setCommentErrors(prev => ({ ...prev, [postId]: '' }))
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      const data = await res.json()
      if (!res.ok) { setCommentErrors(prev => ({ ...prev, [postId]: data.error ?? 'Failed' })); return }
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), data.comment] }))
      setNewCommentText(prev => ({ ...prev, [postId]: '' }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
    } finally { setCommentSubmitting(null) }
  }

  async function deleteComment(postId: string, commentId: string) {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments?comment_id=${commentId}`, { method: 'DELETE' })
      if (!res.ok) return
      setPostComments(prev => ({ ...prev, [postId]: (prev[postId] ?? []).filter(c => c.id !== commentId) }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p))
    } catch {
      // Network error — silently fail, user can retry
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter + create */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {['all', ...postTypeKeys].map(t => (
            <button
              key={t}
              onClick={() => setFeedFilter(t)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full transition-colors',
                feedFilter === t
                  ? 'bg-accent text-primary'
                  : 'bg-elevated text-secondary hover:bg-strong hover:text-primary'
              )}
            >
              {t === 'all' ? 'All' : postTypes[t]?.label ?? t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreatePost(v => !v)}
          className="flex items-center gap-1.5 text-xs btn-primary px-3 py-1.5 rounded transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Post
        </button>
      </div>

      {/* Create post form */}
      {showCreatePost && (
        <div className="bg-elevated border border-default rounded-lg p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {postTypeKeys.map(t => {
              const cfg = postTypes[t]
              const Icon = cfg.icon
              return (
                <button
                  key={t}
                  onClick={() => setNewPostType(t)}
                  className={cn(
                    'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors',
                    newPostType === t
                      ? cfg.color + ' border border-current/30'
                      : 'bg-elevated text-muted hover:text-secondary'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              )
            })}
          </div>
          {postTypes[newPostType]?.entityPlaceholder && (
            <input
              type="text"
              value={newPostEntity}
              onChange={e => setNewPostEntity(e.target.value)}
              placeholder={postTypes[newPostType].entityPlaceholder}
              className="w-full bg-elevated border border-default text-primary rounded px-3 py-1.5 text-base sm:text-sm focus:border-accent focus:outline-none placeholder:text-muted"
            />
          )}
          <textarea
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
            placeholder={postTypes[newPostType]?.contentPlaceholder ?? "What's on your mind?"}
            rows={4}
            className="w-full bg-elevated border border-default text-primary rounded px-3 py-2 text-base sm:text-sm focus:border-accent focus:outline-none placeholder:text-muted resize-none"
          />
          {postError && <p className="text-red-400 text-xs">{postError}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowCreatePost(false); setPostError(null) }} className="text-xs text-muted hover:text-primary transition-colors px-3 py-1.5">Cancel</button>
            <button onClick={submitPost} disabled={!newPostContent.trim() || postSubmitting} className="text-xs btn-primary disabled:opacity-50 font-semibold px-4 py-1.5 rounded transition-colors">
              {postSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Feed posts */}
      {postsLoading ? (
        <div className="bg-elevated border border-subtle rounded-lg px-4 py-8 text-center">
          <p className="text-muted text-sm">Loading feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-elevated border border-subtle rounded-lg px-4 py-8 text-center">
          <MessageSquare className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No posts yet.</p>
          <p className="text-xs text-muted mt-1">Be the first to start a discussion.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const Icon = ALL_POST_TYPE_ICONS[post.post_type] ?? BookOpen
            const isExpanded = expandedPostId === post.id
            const comments = postComments[post.id] ?? []
            return (
              <div key={post.id} className="bg-elevated border border-subtle rounded-lg">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/home/profile/${post.user_id}`} className="shrink-0">
                      {post.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.avatar_url} alt={post.display_name ?? 'Member'} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-xs font-semibold text-primary">
                          {post.display_name ? post.display_name.slice(0, 2).toUpperCase() : '??'}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link href={`/home/profile/${post.user_id}`} className="text-primary text-sm font-medium hover:text-accent-hover transition-colors">{post.display_name ?? 'Member'}</Link>
                        {post.user_name && <span className="text-muted text-xs">@{post.user_name}</span>}
                        <span className={cn('flex items-center gap-1 text-xs px-1.5 py-0.5 rounded', ALL_POST_TYPE_COLORS[post.post_type] ?? 'text-secondary bg-elevated')}>
                          <Icon className="w-3 h-3" />
                          {ALL_POST_TYPE_LABELS[post.post_type] ?? post.post_type}
                        </span>
                        {post.entity_name && <span className="text-muted text-xs bg-elevated px-1.5 py-0.5 rounded">{post.entity_name}</span>}
                        <span className="text-muted text-xs ml-auto">{timeAgo(post.created_on)}</span>
                      </div>
                      <p className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      {/* Enhanced WOW result card */}
                      {post.metadata && 'wow_submission_id' in post.metadata && (() => {
                        const meta = post.metadata as { workout_title?: string; scaling?: string; score_display?: string }
                        return (
                          <div className="mt-2 flex items-center gap-3 bg-surface border border-subtle rounded-lg px-3 py-2">
                            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted">Weekly Challenge</p>
                              <p className="text-sm text-primary font-medium truncate">{meta.workout_title}</p>
                            </div>
                            <span className={cn(
                              'text-xs font-bold px-2 py-0.5 rounded shrink-0',
                              meta.scaling === 'rx' ? 'bg-green-500/20 text-green-400' :
                              meta.scaling === 'scaled' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-blue-500/20 text-blue-400'
                            )}>
                              {meta.scaling === 'rx' ? 'RX' : meta.scaling === 'scaled' ? 'Scaled' : 'Beginner'}
                            </span>
                            <span className="text-primary font-mono text-sm font-semibold shrink-0">{meta.score_display}</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 pb-3 flex items-center gap-4 border-t border-subtle pt-2.5">
                  <button onClick={() => toggleLike(post.id)} className={cn('flex items-center gap-1.5 text-xs min-h-[44px] transition-colors', post.liked_by_me ? 'text-accent-hover' : 'text-muted hover:text-secondary')}>
                    <ThumbsUp className={cn('w-3.5 h-3.5', post.liked_by_me && 'fill-current')} />
                    <span>{post.liked_by_me ? 'Liked' : 'Like'}</span>
                    {post.reaction_count > 0 && <span className={cn('font-semibold', post.liked_by_me ? 'text-accent-hover' : 'text-secondary')}>· {post.reaction_count}</span>}
                  </button>
                  <button onClick={() => toggleComments(post.id)} className={cn('flex items-center gap-1.5 text-xs min-h-[44px] transition-colors', isExpanded ? 'text-secondary' : 'text-muted hover:text-secondary')}>
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.comment_count > 0 ? `${post.comment_count} comment${post.comment_count === 1 ? '' : 's'}` : 'Comment'}</span>
                  </button>
                </div>

                {/* Comments */}
                {isExpanded && (
                  <div className="border-t border-subtle px-4 py-3 space-y-3">
                    {commentsLoading === post.id ? (
                      <p className="text-muted text-xs">Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-muted text-xs">No comments yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map(c => (
                          <div key={c.id} className="flex items-start gap-2">
                            <Link href={`/home/profile/${c.user_id}`} className="shrink-0 mt-0.5">
                              {c.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.avatar_url} alt={c.display_name ?? 'Member'} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center text-xs font-semibold text-primary">
                                  {c.display_name ? c.display_name.slice(0, 2).toUpperCase() : '??'}
                                </div>
                              )}
                            </Link>
                            <div className="flex-1 min-w-0 bg-elevated/50 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <Link href={`/home/profile/${c.user_id}`} className="text-xs font-medium text-primary hover:text-accent-hover transition-colors">{c.display_name ?? 'Member'}</Link>
                                {c.user_name && <span className="text-muted text-[10px]">@{c.user_name}</span>}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-muted text-xs">{timeAgo(c.created_on)}</span>
                                  {c.user_id === currentUserId && (
                                    <button onClick={() => deleteComment(post.id, c.id)} className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-400 transition-colors" title="Delete">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-secondary text-xs leading-relaxed whitespace-pre-wrap">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center text-xs font-semibold text-primary shrink-0">me</div>
                        <input
                          type="text"
                          value={newCommentText[post.id] ?? ''}
                          onChange={e => {
                            setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))
                            if (commentErrors[post.id]) setCommentErrors(prev => ({ ...prev, [post.id]: '' }))
                          }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id) } }}
                          placeholder="Write a comment..."
                          className="flex-1 bg-elevated border border-default text-primary rounded-full px-3 py-1.5 text-base sm:text-xs focus:border-accent focus:outline-none placeholder:text-muted"
                        />
                        <button
                          onClick={() => submitComment(post.id)}
                          disabled={!(newCommentText[post.id] ?? '').trim() || commentSubmitting === post.id}
                          className="text-accent-hover hover:text-accent-hover disabled:opacity-40 transition-colors shrink-0"
                        >
                          {commentSubmitting === post.id ? <span className="text-xs text-muted">...</span> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {commentErrors[post.id] && <p className="text-red-400 text-xs pl-8">{commentErrors[post.id]}</p>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
