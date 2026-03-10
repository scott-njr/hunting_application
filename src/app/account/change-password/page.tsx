'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { ArrowLeft, CheckCircle, KeyRound } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/home'), 2000)
  }

  return (
    <div className="min-h-screen bg-base text-primary">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <Link href="/account/profile" className="flex items-center gap-1.5 text-muted text-xs hover:text-secondary transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <KeyRound className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-primary">Change Password</h1>
        </div>

        {done ? (
          <div className="glass-card border border-subtle rounded-lg p-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <h2 className="text-primary font-semibold mb-1">Password updated</h2>
            <p className="text-secondary text-sm">Redirecting to your command center...</p>
          </div>
        ) : (
          <div className="glass-card border border-subtle rounded-lg p-6">
            <p className="text-muted text-sm mb-6">Enter a new password for your account. Must be at least 8 characters.</p>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

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
                className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded transition-colors"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
