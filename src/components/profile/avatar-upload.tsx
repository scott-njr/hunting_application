'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Loader2 } from 'lucide-react'

export function AvatarUpload({
  currentUrl,
  userId,
  onUploaded,
}: {
  currentUrl: string | null
  userId: string
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/pic', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to upload')
        return
      }

      onUploaded(data.avatar_url)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="group/avatar shrink-0">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        disabled={uploading}
        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-default hover:border-accent transition-colors group shrink-0"
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-elevated flex items-center justify-center">
            <Camera className="h-6 w-6 text-muted" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Upload className="h-5 w-5 text-white" />
          )}
        </div>
      </button>
      <p className="text-muted text-[10px] text-center mt-1 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
        {currentUrl ? 'Click to change' : 'Add photo'}
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {error && <p className="text-red-400 text-[10px] text-center mt-0.5">{error}</p>}
    </div>
  )
}
