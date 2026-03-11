'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { safeRedirect } from '@/lib/safe-redirect'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirectTo'))
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Full navigation ensures middleware sees the fresh session cookies
    window.location.href = redirectTo
  }

  return (
    <div className="glass-card rounded-lg p-5 sm:p-8">
      <h1 className="text-xl font-semibold text-primary mb-6">Sign in to your account</h1>

      {(error || urlError) && (
        <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
          {error ?? 'Authentication failed. Please try again.'}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-secondary text-sm mb-1.5" htmlFor="email">Email</label>
          <input
            id="email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full input-field"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-secondary text-sm mb-1.5" htmlFor="password">Password</label>
          <input
            id="password" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full input-field"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed
                     font-semibold rounded transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center justify-between mt-6 text-sm">
        <Link href="/auth/forgot-password" className="text-muted hover:text-secondary">
          Forgot password?
        </Link>
        <Link href={`/auth/signup${redirectTo !== '/home' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="text-accent hover:text-accent-hover">
          Create free account
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
            <PraeviusWordmark />
          </Link>
          <p className="text-secondary text-sm mt-1">Lead the Wild</p>
        </div>
        <Suspense fallback={<div className="glass-card rounded-lg p-5 sm:p-8 text-secondary text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
