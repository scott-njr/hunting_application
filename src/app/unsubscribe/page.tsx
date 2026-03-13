'use client'

import { Suspense, useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  release_notes: 'Release Notes',
  newsletter: 'Newsletter',
  blog: 'Blog',
  announcement: 'Announcements',
  all: 'All Emails',
}

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const category = searchParams.get('category') ?? ''
  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const categoryLabel = CATEGORY_LABELS[category] ?? category

  const handleUnsubscribe = useCallback(async (unsubCategory: string) => {
    setStatus('loading')
    setErrorMsg('')

    // For "all", we need the token for the "all" category
    // But the token was generated for the specific category, so we need a separate token for "all"
    // For simplicity, unsubscribe from the specific category using the provided token
    const targetCategory = unsubCategory === 'all' ? category : unsubCategory

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, category: targetCategory, token }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Something went wrong')
        setStatus('error')
        return
      }

      setStatus('done')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }, [email, category, token])

  if (!email || !category || !token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-primary mb-2">Invalid Link</h1>
        <p className="text-muted text-sm">This unsubscribe link appears to be invalid or incomplete.</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-primary mb-2">Unsubscribed</h1>
        <p className="text-secondary text-sm">
          You&apos;ve been unsubscribed from <strong>{categoryLabel}</strong> emails.
        </p>
        <p className="text-muted text-xs mt-4">
          This may take a few minutes to take effect.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h1 className="text-xl font-bold text-primary mb-2">Unsubscribe</h1>
      <p className="text-secondary text-sm mb-6">
        Unsubscribe <strong>{email}</strong> from <strong>{categoryLabel}</strong> emails?
      </p>

      {status === 'error' && (
        <p className="text-red-400 text-sm mb-4">{errorMsg}</p>
      )}

      <button
        onClick={() => handleUnsubscribe(category)}
        disabled={status === 'loading'}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
          'bg-accent text-white hover:bg-accent/90',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {status === 'loading' ? 'Processing...' : `Unsubscribe from ${categoryLabel}`}
      </button>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-subtle rounded-xl p-8">
        <Suspense fallback={
          <div className="text-center">
            <div className="h-6 w-32 bg-elevated rounded animate-pulse mx-auto mb-4" />
            <div className="h-4 w-48 bg-elevated rounded animate-pulse mx-auto" />
          </div>
        }>
          <UnsubscribeForm />
        </Suspense>

        <div className="mt-8 pt-4 border-t border-subtle text-center">
          <a href="/" className="text-accent text-xs hover:underline">
            Lead the Wild
          </a>
        </div>
      </div>
    </div>
  )
}
