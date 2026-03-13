'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { safeRedirect } from '@/lib/safe-redirect'
import { AlertBanner } from '@/components/ui/alert-banner'

function SignupForm() {
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirectTo'))

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is disabled, session is active immediately
    const supabase2 = createClient()
    const { data: { user: newUser } } = await supabase2.auth.getUser()
    if (newUser) {
      window.location.href = redirectTo
      return
    }

    // Email confirmation required — show check email screen
    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="glass-card rounded-lg p-5 sm:p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-primary text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-secondary text-sm">
          We sent a confirmation link to <span className="text-primary">{email}</span>.
          Click it to activate your account and log in.
        </p>
        <p className="text-muted text-xs mt-4">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <div className="mt-6 pt-4 border-t border-subtle flex justify-center gap-4 text-xs">
          <Link href="/auth/login" className="text-accent hover:text-accent-hover">Back to sign in</Link>
          <span className="text-muted">·</span>
          <Link href="/auth/signup" className="text-muted hover:text-secondary">Try again</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-lg p-5 sm:p-8">
      <h1 className="text-xl font-semibold text-primary mb-1">Create your free account</h1>
      <p className="text-muted text-sm mb-6">No credit card. No commitment.</p>

      {error && <AlertBanner variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-secondary text-sm mb-1.5" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full input-field"
            placeholder="John Smith"
          />
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full input-field"
            placeholder="Min. 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed
                     font-semibold rounded transition-colors"
        >
          {loading ? 'Creating account...' : 'Create Free Account'}
        </button>
      </form>

      <p className="text-muted text-sm text-center mt-6">
        Already have an account?{' '}
        <Link href={`/auth/login${redirectTo !== '/home' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
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
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
