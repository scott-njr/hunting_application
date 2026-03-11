'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultView: 'login' | 'signup'
  redirectTo: string
}

export function AuthModal({ isOpen, onClose, defaultView, redirectTo }: AuthModalProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [prevDefaultView, setPrevDefaultView] = useState(defaultView)
  const [view, setView] = useState<'login' | 'signup'>(defaultView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Reset state when modal opens or view changes
  if (isOpen !== prevIsOpen || defaultView !== prevDefaultView) {
    setPrevIsOpen(isOpen)
    setPrevDefaultView(defaultView)
    if (isOpen) {
      setView(defaultView)
      setEmail('')
      setPassword('')
      setFullName('')
      setError(null)
      setLoading(false)
      setEmailSent(false)
    }
  }

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

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

    window.location.href = redirectTo
  }

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

    setEmailSent(true)
    setLoading(false)
  }

  function switchView(newView: 'login' | 'signup') {
    setView(newView)
    setError(null)
    setEmail('')
    setPassword('')
    setFullName('')
    setEmailSent(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass-card rounded-lg p-8 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-secondary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {emailSent ? (
          /* Check email screen */
          <div className="text-center">
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
              <button onClick={() => switchView('login')} className="text-accent-hover hover:text-accent-hover">
                Back to sign in
              </button>
              <span className="text-muted">·</span>
              <button onClick={() => switchView('signup')} className="text-muted hover:text-secondary">
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab toggle */}
            <div className="flex gap-1 mb-6 bg-elevated rounded-lg p-1">
              <button
                onClick={() => switchView('login')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  view === 'login'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchView('signup')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  view === 'signup'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {view === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-secondary text-sm mb-1.5" htmlFor="modal-email">Email</label>
                  <input
                    id="modal-email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full input-field"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-secondary text-sm mb-1.5" htmlFor="modal-password">Password</label>
                  <input
                    id="modal-password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-field"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded transition-colors"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <div className="text-center">
                  <Link
                    href="/auth/forgot-password"
                    onClick={onClose}
                    className="text-muted hover:text-secondary text-sm"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <p className="text-muted text-sm -mt-2 mb-4">No credit card. No commitment.</p>
                <div>
                  <label className="block text-secondary text-sm mb-1.5" htmlFor="modal-fullname">Full Name</label>
                  <input
                    id="modal-fullname" type="text" autoComplete="name" required
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full input-field"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-secondary text-sm mb-1.5" htmlFor="modal-signup-email">Email</label>
                  <input
                    id="modal-signup-email" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full input-field"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-secondary text-sm mb-1.5" htmlFor="modal-signup-password">Password</label>
                  <input
                    id="modal-signup-password" type="password" autoComplete="new-password" required minLength={8}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-field"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded transition-colors"
                >
                  {loading ? 'Creating account...' : 'Create Free Account'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
