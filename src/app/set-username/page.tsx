'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { Check, X, Loader2, AtSign } from 'lucide-react'

export default function SetUsernamePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced availability check
  useEffect(() => {
    queueMicrotask(() => setAvailable(null))
    if (username.length < 3) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        setAvailable(data.available ?? false)
      } catch {
        setAvailable(null)
      } finally {
        setChecking(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [username])

  async function handleSave() {
    if (!username || username.length < 3 || !available) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: upsertError } = await supabase
      .from('user_profile')
      .upsert({ id: user.id, user_name: username }, { onConflict: 'id' })

    if (upsertError) {
      if (upsertError.message.includes('user_name_unique') || upsertError.message.includes('duplicate')) {
        setError('That username was just taken. Try another.')
        setAvailable(false)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setSaving(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const isValid = username.length >= 3 && username.length <= 20
  const canSave = isValid && available === true && !saving

  return (
    <div className="min-h-dvh bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
            <PraeviusWordmark />
          </Link>
          <p className="text-secondary text-sm mt-2">Choose your username</p>
          <p className="text-muted text-xs mt-1">This is your unique handle that others will see</p>
        </div>

        <div className="glass-card rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-primary font-medium text-sm mb-2">
              Username <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <AtSign className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                className="w-full input-field text-sm pl-9 pr-10"
                placeholder="buckslayer42"
                maxLength={20}
                autoFocus
              />
              {/* Status indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="h-4 w-4 text-muted animate-spin" />}
                {!checking && available === true && <Check className="h-4 w-4 text-green-400" />}
                {!checking && available === false && isValid && <X className="h-4 w-4 text-red-400" />}
              </div>
            </div>
            {/* Validation messages */}
            {username.length > 0 && username.length < 3 && (
              <p className="text-amber-400 text-xs mt-1.5">Minimum 3 characters</p>
            )}
            {!checking && available === false && isValid && (
              <p className="text-red-400 text-xs mt-1.5">That username is already taken</p>
            )}
            {!checking && available === true && (
              <p className="text-green-400 text-xs mt-1.5">Available!</p>
            )}
            <p className="text-muted text-[10px] mt-2">
              Lowercase letters, numbers, and underscores only. 3-20 characters.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full btn-primary font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Set Username'}
          </button>
        </div>
      </div>
    </div>
  )
}
