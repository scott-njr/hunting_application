'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'

function ResetPasswordForm() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Verify the user has a valid recovery session (established by /auth/callback)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!user || error) {
        setError('Invalid or expired reset link. Please request a new one.')
      }
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/home'), 2000)
  }

  if (checking) {
    return (
      <div className="glass-card rounded-lg p-5 sm:p-8 text-secondary text-sm text-center">
        Verifying reset link...
      </div>
    )
  }

  if (done) {
    return (
      <div className="glass-card rounded-lg p-5 sm:p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="text-primary font-semibold mb-1">Password updated</h2>
        <p className="text-secondary text-sm">Redirecting to your command center...</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-lg p-5 sm:p-8">
      <h1 className="text-xl font-semibold text-primary mb-1">Set a new password</h1>
      <p className="text-muted text-sm mb-6">Choose something you&apos;ll remember.</p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
          {error}
          {error.includes('expired') && (
            <span> <Link href="/auth/forgot-password" className="underline">Request a new link</Link>.</span>
          )}
        </div>
      )}

      {!error && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-secondary text-sm mb-1.5" htmlFor="password">New Password</label>
            <input
              id="password" type="password" autoComplete="new-password" required minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full input-field"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-secondary text-sm mb-1.5" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm" type="password" autoComplete="new-password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full input-field"
              placeholder="Repeat password"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed
                       font-semibold rounded transition-colors"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
            <PraeviusWordmark />
          </Link>
          <p className="text-secondary text-sm mt-1">Lead the Wild</p>
        </div>
        <Suspense fallback={<div className="glass-card rounded-lg p-5 sm:p-8 text-secondary text-sm text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
