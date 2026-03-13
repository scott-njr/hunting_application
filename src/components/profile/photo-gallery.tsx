'use client'

import { useState, useRef } from 'react'
import { Plus, X, Loader2, ImageIcon } from 'lucide-react'

const MAX_PHOTOS = 6

export function PhotoGallery({
  photos,
  onUpdated,
}: {
  photos: string[]
  onUpdated: (urls: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/profile/photos', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return }
      onUpdated(data.photo_urls)
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(url: string) {
    try {
      const res = await fetch('/api/profile/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (res.ok) onUpdated(data.photo_urls)
    } catch { /* silent */ }
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded overflow-hidden group border border-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(url)}
              className="absolute top-1 right-1 bg-black/70 rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded border border-dashed border-default hover:border-accent flex items-center justify-center transition-colors bg-elevated"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-muted animate-spin" />
            ) : (
              <Plus className="h-5 w-5 text-muted" />
            )}
          </button>
        )}
      </div>
      {photos.length === 0 && !uploading && (
        <div className="flex items-center gap-2 mt-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-muted" />
          <p className="text-muted text-xs">Add up to {MAX_PHOTOS} photos to your profile</p>
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
