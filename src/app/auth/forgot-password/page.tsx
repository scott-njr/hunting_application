'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'

const MAX_ATTEMPTS = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const STORAGE_KEY = 'scout_pw_reset_attempts'

function getAttempts(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr: number[] = JSON.parse(raw)
    const cutoff = Date.now() - WINDOW_MS
    return arr.filter(t => t > cutoff)
  } catch { return [] }
}

function recordAttempt() {
  const attempts = [...getAttempts(), Date.now()]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts))
}

function earliestResetMs(attempts: number[]): number {
  if (attempts.length < MAX_ATTEMPTS) return 0
  // oldest attempt + 1 hour = when the window slides open
  return attempts[0] + WINDOW_MS - Date.now()
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<number[]>(() => getAttempts())
  const [countdown, setCountdown] = useState(() => earliestResetMs(getAttempts()))

  const refreshAttempts = useCallback(() => {
    const a = getAttempts()
    setAttempts(a)
    setCountdown(earliestResetMs(a))
  }, [])

  // Tick countdown every second while rate-limited
  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1000
        if (next <= 0) {
          refreshAttempts()
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [countdown, refreshAttempts])

  const isRateLimited = attempts.length >= MAX_ATTEMPTS && countdown > 0
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts.length)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isRateLimited) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirectTo=/auth/reset-password`,
    })

    recordAttempt()
    refreshAttempts()

    if (error) {
      // Surface rate limit errors clearly
      if (error.message.toLowerCase().includes('rate') || error.status === 429) {
        setError('Email rate limit reached. Please wait before trying again.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-dvh bg-base flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="hover:opacity-80 transition-opacity mb-8 inline-block">
            <PraeviusWordmark />
          </Link>
          <div className="glass-card rounded-lg p-8">
            <div className="text-3xl mb-3">✓</div>
            <h2 className="text-primary font-semibold text-lg mb-2">Check your email</h2>
            <p className="text-secondary text-sm">
              We sent a reset link to <span className="text-primary">{email}</span>.
              Click it to set a new password.
            </p>
            <p className="text-muted text-xs mt-3">Check your spam folder if it doesn&apos;t arrive.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
            <PraeviusWordmark />
          </Link>
          <p className="text-secondary text-sm mt-1">Lead the Wild</p>
        </div>

        <div className="glass-card rounded-lg p-8">
          <h1 className="text-xl font-semibold text-primary mb-1">Reset your password</h1>
          <p className="text-muted text-sm mb-6">We&apos;ll send a reset link to your email.</p>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {isRateLimited ? (
            <div className="p-4 rounded bg-amber-950/30 border border-amber-500/30 text-center">
              <p className="text-amber-400 font-semibold text-sm mb-1">Too many attempts</p>
              <p className="text-secondary text-xs mb-3">
                You&apos;ve sent {MAX_ATTEMPTS} reset emails in the last hour. Please wait before trying again.
              </p>
              <div className="text-3xl font-mono font-bold text-amber-300 tabular-nums">
                {fmtCountdown(countdown)}
              </div>
              <p className="text-muted text-xs mt-2">until you can request another link</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-secondary text-sm mb-1.5" htmlFor="email">Email</label>
                <input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full input-field"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed
                           font-semibold rounded transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              {attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
                <p className="text-muted text-xs text-center">
                  {attemptsLeft} reset email{attemptsLeft !== 1 ? 's' : ''} remaining this hour
                </p>
              )}
            </form>
          )}

          <p className="text-muted text-sm text-center mt-6">
            <Link href="/auth/login" className="text-accent-hover hover:text-accent-hover">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
