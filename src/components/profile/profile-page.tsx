'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ChevronDown, ChevronUp, Trash2, Plus, AlertTriangle, Pencil, X, ShieldCheck, ExternalLink } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { PhotoGallery } from '@/components/profile/photo-gallery'

// ─── Data ────────────────────────────────────────────────────────────────────

const SEASONS = [
  { value: 'archery', label: 'Archery' },
  { value: 'rifle', label: 'Rifle' },
  { value: 'muzzleloader', label: 'Muzzleloader' },
  { value: 'shotgun', label: 'Shotgun / Slug' },
]

const SPECIES = [
  { value: 'elk', label: 'Elk' },
  { value: 'mule_deer', label: 'Mule Deer' },
  { value: 'whitetail', label: 'Whitetail' },
  { value: 'pronghorn', label: 'Pronghorn' },
  { value: 'black_bear', label: 'Black Bear' },
  { value: 'mountain_lion', label: 'Mountain Lion' },
  { value: 'bighorn_sheep', label: 'Bighorn Sheep' },
  { value: 'mountain_goat', label: 'Mountain Goat' },
  { value: 'moose', label: 'Moose' },
  { value: 'bison', label: 'Bison' },
  { value: 'turkey', label: 'Turkey' },
  { value: 'waterfowl', label: 'Waterfowl' },
  { value: 'upland', label: 'Upland Birds' },
  { value: 'small_game', label: 'Small Game' },
]

const US_STATES = [
  { value: 'AK', label: 'Alaska' }, { value: 'AL', label: 'Alabama' },
  { value: 'AR', label: 'Arkansas' }, { value: 'AZ', label: 'Arizona' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'IA', label: 'Iowa' },
  { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MD', label: 'Maryland' },
  { value: 'ME', label: 'Maine' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MO', label: 'Missouri' },
  { value: 'MS', label: 'Mississippi' }, { value: 'MT', label: 'Montana' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' },
  { value: 'NV', label: 'Nevada' }, { value: 'NY', label: 'New York' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VA', label: 'Virginia' }, { value: 'VT', label: 'Vermont' },
  { value: 'WA', label: 'Washington' }, { value: 'WI', label: 'Wisconsin' },
  { value: 'WV', label: 'West Virginia' }, { value: 'WY', label: 'Wyoming' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileForm = {
  display_name: string
  date_of_birth: string
  gender: 'male' | 'female' | ''
  email: string
  phone: string
  residency_state: string
  hunter_ed_number: string
  sat_device_type: 'inreach' | 'spot' | 'none' | ''
  sat_device_id: string
  weapon_types: string[]
  target_species: string[]
  states_of_interest: string[]
  hunt_styles: string[]
  experience_level: string
  physical_condition: string
  years_hunting: string
  looking_for_buddy: boolean
  willing_to_mentor: boolean
  buddy_bio: string
  avatar_url: string
  photo_urls: string[]
  social_facebook: string
  social_instagram: string
  social_x: string
  height_feet: string
  height_inches: string
  weight_lbs: string
  bench_press_lbs: string
  squat_lbs: string
  deadlift_lbs: string
  overhead_press_lbs: string
}

type PointsRow = {
  id?: string
  state: string
  state_name: string
  species: string
  season: string
  points: number
  point_type: 'preference' | 'bonus'
  created_at?: string
  updated_at?: string
  dirty?: boolean
  isNew?: boolean
}

const EMPTY: ProfileForm = {
  display_name: '',
  date_of_birth: '',
  gender: '',
  email: '',
  phone: '',
  residency_state: '',
  hunter_ed_number: '',
  sat_device_type: '',
  sat_device_id: '',
  weapon_types: [],
  target_species: [],
  states_of_interest: [],
  hunt_styles: [],
  experience_level: '',
  physical_condition: '',
  years_hunting: '',
  looking_for_buddy: false,
  willing_to_mentor: false,
  buddy_bio: '',
  avatar_url: '',
  photo_urls: [],
  social_facebook: '',
  social_instagram: '',
  social_x: '',
  height_feet: '',
  height_inches: '',
  weight_lbs: '',
  bench_press_lbs: '',
  squat_lbs: '',
  deadlift_lbs: '',
  overhead_press_lbs: '',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chip({ value, label, selected, onToggle }: { value: string; label: string; selected: boolean; onToggle: (v: string) => void }) {
  return (
    <button type="button" onClick={() => onToggle(value)}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
        selected
          ? 'bg-green-600/20 border-accent text-accent-hover'
          : 'bg-elevated border-default text-secondary hover:border-strong hover:text-primary'
      }`}>
      {label}
    </button>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-subtle" />
      <span className="text-muted text-xs uppercase tracking-wider">{label}</span>
      <div className="h-px flex-1 bg-subtle" />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfilePage({ moduleSlug }: { moduleSlug?: string } = {}) {
  const isModuleView = !!moduleSlug
  const showHunting = !isModuleView || moduleSlug === 'hunting'
  const showFitness = !isModuleView || moduleSlug === 'fitness'
  const showPoints = !isModuleView || moduleSlug === 'hunting'
  const router = useRouter()
  const [form, setForm] = useState<ProfileForm>(EMPTY)
  const [points, setPoints] = useState<PointsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllStates, setShowAllStates] = useState(false)
  const [editingPointIdx, setEditingPointIdx] = useState<number | null>(null)
  const [savingPointIdx, setSavingPointIdx] = useState<number | null>(null)
  const [userId, setUserId] = useState<string>('')

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const [{ data: profile }, { data: pts }] = await Promise.all([
      supabase.from('hunter_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('hunter_points').select('*').eq('user_id', user.id).order('state'),
    ])

    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        date_of_birth: profile.date_of_birth ?? '',
        gender: profile.gender ?? '',
        email: user.email ?? '',
        phone: profile.phone ?? '',
        residency_state: profile.residency_state ?? '',
        hunter_ed_number: profile.hunter_ed_number ?? '',
        sat_device_type: profile.sat_device_type ?? '',
        sat_device_id: profile.sat_device_id ?? '',
        weapon_types: (profile.weapon_types ?? []).map((v: string) =>
          v.startsWith('archery') ? 'archery' : v
        ).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
        target_species: profile.target_species ?? [],
        states_of_interest: profile.states_of_interest ?? [],
        hunt_styles: profile.hunt_styles ?? [],
        experience_level: profile.experience_level ?? '',
        physical_condition: profile.physical_condition ?? '',
        years_hunting: profile.years_hunting?.toString() ?? '',
        looking_for_buddy: profile.looking_for_buddy ?? false,
        willing_to_mentor: profile.willing_to_mentor ?? false,
        buddy_bio: profile.buddy_bio ?? '',
        avatar_url: profile.avatar_url ?? '',
        photo_urls: profile.photo_urls ?? [],
        social_facebook: (profile.social_facebook ?? '').replace(/^https?:\/\/(www\.)?facebook\.com\/?/i, ''),
        social_instagram: (profile.social_instagram ?? '').replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, '').replace(/^@/, ''),
        social_x: (profile.social_x ?? '').replace(/^https?:\/\/(www\.)?(twitter|x)\.com\/?/i, '').replace(/^@/, ''),
        height_feet: profile.height_inches ? Math.floor(profile.height_inches / 12).toString() : '',
        height_inches: profile.height_inches ? (profile.height_inches % 12).toString() : '',
        weight_lbs: profile.weight_lbs?.toString() ?? '',
        bench_press_lbs: profile.bench_press_lbs?.toString() ?? '',
        squat_lbs: profile.squat_lbs?.toString() ?? '',
        deadlift_lbs: profile.deadlift_lbs?.toString() ?? '',
        overhead_press_lbs: profile.overhead_press_lbs?.toString() ?? '',
      })
    }
    if (!profile) {
      setForm(prev => ({ ...prev, email: user.email ?? '' }))
    }
    if (pts) setPoints(pts)
    setLoading(false)
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function updateForm(updater: (prev: ProfileForm) => ProfileForm) {
    setDirty(true)
    setForm(updater)
  }

  function toggle(field: keyof ProfileForm, value: string) {
    setDirty(true)
    setForm(prev => {
      const arr = prev[field] as string[]
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: err } = await supabase.from('hunter_profiles').upsert({
      id: user.id,
      display_name: form.display_name || null,
      date_of_birth: form.date_of_birth || null,
      gender: (form.gender || null) as 'male' | 'female' | null,
      phone: form.phone || null,
      residency_state: form.residency_state || null,
      hunter_ed_number: form.hunter_ed_number || null,
      sat_device_type: (form.sat_device_type || null) as 'inreach' | 'spot' | 'none' | null,
      sat_device_id: form.sat_device_id || null,
      weapon_types: form.weapon_types,
      target_species: form.target_species,
      states_of_interest: form.states_of_interest,
      hunt_styles: form.hunt_styles,
      training_interests: [],
      experience_level: (form.experience_level || null) as 'beginner' | 'intermediate' | 'experienced' | 'expert' | null,
      physical_condition: (form.physical_condition || null) as 'light' | 'moderate' | 'strenuous' | 'extreme' | null,
      years_hunting: form.years_hunting ? parseInt(form.years_hunting) : null,
      looking_for_buddy: form.looking_for_buddy,
      willing_to_mentor: form.willing_to_mentor,
      buddy_bio: form.buddy_bio || null,
      social_facebook: form.social_facebook ? `https://facebook.com/${form.social_facebook}` : null,
      social_instagram: form.social_instagram ? `https://instagram.com/${form.social_instagram}` : null,
      social_x: form.social_x ? `https://x.com/${form.social_x}` : null,
      height_inches: form.height_feet || form.height_inches ? (parseInt(form.height_feet || '0') * 12) + parseInt(form.height_inches || '0') : null,
      weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
      bench_press_lbs: form.bench_press_lbs ? parseInt(form.bench_press_lbs) : null,
      squat_lbs: form.squat_lbs ? parseInt(form.squat_lbs) : null,
      deadlift_lbs: form.deadlift_lbs ? parseInt(form.deadlift_lbs) : null,
      overhead_press_lbs: form.overhead_press_lbs ? parseInt(form.overhead_press_lbs) : null,
      profile_completed_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (err) { setError(err.message) } else { setSaved(true); setDirty(false); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  function addPointsRow() {
    const newIdx = points.length
    setPoints(prev => [...prev, {
      state: '', state_name: '', species: '', season: 'general',
      points: 0, point_type: 'preference', isNew: true, dirty: true,
    }])
    setEditingPointIdx(newIdx)
  }

  function updatePointsRow(idx: number, field: keyof PointsRow, value: string | number) {
    setPoints(prev => prev.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, [field]: value, dirty: true }
      if (field === 'state') {
        updated.state_name = US_STATES.find(s => s.value === value)?.label ?? ''
      }
      return updated
    }))
  }

  async function deletePointsRow(idx: number) {
    const row = points[idx]
    if (row.id) {
      const supabase = createClient()
      await supabase.from('hunter_points').delete().eq('id', row.id)
    }
    setPoints(prev => prev.filter((_, i) => i !== idx))
    if (editingPointIdx === idx) setEditingPointIdx(null)
  }

  async function saveOnePointRow(idx: number) {
    const row = points[idx]
    if (!row.state || !row.species) return
    setSavingPointIdx(idx)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingPointIdx(null); return }

    if (row.id) {
      await supabase.from('hunter_points').update({
        state: row.state, state_name: row.state_name, species: row.species,
        season: row.season || 'general', points: row.points,
        point_type: row.point_type, updated_at: new Date().toISOString(),
      }).eq('id', row.id)
    } else {
      await supabase.from('hunter_points').upsert({
        user_id: user.id, state: row.state, state_name: row.state_name,
        species: row.species, season: row.season || 'general',
        points: row.points, point_type: row.point_type,
      }, { onConflict: 'user_id,state,species,season' })
    }
    const { data: fresh } = await supabase.from('hunter_points').select('*').eq('user_id', user.id).order('state')
    if (fresh) setPoints(fresh)
    setSavingPointIdx(null)
    setEditingPointIdx(null)
    router.refresh()
  }

  function cancelEditPointRow(idx: number) {
    const row = points[idx]
    if (row.isNew) {
      setPoints(prev => prev.filter((_, i) => i !== idx))
    }
    setEditingPointIdx(null)
  }

  const inputClass = "bg-elevated border border-default text-primary rounded px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-ring placeholder:text-muted"

  function fmtDate(iso: string | undefined) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const SEASON_OPTS = [
    { value: 'general', label: 'General' },
    { value: 'archery', label: 'Archery' },
    { value: 'rifle', label: 'Rifle' },
    { value: 'muzzleloader', label: 'Muzzleloader' },
    { value: 'shotgun', label: 'Shotgun' },
  ]

  const co2028Warning = points.some(r =>
    r.state === 'CO' && ['elk', 'mule_deer', 'whitetail', 'pronghorn'].includes(r.species) && r.points >= 5
  )

  if (loading) return <div className="text-muted text-sm py-12 text-center">Loading your profile...</div>

  return (
    <form onSubmit={handleSave} onChangeCapture={() => setDirty(true)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          {userId && <AvatarUpload currentUrl={form.avatar_url || null} userId={userId} onUploaded={(url) => updateForm(p => ({ ...p, avatar_url: url }))} />}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-primary">{isModuleView ? `${moduleSlug!.charAt(0).toUpperCase() + moduleSlug!.slice(1)} Profile` : 'My Profile'}</h1>
            {form.avatar_url && form.hunter_ed_number && (
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
          {isModuleView ? (
            <Link href="/account/profile" className="flex items-center gap-1.5 text-accent text-xs hover:text-accent-hover transition-colors">
              <ExternalLink className="h-3 w-3" /> Edit Main Profile
            </Link>
          ) : !form.avatar_url || !form.hunter_ed_number ? (
            <span className="text-muted text-xs">
              {!form.avatar_url && !form.hunter_ed_number ? 'Add photo + Hunter Ed to get verified' : !form.avatar_url ? 'Add a photo to get verified' : 'Add Hunter Ed to get verified'}
            </span>
          ) : null}
        </div>

        {isModuleView ? (
          /* Read-only identity summary for module views */
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2">
              {form.display_name && <div><span className="text-muted text-xs block">Display Name</span><span className="text-primary text-sm">{form.display_name}</span></div>}
              {form.residency_state && <div><span className="text-muted text-xs block">State</span><span className="text-primary text-sm">{US_STATES.find(s => s.value === form.residency_state)?.label ?? form.residency_state}</span></div>}
              {form.date_of_birth && <div><span className="text-muted text-xs block">Date of Birth</span><span className="text-primary text-sm">{fmtDate(form.date_of_birth) ?? form.date_of_birth}</span></div>}
              {form.phone && <div><span className="text-muted text-xs block">Phone</span><span className="text-primary text-sm">{form.phone}</span></div>}
              {form.email && <div><span className="text-muted text-xs block">Email</span><span className="text-primary text-sm">{form.email}</span></div>}
              {form.physical_condition && <div><span className="text-muted text-xs block">Fitness</span><span className="text-primary text-sm capitalize">{form.physical_condition}</span></div>}
              {form.hunter_ed_number && <div><span className="text-muted text-xs block">Hunter Ed #</span><span className="text-primary text-sm">{form.hunter_ed_number}</span></div>}
            </div>
            {(form.social_facebook || form.social_instagram || form.social_x) && (
              <div className="flex gap-4 text-xs text-secondary">
                {form.social_facebook && <span>fb/{form.social_facebook}</span>}
                {form.social_instagram && <span>@{form.social_instagram}</span>}
                {form.social_x && <span>@{form.social_x}</span>}
              </div>
            )}
            {form.photo_urls.length > 0 && (
              <>
                <Divider label="Photos" />
                <div className="flex gap-2 flex-wrap">
                  {form.photo_urls.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-16 h-16 rounded object-cover border border-subtle" />
                  ))}
                  {form.photo_urls.length > 4 && <span className="text-muted text-xs self-end">+{form.photo_urls.length - 4} more</span>}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Editable identity for full profile view */
          <>
            {userId && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Display Name</label>
                    <input type="text" value={form.display_name} onChange={e => updateForm(p => ({ ...p, display_name: e.target.value }))} className={`${inputClass} w-full`} placeholder="Buck Slayer" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">State</label>
                    <TacticalSelect value={form.residency_state} onChange={v => updateForm(p => ({ ...p, residency_state: v }))} options={US_STATES.map(s => ({ value: s.value, label: `${s.value} — ${s.label}` }))} placeholder="— Select —" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Date of Birth</label>
                    <input type="date" value={form.date_of_birth} onChange={e => updateForm(p => ({ ...p, date_of_birth: e.target.value }))} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Gender</label>
                    <TacticalSelect value={form.gender} onChange={v => updateForm(p => ({ ...p, gender: v as 'male' | 'female' | '' }))} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} placeholder="— Select —" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => updateForm(p => ({ ...p, phone: e.target.value }))} className={`${inputClass} w-full`} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Email</label>
                    <input type="email" value={form.email} readOnly className={`${inputClass} w-full opacity-60 cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Fitness</label>
                    <TacticalSelect value={form.physical_condition} onChange={v => updateForm(p => ({ ...p, physical_condition: v }))} options={[{ value: 'light', label: 'Light' }, { value: 'moderate', label: 'Moderate' }, { value: 'strenuous', label: 'Strenuous' }, { value: 'extreme', label: 'Extreme' }]} placeholder="— Select —" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Hunter Ed #</label>
                    <input type="text" value={form.hunter_ed_number} onChange={e => updateForm(p => ({ ...p, hunter_ed_number: e.target.value }))} className={`${inputClass} w-full`} placeholder="1234567" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">Garmin inReach</label>
                    <input type="text" value={form.sat_device_type === 'inreach' ? form.sat_device_id : ''} onChange={e => updateForm(p => ({ ...p, sat_device_type: e.target.value ? 'inreach' : '', sat_device_id: e.target.value }))} className={`${inputClass} w-full`} placeholder="IMEI / Device ID" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-0.5">SPOT Feed ID</label>
                    <input type="text" value={form.sat_device_type === 'spot' ? form.sat_device_id : ''} onChange={e => updateForm(p => ({ ...p, sat_device_type: e.target.value ? 'spot' : '', sat_device_id: e.target.value }))} className={`${inputClass} w-full`} placeholder="Feed ID" />
                  </div>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-muted text-xs mb-0.5">Facebook</label>
                      <div className="flex items-center">
                        <span className="bg-surface border border-default border-r-0 rounded-l px-1.5 py-1.5 text-muted text-xs select-none shrink-0">fb/</span>
                        <input type="text" value={form.social_facebook} onChange={e => updateForm(p => ({ ...p, social_facebook: e.target.value.replace(/^(https?:\/\/)?(www\.)?facebook\.com\/?/i, '') }))} className={`${inputClass} w-full rounded-l-none`} placeholder="username" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-muted text-xs mb-0.5">Instagram</label>
                      <div className="flex items-center">
                        <span className="bg-surface border border-default border-r-0 rounded-l px-1.5 py-1.5 text-muted text-xs select-none shrink-0">@</span>
                        <input type="text" value={form.social_instagram} onChange={e => updateForm(p => ({ ...p, social_instagram: e.target.value.replace(/^(https?:\/\/)?(www\.)?instagram\.com\/?/i, '').replace(/^@/, '') }))} className={`${inputClass} w-full rounded-l-none`} placeholder="handle" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-muted text-xs mb-0.5">X (Twitter)</label>
                      <div className="flex items-center">
                        <span className="bg-surface border border-default border-r-0 rounded-l px-1.5 py-1.5 text-muted text-xs select-none shrink-0">@</span>
                        <input type="text" value={form.social_x} onChange={e => updateForm(p => ({ ...p, social_x: e.target.value.replace(/^(https?:\/\/)?(www\.)?(twitter|x)\.com\/?/i, '').replace(/^@/, '') }))} className={`${inputClass} w-full rounded-l-none`} placeholder="handle" />
                      </div>
                    </div>
                  </div>
              </div>
            )}

            <Divider label="Photos" />
            <PhotoGallery photos={form.photo_urls} onUpdated={(urls) => updateForm(p => ({ ...p, photo_urls: urls }))} />
          </>
        )}
      </div>

      {/* ─── Hunting Module ──────────────────────────────────────────────── */}
      {showHunting && (<>
      <div className="flex items-center gap-3 mt-4 mb-2">
        <div className="h-px flex-1 bg-accent/30" />
        <span className="text-accent text-xs font-semibold uppercase tracking-wider">Hunting Profile</span>
        <div className="h-px flex-1 bg-accent/30" />
      </div>

      <div className="glass-card border border-subtle rounded-lg p-3 space-y-3 mb-2">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-primary font-semibold text-sm">Hunting Preferences</h2>
          <div className="flex items-center gap-2">
            <label className="text-muted text-xs">Experience</label>
            <TacticalSelect value={form.experience_level} onChange={v => updateForm(p => ({ ...p, experience_level: v }))} options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'experienced', label: 'Experienced' }, { value: 'expert', label: 'Expert' }]} placeholder="— Select —" />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={form.looking_for_buddy} onChange={e => updateForm(p => ({ ...p, looking_for_buddy: e.target.checked }))} className="w-3.5 h-3.5 rounded border-default bg-elevated text-accent focus:ring-accent" />
            <span className="text-secondary text-xs">Looking for a buddy</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={form.willing_to_mentor} onChange={e => updateForm(p => ({ ...p, willing_to_mentor: e.target.checked }))} className="w-3.5 h-3.5 rounded border-default bg-elevated text-accent focus:ring-accent" />
            <span className="text-secondary text-xs">Willing to mentor</span>
          </label>
        </div>
        {(form.looking_for_buddy || form.willing_to_mentor) && (
          <div>
            <label className="block text-muted text-xs mb-0.5">Buddy Bio</label>
            <input type="text" value={form.buddy_bio} onChange={e => updateForm(p => ({ ...p, buddy_bio: e.target.value.slice(0, 500) }))} className={`${inputClass} w-full`} placeholder="Looking for elk hunting partners in Colorado..." />
          </div>
        )}
        <div><h3 className="text-secondary text-xs font-medium mb-1.5">Season</h3><div className="flex flex-wrap gap-1.5">{SEASONS.map(s => <Chip key={s.value} {...s} selected={form.weapon_types.includes(s.value)} onToggle={v => toggle('weapon_types', v)} />)}</div></div>
        <Divider label="What I Hunt" />
        <div><h3 className="text-secondary text-xs font-medium mb-1.5">Species</h3><div className="flex flex-wrap gap-1.5">{SPECIES.map(s => <Chip key={s.value} {...s} selected={form.target_species.includes(s.value)} onToggle={v => toggle('target_species', v)} />)}</div></div>
        <div>
          <h3 className="text-secondary text-xs font-medium mb-1">States</h3>
          <div className="flex flex-wrap gap-1.5">{(showAllStates ? US_STATES : US_STATES.slice(0, 20)).map(s => <Chip key={s.value} {...s} selected={form.states_of_interest.includes(s.value)} onToggle={v => toggle('states_of_interest', v)} />)}</div>
          <button type="button" onClick={() => setShowAllStates(p => !p)} className="mt-2 text-xs text-muted hover:text-secondary flex items-center gap-1 transition-colors">{showAllStates ? <><ChevronUp className="h-3 w-3" /> Show fewer</> : <><ChevronDown className="h-3 w-3" /> Show all 50 states</>}</button>
        </div>
        <Divider label="How I Hunt" />
        <div>
          <h3 className="text-secondary text-xs font-medium mb-1.5">Hunt Style</h3>
          <div className="flex flex-wrap gap-1.5">{[{ value: 'diy_public', label: 'DIY Public Land' },{ value: 'guided', label: 'Guided' },{ value: 'outfitter', label: 'Outfitter / Lodge' },{ value: 'solo', label: 'Solo' },{ value: 'backpack', label: 'Backpack' },{ value: 'horse_pack', label: 'Horse Pack' },{ value: 'camp_based', label: 'Camp-Based' },{ value: 'day_hunt', label: 'Day Hunts' },{ value: 'atv_accessible', label: 'ATV Accessible' }].map(s => <Chip key={s.value} {...s} selected={form.hunt_styles.includes(s.value)} onToggle={v => toggle('hunt_styles', v)} />)}</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-muted text-xs">Years hunting</label>
          <input type="number" min={0} max={70} value={form.years_hunting} onChange={e => updateForm(p => ({ ...p, years_hunting: e.target.value }))} className={`${inputClass} w-20`} placeholder="0" />
        </div>
      </div>
      </>)}

      {/* ─── Fitness Module ──────────────────────────────────────────────── */}
      {showFitness && (<>
      <div className="flex items-center gap-3 mt-4 mb-2">
        <div className="h-px flex-1 bg-accent/30" />
        <span className="text-accent text-xs font-semibold uppercase tracking-wider">Fitness Profile</span>
        <div className="h-px flex-1 bg-accent/30" />
      </div>

      <div className="glass-card border border-subtle rounded-lg p-3 space-y-3 mb-2">
        <h2 className="text-primary font-semibold text-sm">Body Composition</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-muted text-xs mb-0.5">Height (ft)</label>
            <input type="number" min={3} max={8} value={form.height_feet} onChange={e => updateForm(p => ({ ...p, height_feet: e.target.value }))} className={`${inputClass} w-full`} placeholder="5" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Height (in)</label>
            <input type="number" min={0} max={11} value={form.height_inches} onChange={e => updateForm(p => ({ ...p, height_inches: e.target.value }))} className={`${inputClass} w-full`} placeholder="10" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Weight (lbs)</label>
            <input type="number" min={50} max={500} value={form.weight_lbs} onChange={e => updateForm(p => ({ ...p, weight_lbs: e.target.value }))} className={`${inputClass} w-full`} placeholder="185" />
          </div>
        </div>
        <Divider label="Strength Benchmarks" />
        <p className="text-muted text-xs">1-rep max or working max in lbs. Used to personalize AI training plans.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-muted text-xs mb-0.5">Bench Press</label>
            <input type="number" min={0} max={999} value={form.bench_press_lbs} onChange={e => updateForm(p => ({ ...p, bench_press_lbs: e.target.value }))} className={`${inputClass} w-full`} placeholder="185" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Squat</label>
            <input type="number" min={0} max={999} value={form.squat_lbs} onChange={e => updateForm(p => ({ ...p, squat_lbs: e.target.value }))} className={`${inputClass} w-full`} placeholder="225" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Deadlift</label>
            <input type="number" min={0} max={999} value={form.deadlift_lbs} onChange={e => updateForm(p => ({ ...p, deadlift_lbs: e.target.value }))} className={`${inputClass} w-full`} placeholder="275" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Overhead Press</label>
            <input type="number" min={0} max={999} value={form.overhead_press_lbs} onChange={e => updateForm(p => ({ ...p, overhead_press_lbs: e.target.value }))} className={`${inputClass} w-full`} placeholder="135" />
          </div>
        </div>
      </div>
      </>)}

      {showPoints && (
      <div className="glass-card border border-subtle rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-primary font-semibold text-sm">Preference Points</h2>
            <p className="text-muted text-xs mt-0.5">Self-reported. Used to personalize draw odds and recommendations.</p>
          </div>
          <button type="button" onClick={addPointsRow} className="flex items-center gap-1 text-xs text-muted hover:text-accent-hover transition-colors"><Plus className="h-3.5 w-3.5" /> Add</button>
        </div>
        {co2028Warning && (
          <div className="mb-2 p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs flex gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span><strong>CO 2028:</strong> Colorado shifts to bonus+preference hybrid. With 5+ pts, your strategy may change.</span>
          </div>
        )}
        {points.length === 0 && <p className="text-muted text-xs">No points tracked yet.</p>}
        {points.length > 0 && (
          <div className="border border-subtle rounded overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-0 bg-surface px-3 py-1.5 text-muted text-xs font-medium border-b border-subtle">
              <div className="col-span-2">State</div>
              <div className="col-span-3">Species</div>
              <div className="col-span-2">Season</div>
              <div className="col-span-1 text-center">Pts</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2"></div>
            </div>
            {points.map((row, idx) => {
              const isEditing = editingPointIdx === idx
              const isSaving = savingPointIdx === idx
              const speciesLabel = SPECIES.find(s => s.value === row.species)?.label ?? row.species
              if (isEditing) {
                return (
                  <div key={idx} className="border-b border-subtle last:border-b-0 bg-elevated p-2.5 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <TacticalSelect value={row.state} onChange={v => updatePointsRow(idx, 'state', v)} options={US_STATES.map(s => ({ value: s.value, label: s.value }))} placeholder="State" />
                      <TacticalSelect value={row.species} onChange={v => updatePointsRow(idx, 'species', v)} options={SPECIES} placeholder="Species" />
                      <TacticalSelect value={row.season || 'general'} onChange={v => updatePointsRow(idx, 'season', v)} options={SEASON_OPTS} />
                      <input type="number" min={0} max={50} value={row.points} onChange={e => updatePointsRow(idx, 'points', parseInt(e.target.value) || 0)} className={`${inputClass} w-full`} placeholder="0" />
                      <TacticalSelect value={row.point_type} onChange={v => updatePointsRow(idx, 'point_type', v)} options={[{ value: 'preference', label: 'Preference' }, { value: 'bonus', label: 'Bonus' }]} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => saveOnePointRow(idx)} disabled={isSaving || !row.state || !row.species} className="flex items-center gap-1 btn-primary disabled:opacity-50 font-semibold rounded px-3 py-1 text-xs"><CheckCircle className="h-3 w-3" />{isSaving ? 'Saving…' : 'Save'}</button>
                      <button type="button" onClick={() => cancelEditPointRow(idx)} className="text-muted hover:text-primary text-xs px-2 py-1"><X className="h-3 w-3 inline" /> Cancel</button>
                      {row.id && <button type="button" onClick={() => deletePointsRow(idx)} className="ml-auto text-muted hover:text-red-400 p-1"><Trash2 className="h-3 w-3" /></button>}
                    </div>
                  </div>
                )
              }
              return (
                <div key={idx}>
                {/* Mobile: card layout */}
                <div className="sm:hidden px-3 py-2.5 border-b border-subtle last:border-b-0 group" onClick={() => setEditingPointIdx(idx)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-sm font-medium">{row.state || '—'}</span>
                      <span className="text-secondary text-sm">{speciesLabel || '—'}</span>
                    </div>
                    <span className="text-accent-hover font-bold text-sm">{row.points} pts</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-muted text-xs">{SEASON_OPTS.find(s => s.value === (row.season || 'general'))?.label}</span>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-muted text-xs">{row.point_type === 'preference' ? 'Pref' : 'Bonus'}</span>
                  </div>
                </div>
                {/* Desktop: grid row */}
                <div className="hidden sm:grid grid-cols-12 gap-0 px-3 py-2 border-b border-subtle last:border-b-0 group hover:bg-elevated/50 transition-colors items-center">
                  <div className="col-span-2 text-primary text-sm font-medium">{row.state || '—'}</div>
                  <div className="col-span-3 text-secondary text-sm">{speciesLabel || '—'}</div>
                  <div className="col-span-2 text-muted text-xs">{SEASON_OPTS.find(s => s.value === (row.season || 'general'))?.label}</div>
                  <div className="col-span-1 text-center text-accent-hover font-bold text-sm">{row.points}</div>
                  <div className="col-span-2 text-muted text-xs">{row.point_type === 'preference' ? 'Pref' : 'Bonus'}</div>
                  <div className="col-span-2 text-right">
                    <button type="button" onClick={() => setEditingPointIdx(idx)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-primary text-xs transition-all"><Pencil className="h-3 w-3 inline" /> Edit</button>
                  </div>
                </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      )}

      {/* No module-specific fields message */}
      {isModuleView && !showHunting && !showFitness && (
        <div className="glass-card border border-subtle rounded-lg p-6 text-center mt-4">
          <p className="text-muted text-sm">No module-specific profile fields yet.</p>
          <p className="text-muted text-xs mt-1">Module-specific settings will appear here as they are added.</p>
        </div>
      )}

    </form>
  )
}
