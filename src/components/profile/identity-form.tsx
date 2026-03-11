'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ShieldCheck } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { PhotoGallery } from '@/components/profile/photo-gallery'
import { US_STATES } from '@/components/profile/profile-constants'
import { INPUT_CLASS, Divider } from '@/components/profile/profile-ui'

type IdentityForm = {
  first_name: string
  last_name: string
  display_name: string
  user_name: string
  date_of_birth: string
  gender: 'male' | 'female' | ''
  email: string
  phone: string
  state: string
  city: string
  country: string
  avatar_url: string
  photo_urls: string[]
  social_facebook: string
  social_instagram: string
  social_x: string
}

const EMPTY: IdentityForm = {
  first_name: '',
  last_name: '',
  display_name: '',
  user_name: '',
  date_of_birth: '',
  gender: '',
  email: '',
  phone: '',
  state: '',
  city: '',
  country: '',
  avatar_url: '',
  photo_urls: [],
  social_facebook: '',
  social_instagram: '',
  social_x: '',
}

export default function IdentityForm() {
  const router = useRouter()
  const [form, setForm] = useState<IdentityForm>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState('')

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const { data: prof } = await supabase.from('user_profile').select('*').eq('id', user.id).maybeSingle()

    if (prof) {
      setForm({
        first_name: prof.first_name ?? '',
        last_name: prof.last_name ?? '',
        display_name: prof.display_name ?? '',
        user_name: prof.user_name ?? '',
        date_of_birth: prof.date_of_birth ?? '',
        gender: prof.gender ?? '',
        email: user.email ?? '',
        phone: prof.phone ?? '',
        state: prof.state ?? '',
        city: prof.city ?? '',
        country: prof.country ?? '',
        avatar_url: prof.avatar_url ?? '',
        photo_urls: prof.photo_urls ?? [],
        social_facebook: (prof.social_facebook ?? '').replace(/^https?:\/\/(www\.)?facebook\.com\/?/i, ''),
        social_instagram: (prof.social_instagram ?? '').replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, '').replace(/^@/, ''),
        social_x: (prof.social_x ?? '').replace(/^https?:\/\/(www\.)?(twitter|x)\.com\/?/i, '').replace(/^@/, ''),
      })
    } else {
      setForm(prev => ({ ...prev, email: user.email ?? '' }))
    }
    setLoading(false)
  }, [router])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadProfile is an async data fetcher
  useEffect(() => { void loadProfile() }, [loadProfile])

  function updateForm(updater: (prev: IdentityForm) => IdentityForm) {
    setDirty(true)
    setForm(updater)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: err } = await supabase.from('user_profile').upsert({
      id: user.id,
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      display_name: form.display_name || null,
      user_name: form.user_name || null,
      date_of_birth: form.date_of_birth || null,
      gender: (form.gender || null) as 'male' | 'female' | null,
      phone: form.phone || null,
      state: form.state || null,
      city: form.city || null,
      country: form.country || null,
      social_facebook: form.social_facebook ? `https://facebook.com/${form.social_facebook}` : null,
      social_instagram: form.social_instagram ? `https://instagram.com/${form.social_instagram}` : null,
      social_x: form.social_x ? `https://x.com/${form.social_x}` : null,
    }, { onConflict: 'id' })

    if (err) { setError(err.message) } else { setSaved(true); setDirty(false); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  if (loading) return <div className="text-muted text-sm py-12 text-center">Loading your profile...</div>

  return (
    <form onSubmit={handleSave} onChangeCapture={() => setDirty(true)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          {userId && <AvatarUpload currentUrl={form.avatar_url || null} userId={userId} onUploaded={(url) => updateForm(p => ({ ...p, avatar_url: url }))} />}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-primary">My Profile</h1>
            {form.avatar_url && (
              <div className="flex items-center gap-1.5 text-accent-hover text-xs font-medium bg-accent-dim px-2.5 py-1 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </div>
            )}
          </div>
        </div>
        {(dirty || saving || saved) && (
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded px-5 py-1.5 text-sm transition-colors flex items-center gap-2">
            {saving ? 'Saving...' : saved ? <><CheckCircle className="h-4 w-4" /> Saved</> : 'Save Profile'}
          </button>
        )}
      </div>

      {error && <div className="mb-2 p-2 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="glass-card border border-subtle rounded-lg p-3 space-y-2.5 mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-primary font-semibold text-sm">Identity</h2>
          {!form.avatar_url && <span className="text-muted text-xs">Add a photo to get verified</span>}
        </div>

        {userId && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-muted text-xs mb-0.5">First Name</label>
                <input type="text" value={form.first_name} onChange={e => updateForm(p => ({ ...p, first_name: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="John" />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Last Name</label>
                <input type="text" value={form.last_name} onChange={e => updateForm(p => ({ ...p, last_name: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="Doe" />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Display Name</label>
                <input type="text" value={form.display_name} onChange={e => updateForm(p => ({ ...p, display_name: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="Buck Slayer" />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">@</span>
                  <input
                    type="text"
                    value={form.user_name}
                    onChange={e => updateForm(p => ({ ...p, user_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) }))}
                    className={`${INPUT_CLASS} w-full pl-7`}
                    placeholder="buckslayer42"
                    maxLength={20}
                  />
                </div>
                {form.user_name && form.user_name.length < 3 && (
                  <p className="text-amber-400 text-[10px] mt-0.5">Min 3 characters</p>
                )}
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => updateForm(p => ({ ...p, phone: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Email</label>
                <input type="email" value={form.email} readOnly className={`${INPUT_CLASS} w-full opacity-60 cursor-not-allowed`} />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Gender</label>
                <TacticalSelect value={form.gender} onChange={v => updateForm(p => ({ ...p, gender: v as 'male' | 'female' | '' }))} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} placeholder="— Select —" />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={e => updateForm(p => ({ ...p, date_of_birth: e.target.value }))} className={`${INPUT_CLASS} w-full`} />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">City</label>
                <input type="text" value={form.city} onChange={e => updateForm(p => ({ ...p, city: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="Denver" />
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">State</label>
                <TacticalSelect value={form.state} onChange={v => updateForm(p => ({ ...p, state: v }))} options={US_STATES.map(s => ({ value: s.value, label: `${s.value} — ${s.label}` }))} placeholder="— Select —" />
              </div>
            </div>

            <Divider label="Social" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-muted text-xs mb-0.5">Facebook</label>
                <div className="flex items-center">
                  <span className="bg-surface border border-default border-r-0 rounded-l px-1.5 py-1.5 text-muted text-xs select-none shrink-0">fb/</span>
                  <input type="text" value={form.social_facebook} onChange={e => updateForm(p => ({ ...p, social_facebook: e.target.value.replace(/^(https?:\/\/)?(www\.)?facebook\.com\/?/i, '') }))} className={`${INPUT_CLASS} w-full rounded-l-none`} placeholder="username" />
                </div>
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">Instagram</label>
                <div className="flex items-center">
                  <span className="bg-surface border border-default border-r-0 rounded-l px-1.5 py-1.5 text-muted text-xs select-none shrink-0">@</span>
                  <input type="text" value={form.social_instagram} onChange={e => updateForm(p => ({ ...p, social_instagram: e.target.value.replace(/^(https?:\/\/)?(www\.)?instagram\.com\/?/i, '').replace(/^@/, '') }))} className={`${INPUT_CLASS} w-full rounded-l-none`} placeholder="handle" />
                </div>
              </div>
              <div>
                <label className="block text-muted text-xs mb-0.5">X (Twitter)</label>
                <div className="flex items-center">
                  <span className="bg-surface border border-default border-r-0 rounded-l px-1.5 py-1.5 text-muted text-xs select-none shrink-0">@</span>
                  <input type="text" value={form.social_x} onChange={e => updateForm(p => ({ ...p, social_x: e.target.value.replace(/^(https?:\/\/)?(www\.)?(twitter|x)\.com\/?/i, '').replace(/^@/, '') }))} className={`${INPUT_CLASS} w-full rounded-l-none`} placeholder="handle" />
                </div>
              </div>
            </div>

            <Divider label="Photos" />
            <PhotoGallery photos={form.photo_urls} onUpdated={(urls) => updateForm(p => ({ ...p, photo_urls: urls }))} />
          </div>
        )}
      </div>
    </form>
  )
}
