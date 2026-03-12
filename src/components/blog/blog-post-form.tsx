'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BlogEditor } from '@/components/blog/blog-editor'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { generateSlug, BLOG_CATEGORY_OPTIONS, BLOG_STATUS_OPTIONS } from '@/lib/blog-utils'
import { X, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type BlogPostRow = Database['public']['Tables']['blog_post']['Row']

interface BlogPostFormProps {
  initialData?: BlogPostRow
}

export function BlogPostForm({ initialData }: BlogPostFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [slugManual, setSlugManual] = useState(false)
  const [category, setCategory] = useState(initialData?.category ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_image_url ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [status, setStatus] = useState(initialData?.status ?? 'draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)

  // Auto-generate slug from title (unless manually edited)
  useEffect(() => {
    if (!slugManual && !isEdit) {
      setSlug(generateSlug(title))
    }
  }, [title, slugManual, isEdit])

  const handleCoverUpload = useCallback(async (file: File) => {
    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Cover upload failed')
        return
      }
      const { url } = await res.json()
      setCoverUrl(url)
    } catch {
      setError('Cover image upload failed')
    } finally {
      setUploadingCover(false)
    }
  }, [])

  const handleSave = async (publishOverride?: boolean) => {
    setError('')

    if (!title.trim()) { setError('Title is required'); return }
    if (!slug.trim()) { setError('Slug is required'); return }
    if (!category) { setError('Category is required'); return }

    const finalStatus = publishOverride ? 'published' : status

    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        excerpt: excerpt.trim() || null,
        cover_image_url: coverUrl || null,
        category,
        status: finalStatus,
      }

      const url = isEdit ? `/api/admin/blog/${initialData.id}` : '/api/admin/blog'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Failed to save')
        return
      }

      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full px-3 py-2 rounded bg-elevated border border-default text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
          Slug
        </label>
        <input
          type="text"
          value={slug}
          onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
          placeholder="url-friendly-slug"
          className="w-full px-3 py-2 rounded bg-elevated border border-default text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono"
        />
        <p className="text-muted text-xs mt-1">URL: /blog/{slug || '...'}</p>
      </div>

      {/* Category + Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
            Category
          </label>
          <TacticalSelect
            value={category}
            onChange={setCategory}
            options={BLOG_CATEGORY_OPTIONS}
            placeholder="Select category"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
            Status
          </label>
          <TacticalSelect
            value={status}
            onChange={(v) => setStatus(v as 'draft' | 'published' | 'archived')}
            options={BLOG_STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
          Excerpt <span className="text-muted font-normal normal-case">(optional, max 300 chars)</span>
        </label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="A brief summary of the post..."
          className="w-full px-3 py-2 rounded bg-elevated border border-default text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
        />
        <p className="text-muted text-xs mt-1 text-right">{excerpt.length}/300</p>
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
          Cover Image <span className="text-muted font-normal normal-case">(optional)</span>
        </label>
        {coverUrl ? (
          <div className="relative inline-block">
            <img src={coverUrl} alt="Cover preview" className="h-32 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setCoverUrl('')}
              className="absolute -top-2 -right-2 p-1 bg-surface border border-default rounded-full text-muted hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded bg-elevated border border-default text-secondary text-sm hover:border-strong transition-colors',
              uploadingCover && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingCover ? 'Uploading...' : 'Upload cover image'}
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleCoverUpload(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Content editor */}
      <div>
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
          Content
        </label>
        <BlogEditor content={content} onChange={setContent} disabled={saving} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="btn-primary px-6 py-2 text-sm font-semibold rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Draft'}
        </button>
        {status !== 'published' && (
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2 text-sm font-semibold rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            Publish Now
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          className="px-6 py-2 text-sm font-semibold rounded-lg text-muted hover:text-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
