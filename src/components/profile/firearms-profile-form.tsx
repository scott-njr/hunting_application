'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { US_STATES } from '@/components/profile/profile-constants'
import { SectionHeader } from '@/components/profile/profile-ui'
import { AlertBanner } from '@/components/ui/alert-banner'

type FirearmsForm = {
  dominant_hand: string
}

type IdentitySummary = {
  display_name: string
  first_name: string
  last_name: string
  state: string
  email: string
}

const EMPTY: FirearmsForm = {
  dominant_hand: '',
}

const HAND_OPTIONS = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
]

export default function FirearmsProfileForm() {
  const router = useRouter()
  const [form, setForm] = useState<FirearmsForm>(EMPTY)
  const [identity, setIdentity] = useState<IdentitySummary>({ display_name: '', first_name: '', last_name: '', state: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ data: userProf }, { data: firearmsProf }] = await Promise.all([
      supabase.from('user_profile').select('display_name, first_name, last_name, state').eq('id', user.id).maybeSingle(),
      supabase.from('firearms_profile').select('*').eq('id', user.id).maybeSingle(),
    ])

    if (userProf) {
      setIdentity({
        display_name: userProf.display_name ?? '',
        first_name: userProf.first_name ?? '',
        last_name: userProf.last_name ?? '',
        state: userProf.state ?? '',
        email: user.email ?? '',
      })
    } else {
      setIdentity(prev => ({ ...prev, email: user.email ?? '' }))
    }

    if (firearmsProf) {
      setForm({
        dominant_hand: firearmsProf.dominant_hand ?? '',
      })
    }
    setLoading(false)
  }, [router])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadProfile is an async data fetcher
  useEffect(() => { void loadProfile() }, [loadProfile])

  function updateForm(updater: (prev: FirearmsForm) => FirearmsForm) {
    setDirty(true)
    setForm(updater)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: firearmsErr } = await supabase.from('firearms_profile').upsert({
      id: user.id,
      dominant_hand: (form.dominant_hand || null) as 'left' | 'right' | null,
    }, { onConflict: 'id' })

    if (firearmsErr) { setError(firearmsErr.message) } else { setSaved(true); setDirty(false); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  if (loading) return <div className="text-muted text-sm py-12 text-center">Loading your profile...</div>

  return (
    <form onSubmit={handleSave} onChangeCapture={() => setDirty(true)}>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-primary">Firearms Profile</h1>
        {(dirty || saving || saved) && (
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded px-5 py-1.5 text-sm transition-colors flex items-center gap-2">
            {saving ? 'Saving...' : saved ? <><CheckCircle className="h-4 w-4" /> Saved</> : 'Save Profile'}
          </button>
        )}
      </div>

      {error && <AlertBanner variant="error" message={error} className="mb-2 p-2" />}

      {/* Identity Summary (read-only) */}
      <div className="glass-card border border-subtle rounded-lg p-3 space-y-2 mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-primary font-semibold text-sm">Identity</h2>
          <Link href="/account/profile" className="flex items-center gap-1.5 text-accent text-xs hover:text-accent-hover transition-colors">
            <ExternalLink className="h-3 w-3" /> Edit Main Profile
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2">
          {(identity.first_name || identity.last_name) && <div><span className="text-muted text-xs block">Name</span><span className="text-primary text-sm">{[identity.first_name, identity.last_name].filter(Boolean).join(' ')}</span></div>}
          {identity.display_name && <div><span className="text-muted text-xs block">Display Name</span><span className="text-primary text-sm">{identity.display_name}</span></div>}
          {identity.state && <div><span className="text-muted text-xs block">State</span><span className="text-primary text-sm">{US_STATES.find(s => s.value === identity.state)?.label ?? identity.state}</span></div>}
          {identity.email && <div><span className="text-muted text-xs block">Email</span><span className="text-primary text-sm">{identity.email}</span></div>}
        </div>
      </div>

      {/* Firearms Settings */}
      <SectionHeader label="Firearms Profile" />

      <div className="glass-card border border-subtle rounded-lg p-3 space-y-3 mb-2">
        <h2 className="text-primary font-semibold text-sm">Shooting Preferences</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-muted text-xs mb-0.5">Dominant Hand</label>
            <TacticalSelect
              value={form.dominant_hand}
              onChange={v => updateForm(p => ({ ...p, dominant_hand: v }))}
              options={HAND_OPTIONS}
              placeholder="— Select —"
            />
          </div>
        </div>
        <p className="text-muted text-xs">Used for AI target analysis to identify push/pull shot patterns.</p>
      </div>
    </form>
  )
}
