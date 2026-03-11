'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { US_STATES, FITNESS_OPTIONS, PHYSICAL_CONDITION_OPTIONS } from '@/components/profile/profile-constants'
import { INPUT_CLASS, Divider, SectionHeader } from '@/components/profile/profile-ui'

type FitnessForm = {
  fitness_level: string
  physical_condition: string
  height_feet: string
  height_inches: string
  weight_lbs: string
  bench_press_lbs: string
  squat_lbs: string
  deadlift_lbs: string
  overhead_press_lbs: string
}

type IdentitySummary = {
  display_name: string
  first_name: string
  last_name: string
  state: string
  email: string
}

const EMPTY: FitnessForm = {
  fitness_level: '',
  physical_condition: '',
  height_feet: '',
  height_inches: '',
  weight_lbs: '',
  bench_press_lbs: '',
  squat_lbs: '',
  deadlift_lbs: '',
  overhead_press_lbs: '',
}

export default function FitnessProfileForm() {
  const router = useRouter()
  const [form, setForm] = useState<FitnessForm>(EMPTY)
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

    const [{ data: userProf }, { data: fitProf }] = await Promise.all([
      supabase.from('user_profile').select('display_name, first_name, last_name, state, physical_condition').eq('id', user.id).maybeSingle(),
      supabase.from('fitness_profile').select('*').eq('id', user.id).maybeSingle(),
    ])

    if (userProf) {
      setIdentity({
        display_name: userProf.display_name ?? '',
        first_name: userProf.first_name ?? '',
        last_name: userProf.last_name ?? '',
        state: userProf.state ?? '',
        email: user.email ?? '',
      })
      setForm(prev => ({ ...prev, physical_condition: userProf.physical_condition ?? '' }))
    } else {
      setIdentity(prev => ({ ...prev, email: user.email ?? '' }))
    }

    if (fitProf) {
      setForm(prev => ({
        ...prev,
        fitness_level: fitProf.fitness_level ?? '',
        height_feet: fitProf.height_inches ? Math.floor(fitProf.height_inches / 12).toString() : '',
        height_inches: fitProf.height_inches ? (fitProf.height_inches % 12).toString() : '',
        weight_lbs: fitProf.weight_lbs?.toString() ?? '',
        bench_press_lbs: fitProf.bench_press_lbs?.toString() ?? '',
        squat_lbs: fitProf.squat_lbs?.toString() ?? '',
        deadlift_lbs: fitProf.deadlift_lbs?.toString() ?? '',
        overhead_press_lbs: fitProf.overhead_press_lbs?.toString() ?? '',
      }))
    }
    setLoading(false)
  }, [router])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadProfile is an async data fetcher
  useEffect(() => { void loadProfile() }, [loadProfile])

  function updateForm(updater: (prev: FitnessForm) => FitnessForm) {
    setDirty(true)
    setForm(updater)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ error: fitErr }, { error: userErr }] = await Promise.all([
      supabase.from('fitness_profile').upsert({
        id: user.id,
        fitness_level: (form.fitness_level || null) as 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null,
        height_inches: form.height_feet || form.height_inches ? (parseInt(form.height_feet || '0') * 12) + parseInt(form.height_inches || '0') : null,
        weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
        bench_press_lbs: form.bench_press_lbs ? parseInt(form.bench_press_lbs) : null,
        squat_lbs: form.squat_lbs ? parseInt(form.squat_lbs) : null,
        deadlift_lbs: form.deadlift_lbs ? parseInt(form.deadlift_lbs) : null,
        overhead_press_lbs: form.overhead_press_lbs ? parseInt(form.overhead_press_lbs) : null,
      }, { onConflict: 'id' }),
      supabase.from('user_profile').upsert({
        id: user.id,
        physical_condition: (form.physical_condition || null) as 'light' | 'moderate' | 'strenuous' | 'extreme' | null,
      }, { onConflict: 'id' }),
    ])

    const err = fitErr || userErr
    if (err) { setError(err.message) } else { setSaved(true); setDirty(false); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  if (loading) return <div className="text-muted text-sm py-12 text-center">Loading your profile...</div>

  return (
    <form onSubmit={handleSave} onChangeCapture={() => setDirty(true)}>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-primary">Fitness Profile</h1>
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
          {identity.email && <div><span className="text-muted text-xs block">Email</span><span className="text-primary text-sm">{identity.email}</span></div>}
        </div>
      </div>

      {/* Fitness Settings */}
      <SectionHeader label="Fitness Profile" />

      <div className="glass-card border border-subtle rounded-lg p-3 space-y-3 mb-2">
        <h2 className="text-primary font-semibold text-sm">Fitness & Body Composition</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-muted text-xs mb-0.5">Fitness Level</label>
            <TacticalSelect value={form.fitness_level} onChange={v => updateForm(p => ({ ...p, fitness_level: v }))} options={FITNESS_OPTIONS.map(o => ({ value: o.value, label: o.label }))} placeholder="— Select —" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Physical Condition</label>
            <TacticalSelect value={form.physical_condition} onChange={v => updateForm(p => ({ ...p, physical_condition: v }))} options={PHYSICAL_CONDITION_OPTIONS} placeholder="— Select —" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Height (ft)</label>
            <input type="number" min={3} max={8} value={form.height_feet} onChange={e => updateForm(p => ({ ...p, height_feet: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="5" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Height (in)</label>
            <input type="number" min={0} max={11} value={form.height_inches} onChange={e => updateForm(p => ({ ...p, height_inches: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="10" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Weight (lbs)</label>
            <input type="number" min={50} max={500} value={form.weight_lbs} onChange={e => updateForm(p => ({ ...p, weight_lbs: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="185" />
          </div>
        </div>
        <Divider label="Strength Benchmarks" />
        <p className="text-muted text-xs">1-rep max or working max in lbs. Used to personalize AI training plans.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-muted text-xs mb-0.5">Bench Press</label>
            <input type="number" min={0} max={999} value={form.bench_press_lbs} onChange={e => updateForm(p => ({ ...p, bench_press_lbs: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="185" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Squat</label>
            <input type="number" min={0} max={999} value={form.squat_lbs} onChange={e => updateForm(p => ({ ...p, squat_lbs: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="225" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Deadlift</label>
            <input type="number" min={0} max={999} value={form.deadlift_lbs} onChange={e => updateForm(p => ({ ...p, deadlift_lbs: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="275" />
          </div>
          <div>
            <label className="block text-muted text-xs mb-0.5">Overhead Press</label>
            <input type="number" min={0} max={999} value={form.overhead_press_lbs} onChange={e => updateForm(p => ({ ...p, overhead_press_lbs: e.target.value }))} className={`${INPUT_CLASS} w-full`} placeholder="135" />
          </div>
        </div>
      </div>
    </form>
  )
}
