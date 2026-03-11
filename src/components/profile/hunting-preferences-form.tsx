'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ChevronDown, ChevronUp, Trash2, Plus, AlertTriangle, Pencil, X, ExternalLink } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { US_STATES, SEASONS, SPECIES, HUNT_STYLES, SEASON_OPTS } from '@/components/profile/profile-constants'
import { INPUT_CLASS, Chip, Divider, SectionHeader } from '@/components/profile/profile-ui'

// ─── Types ───────────────────────────────────────────────────────────────────

type HuntingForm = {
  hunter_ed_number: string
  sat_device_type: 'inreach' | 'spot' | 'none' | ''
  sat_device_id: string
  weapon_types: string[]
  target_species: string[]
  states_of_interest: string[]
  hunt_styles: string[]
  experience_level: string
  years_hunting: string
  looking_for_buddy: boolean
  willing_to_mentor: boolean
  buddy_bio: string
  willing_to_fly: boolean
  max_drive_hours: string
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

type IdentitySummary = {
  display_name: string
  first_name: string
  last_name: string
  state: string
  date_of_birth: string
  phone: string
  email: string
}

const EMPTY: HuntingForm = {
  hunter_ed_number: '',
  sat_device_type: '',
  sat_device_id: '',
  weapon_types: [],
  target_species: [],
  states_of_interest: [],
  hunt_styles: [],
  experience_level: '',
  years_hunting: '',
  looking_for_buddy: false,
  willing_to_mentor: false,
  buddy_bio: '',
  willing_to_fly: false,
  max_drive_hours: '',
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function HuntingPreferencesForm() {
  const router = useRouter()
  const [form, setForm] = useState<HuntingForm>(EMPTY)
  const [identity, setIdentity] = useState<IdentitySummary>({ display_name: '', first_name: '', last_name: '', state: '', date_of_birth: '', phone: '', email: '' })
  const [points, setPoints] = useState<PointsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllStates, setShowAllStates] = useState(false)
  const [editingPointIdx, setEditingPointIdx] = useState<number | null>(null)
  const [savingPointIdx, setSavingPointIdx] = useState<number | null>(null)
  const [userId, setUserId] = useState('')

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)

    const [{ data: userProf }, { data: huntProf }, { data: pts }] = await Promise.all([
      supabase.from('user_profile').select('display_name, first_name, last_name, state, date_of_birth, phone').eq('id', user.id).maybeSingle(),
      supabase.from('hunting_profile').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('hunting_points').select('*').eq('user_id', user.id).order('state'),
    ])

    if (userProf) {
      setIdentity({
        display_name: userProf.display_name ?? '',
        first_name: userProf.first_name ?? '',
        last_name: userProf.last_name ?? '',
        state: userProf.state ?? '',
        date_of_birth: userProf.date_of_birth ?? '',
        phone: userProf.phone ?? '',
        email: user.email ?? '',
      })
    } else {
      setIdentity(prev => ({ ...prev, email: user.email ?? '' }))
    }

    if (huntProf) {
      setForm({
        hunter_ed_number: huntProf.hunter_ed_number ?? '',
        sat_device_type: huntProf.sat_device_type ?? '',
        sat_device_id: huntProf.sat_device_id ?? '',
        weapon_types: (huntProf.weapon_types ?? []).map((v: string) =>
          v.startsWith('archery') ? 'archery' : v
        ).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
        target_species: huntProf.target_species ?? [],
        states_of_interest: huntProf.states_of_interest ?? [],
        hunt_styles: huntProf.hunt_styles ?? [],
        experience_level: huntProf.experience_level ?? '',
        years_hunting: huntProf.years_hunting?.toString() ?? '',
        looking_for_buddy: huntProf.looking_for_buddy ?? false,
        willing_to_mentor: huntProf.willing_to_mentor ?? false,
        buddy_bio: huntProf.buddy_bio ?? '',
        willing_to_fly: huntProf.willing_to_fly ?? false,
        max_drive_hours: huntProf.max_drive_hours?.toString() ?? '',
      })
    }
    if (pts) setPoints(pts)
    setLoading(false)
  }, [router])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadProfile is an async data fetcher
  useEffect(() => { void loadProfile() }, [loadProfile])

  function updateForm(updater: (prev: HuntingForm) => HuntingForm) {
    setDirty(true)
    setForm(updater)
  }

  function toggle(field: keyof HuntingForm, value: string) {
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

    const { error: err } = await supabase.from('hunting_profile').upsert({
      id: user.id,
      hunter_ed_number: form.hunter_ed_number || null,
      sat_device_type: (form.sat_device_type || null) as 'inreach' | 'spot' | 'none' | null,
      sat_device_id: form.sat_device_id || null,
      weapon_types: form.weapon_types,
      target_species: form.target_species,
      states_of_interest: form.states_of_interest,
      hunt_styles: form.hunt_styles,
      experience_level: (form.experience_level || null) as 'beginner' | 'intermediate' | 'experienced' | 'expert' | null,
      years_hunting: form.years_hunting ? parseInt(form.years_hunting) : null,
      looking_for_buddy: form.looking_for_buddy,
      willing_to_mentor: form.willing_to_mentor,
      buddy_bio: form.buddy_bio || null,
    }, { onConflict: 'id' })

    if (err) { setError(err.message) } else { setSaved(true); setDirty(false); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  // ─── Points CRUD ─────────────────────────────────────────────────────────

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
      await supabase.from('hunting_points').delete().eq('id', row.id)
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
      await supabase.from('hunting_points').update({
        state: row.state, state_name: row.state_name, species: row.species,
        season: row.season || 'general', points: row.points,
        point_type: row.point_type, updated_at: new Date().toISOString(),
      }).eq('id', row.id)
    } else {
      await supabase.from('hunting_points').upsert({
        user_id: user.id, state: row.state, state_name: row.state_name,
        species: row.species, season: row.season || 'general',
        points: row.points, point_type: row.point_type,
      }, { onConflict: 'user_id,state,species,season' })
    }
    const { data: fresh } = await supabase.from('hunting_points').select('*').eq('user_id', user.id).order('state')
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

  function fmtDate(iso: string | undefined) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const co2028Warning = points.some(r =>
    r.state === 'CO' && ['elk', 'mule_deer', 'whitetail', 'pronghorn'].includes(r.species) && r.points >= 5
  )

  if (loading) return <div className="text-muted text-sm py-12 text-center">Loading your profile...</div>

  return (
    <form onSubmit={handleSave} onChangeCapture={() => setDirty(true)}>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-primary">Hunting Profile</h1>
        {(dirty || saving || saved) && (
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded px-5 py-1.5 text-sm transition-colors flex items-center gap-2">
            {saving ? 'Saving...' : saved ? <><CheckCircle className="h-4 w-4" /> Saved</> : 'Save Profile'}
          </button>
        )}
      </div>

      {error && <div className="mb-2 p-2 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">{error}</div>}

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
          {identity.date_of_birth && <div><span className="text-muted text-xs block">Date of Birth</span><span className="text-primary text-sm">{fmtDate(identity.date_of_birth) ?? identity.date_of_birth}</span></div>}
          {identity.phone && <div><span className="text-muted text-xs block">Phone</span><span className="text-primary text-sm">{identity.phone}</span></div>}
          {identity.email && <div><span className="text-muted text-xs block">Email</span><span className="text-primary text-sm">{identity.email}</span></div>}
        </div>
      </div>

      {/* Hunting Preferences */}
      <SectionHeader label="Hunting Preferences" />

      <div className="glass-card border border-subtle rounded-lg p-3 space-y-3 mb-2">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-primary font-semibold text-sm">Preferences</h2>
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
            <input type="text" value={form.buddy_bio} onChange={e => updateForm(p => ({ ...p, buddy_bio: e.target.value.slice(0, 500) }))} className={`${INPUT_CLASS} w-full`} placeholder="Looking for elk hunting partners in Colorado..." />
          </div>
        )}

        <Divider label="Credentials & Devices" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-muted text-xs mb-0.5">Hunter Ed #</label>
            <input type="text" value={form.hunter_ed_number} onChange={e => updateForm(p => ({ ...p, hunter_ed_number: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="1234567" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Garmin inReach</label>
            <input type="text" value={form.sat_device_type === 'inreach' ? form.sat_device_id : ''} onChange={e => updateForm(p => ({ ...p, sat_device_type: e.target.value ? 'inreach' : '', sat_device_id: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="IMEI / Device ID" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">SPOT Feed ID</label>
            <input type="text" value={form.sat_device_type === 'spot' ? form.sat_device_id : ''} onChange={e => updateForm(p => ({ ...p, sat_device_type: e.target.value ? 'spot' : '', sat_device_id: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="Feed ID" />
          </div>
        </div>

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
          <div className="flex flex-wrap gap-1.5">{HUNT_STYLES.map(s => <Chip key={s.value} {...s} selected={form.hunt_styles.includes(s.value)} onToggle={v => toggle('hunt_styles', v)} />)}</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-muted text-xs">Years hunting</label>
          <input type="number" min={0} max={70} value={form.years_hunting} onChange={e => updateForm(p => ({ ...p, years_hunting: e.target.value }))} className={`${INPUT_CLASS} w-20`} placeholder="0" />
        </div>
      </div>

      {/* Preference Points */}
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
                      <input type="number" min={0} max={50} value={row.points} onChange={e => updatePointsRow(idx, 'points', parseInt(e.target.value) || 0)} className={`${INPUT_CLASS} w-full`} placeholder="0" />
                      <TacticalSelect value={row.point_type} onChange={v => updatePointsRow(idx, 'point_type', v)} options={[{ value: 'preference', label: 'Preference' }, { value: 'bonus', label: 'Bonus' }]} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => saveOnePointRow(idx)} disabled={isSaving || !row.state || !row.species} className="flex items-center gap-1 btn-primary disabled:opacity-50 font-semibold rounded px-3 py-1 text-xs"><CheckCircle className="h-3 w-3" />{isSaving ? 'Saving...' : 'Save'}</button>
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
    </form>
  )
}
