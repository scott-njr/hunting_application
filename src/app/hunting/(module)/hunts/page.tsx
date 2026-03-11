'use client'

import { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Tent, Plus, X, Trash2, CheckCircle, ChevronRight, ChevronDown,
  Users, MapPin, Loader2, Mail, UserCheck, AlertCircle, Link,
  Pencil, Target, UserCircle, FileText, Package, Sparkles, FileDown, Calendar, AlertTriangle,
} from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { LocationPickerMap } from '@/components/ui/location-picker-map'
import { LocationScoutMap, type ExistingPin } from '@/components/ui/location-scout-map'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'
import { ShareHuntModal } from '@/components/hunts/share-hunt-modal'

// ─── Constants ────────────────────────────────────────────────────────────────

const HUNT_TYPES = [
  {
    value: 'group_draw',
    label: 'Group Draw',
    desc: 'Multiple hunters applying together for the same tag',
    note: 'Lowest member\'s points = group\'s effective points',
  },
  {
    value: 'otc',
    label: 'OTC / No Draw',
    desc: 'Over-the-counter tags — no draw required',
    note: 'Focus on logistics and coordination',
  },
  {
    value: 'out_of_state',
    label: 'Out of State',
    desc: 'Non-resident hunt — license + draw requirements apply',
    note: 'Non-resident license required',
  },
  {
    value: 'in_state',
    label: 'In State',
    desc: 'Home state hunt — resident tags, private or public land',
    note: null,
  },
  {
    value: 'solo',
    label: 'Solo Hunt',
    desc: 'Hunting alone — includes family safety share options',
    note: 'Safety share link available',
  },
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
  { value: 'turkey', label: 'Turkey' },
  { value: 'waterfowl', label: 'Waterfowl' },
  { value: 'upland', label: 'Upland Birds' },
]

const WEAPONS = [
  { value: 'rifle', label: 'Rifle' },
  { value: 'archery', label: 'Archery' },
  { value: 'muzzleloader', label: 'Muzzleloader' },
  { value: 'shotgun', label: 'Shotgun' },
  { value: 'handgun', label: 'Handgun' },
  { value: 'any', label: 'Any Legal' },
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


const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  applied: 'Applied',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_STYLES: Record<string, string> = {
  planning: 'bg-blue-900/40 text-blue-400 border-blue-500/30',
  applied: 'bg-amber-900/40 text-amber-400 border-amber-500/30',
  booked: 'bg-accent-dim text-accent-hover border-accent-border',
  completed: 'bg-elevated text-secondary border-default',
  cancelled: 'bg-red-950/40 text-red-400 border-red-900/50',
}

const STATUS_ORDER = ['planning', 'applied', 'booked', 'completed', 'cancelled'] as const

const POI_LABELS: Record<string, string> = {
  emergency: 'Emergency',
  access: 'Access Point',
  water: 'Water',
  camp: 'Camp',
  hazard: 'Hazard',
  town: 'Town',
  // Legacy
  medical: 'Emergency',
  trailhead: 'Access Point',
  parking: 'Access Point',
  ranger: 'Emergency',
}

const TYPE_LABELS: Record<string, string> = {
  group_draw: 'Group Draw',
  otc: 'OTC',
  out_of_state: 'Out of State',
  in_state: 'In State',
  solo: 'Solo',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type HuntPlan = {
  id: string
  title: string
  hunt_type: string | null
  state: string
  state_name: string
  species: string
  season: string
  year: number
  unit: string | null
  status: string
  trip_start_date: string | null
  trip_end_date: string | null
  budget: string | null
  fly_or_drive: string | null
  trip_days: number | null
  notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  print_recipients: unknown
  ai_recommendations: unknown | null
  gear_list: unknown | null
  created_at: string
}

type GearItem = {
  id: string
  name: string
  category: string
  brand: string | null
}

type HuntMember = {
  id: string
  display_name: string
  email: string | null
  role: string
  is_scout_user: boolean
  added_at: string
  updated_at: string
}

type HuntLocation = {
  id: string
  hunt_plan_id: string
  label: string
  description: string | null
  lat: number | null
  lng: number | null
  scout_report: {
    text: string
    generated_at: string
    pois?: { label: string; lat: number; lng: number; type: string }[]
    sections?: { key: string; title: string; rows: { label: string; value: string }[] }[]
    truncated?: boolean
  } | null
  created_at: string
  updated_at: string
}

/** Try to recover structured sections from a scout_report that has raw JSON in .text but empty .sections */
function recoverSections(report: HuntLocation['scout_report']): { key: string; title: string; rows: { label: string; value: string }[] }[] | null {
  if (!report) return null
  if ((report.sections ?? []).length > 0) return report.sections!
  if (!report.text || !report.text.trimStart().startsWith('{')) return null
  try {
    const parsed = JSON.parse(report.text)
    if (Array.isArray(parsed.sections)) {
      return (parsed.sections as Array<Record<string, unknown>>)
        .filter((s: Record<string, unknown>) => s.key && s.title && Array.isArray(s.rows))
        .map((s: Record<string, unknown>) => ({
          key: String(s.key),
          title: String(s.title),
          rows: (s.rows as Array<Record<string, unknown>>)
            .filter((r: Record<string, unknown>) => r.label && r.value)
            .map((r: Record<string, unknown>) => ({ label: String(r.label), value: String(r.value) })),
        }))
    }
  } catch { /* not parseable, fall through */ }
  return null
}

/** Try to recover POIs from a scout_report that has raw JSON in .text but empty .pois */
function recoverPois(report: HuntLocation['scout_report']): { label: string; lat: number; lng: number; type: string }[] | null {
  if (!report) return null
  if ((report.pois ?? []).length > 0) return report.pois!
  if (!report.text || !report.text.trimStart().startsWith('{')) return null
  try {
    const parsed = JSON.parse(report.text)
    if (Array.isArray(parsed.points_of_interest)) {
      return (parsed.points_of_interest as Array<Record<string, unknown>>)
        .filter((p: Record<string, unknown>) => p.label && typeof p.lat === 'number' && typeof p.lng === 'number')
        .map((p: Record<string, unknown>) => ({
          label: String(p.label),
          lat: p.lat as number,
          lng: p.lng as number,
          type: typeof p.type === 'string' ? p.type : 'town',
        }))
    }
  } catch { /* not parseable */ }
  return null
}

// Confirmed Scout friend added to this hunt
type MemberRow = {
  tempId: string
  email: string
  display_name: string
  user_id: string
}

// Email-only print/share recipient (no Scout account needed)
type PrintRecipient = {
  tempId: string
  email: string
}

// Friend from the user's confirmed circle
type Friend = {
  friendship_id: string
  friend_id: string
  display_name: string | null
  email: string
}

type NewHuntForm = {
  hunt_type: string
  title: string
  state: string
  species: string
  season: string
  unit: string
  notes: string
  emergency_contact_name: string
  emergency_contact_phone: string
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function HuntsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hunts, setHunts] = useState<HuntPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [expandedHuntId, setExpandedHuntId] = useState<string | null>(null)
  const [editingHuntId, setEditingHuntId] = useState<string | null>(null)
  const [huntMembers, setHuntMembers] = useState<Record<string, HuntMember[]>>({})
  const [huntLocations, setHuntLocations] = useState<Record<string, HuntLocation[]>>({})
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null)
  const [scoutStep, setScoutStep] = useState<string>('')
  const scoutAbortRef = useRef<AbortController | null>(null)
  const [addingLocationForHunt, setAddingLocationForHunt] = useState<string | null>(null)
  const [newLocLabel, setNewLocLabel] = useState('')
  const [newLocDesc, setNewLocDesc] = useState('')
  const [newLocLat, setNewLocLat] = useState('')
  const [newLocLng, setNewLocLng] = useState('')
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  const [highlightedPoi, setHighlightedPoi] = useState<{ lat: number; lng: number } | null>(null)
  const [locationSaveError, setLocationSaveError] = useState<string | null>(null)
  const [scoutError, setScoutError] = useState<{ locId: string; msg: string } | null>(null)
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [editLocLabel, setEditLocLabel] = useState('')
  const [editLocDesc, setEditLocDesc] = useState('')
  const [editLocLat, setEditLocLat] = useState('')
  const [editLocLng, setEditLocLng] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, Set<string>>>({})
  const [addedToMap, setAddedToMap] = useState<Set<string>>(new Set()) // "locId:lat:lng" keys
  const [addingToMap, setAddingToMap] = useState<string | null>(null)
  const [fieldMapPins, setFieldMapPins] = useState<ExistingPin[]>([])

  // Delete hunt confirmation
  const [deletingHuntId, setDeletingHuntId] = useState<string | null>(null)
  const [deleteKeepPins, setDeleteKeepPins] = useState(true)
  const [deletingInProgress, setDeletingInProgress] = useState(false)

  // Share hunt plan
  const [sharingHuntId, setSharingHuntId] = useState<string | null>(null)
  const [sharingHuntTitle, setSharingHuntTitle] = useState('')
  const [sharingRecipients, setSharingRecipients] = useState<{ email: string }[]>([])

  // Gear inventory + per-hunt selections
  const [userGear, setUserGear] = useState<GearItem[]>([])
  const [gearLoaded, setGearLoaded] = useState(false)
  const [huntGearList, setHuntGearList] = useState<Record<string, string[]>>({}) // huntId → selected gear IDs
  const [savingGear, setSavingGear] = useState<string | null>(null)

  // Confirmed Scout members added to this hunt
  const [members, setMembers] = useState<MemberRow[]>([])
  // Email-only print/share recipients
  const [printRecipients, setPrintRecipients] = useState<PrintRecipient[]>([])
  // Friends from the user's circle (loaded when entering Step 2)
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendSearch, setFriendSearch] = useState('')
  const [friendsLoaded, setFriendsLoaded] = useState(false)
  const [addingExternal, setAddingExternal] = useState(false)
  const [externalEmail, setExternalEmail] = useState('')

  const [form, setForm] = useState<NewHuntForm>({
    hunt_type: '',
    title: '',
    state: searchParams.get('state') ?? '',
    species: searchParams.get('species') ?? '',
    season: 'rifle',
    unit: searchParams.get('unit') ?? '',
    notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })

  const loadHunts = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data } = await supabase
      .from('hunting_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setHunts(data)
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadHunts()
    // Load user's existing Field Map pins to show on scout maps
    async function loadFieldMapPins() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('hunting_field_map_pins')
        .select('id, pin_type, lat, lng, label, color')
        .eq('user_id', user.id)
      if (data) setFieldMapPins(data as ExistingPin[])
    }
    loadFieldMapPins()
  }, [loadHunts])

  // Open form if coming from Applications or Deadline Tracker
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowForm(true)
      // Skip type selector if hunt_type is pre-set (e.g. coming from a drawn application)
      if (searchParams.get('hunt_type')) {
        setForm(prev => ({ ...prev, hunt_type: searchParams.get('hunt_type') ?? '' }))
        setStep(2)
      } else {
        setStep(1)
      }
    }
  }, [searchParams])

  // Load confirmed friends once when entering Step 2
  useEffect(() => {
    if (step !== 2 || friendsLoaded) return
    fetch('/api/friends')
      .then(r => r.json())
      .then(d => { setFriends(d.friends ?? []); setFriendsLoaded(true) })
      .catch(() => setFriendsLoaded(true))
  }, [step, friendsLoaded])

  function toggleSection(locId: string, sectionKey: string) {
    setExpandedSections(prev => {
      const current = prev[locId] ?? new Set<string>()
      const next = new Set(current)
      if (next.has(sectionKey)) next.delete(sectionKey)
      else next.add(sectionKey)
      return { ...prev, [locId]: next }
    })
  }

  const SCOUT_TO_PIN: Record<string, string> = {
    emergency: 'emergency',
    access: 'access',
    water: 'water',
    camp: 'camp',
    hazard: 'hazard',
    town: 'town',
    processor: 'processor',
    // Legacy types
    medical: 'emergency',
    trailhead: 'access',
    parking: 'parking',
    ranger: 'emergency',
  }

  async function addPoiToFieldMap(
    poi: { label: string; lat: number; lng: number; type: string },
    huntPlanId: string,
    locId: string,
  ) {
    const poiKey = `${locId}:${poi.lat}:${poi.lng}`
    setAddingToMap(poiKey)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[field-map] addPoiToFieldMap: no authenticated user')
        setAddingToMap(null)
        return
      }

      // Dedup: check if pin already exists nearby for this user
      const { data: existing, error: dedupErr } = await supabase
        .from('hunting_field_map_pins')
        .select('id')
        .eq('user_id', user.id)
        .gte('lat', poi.lat - 0.0014)
        .lte('lat', poi.lat + 0.0014)
        .gte('lng', poi.lng - 0.0014)
        .lte('lng', poi.lng + 0.0014)
        .limit(1)

      if (dedupErr) {
        console.error('[field-map] dedup check failed:', dedupErr.message)
      }

      if (!existing || existing.length === 0) {
        // Try with source_hunt_plan_id first; fall back without it if column doesn't exist yet
        const pinData = {
          user_id: user.id,
          pin_type: SCOUT_TO_PIN[poi.type] ?? 'note',
          lat: poi.lat,
          lng: poi.lng,
          label: poi.label,
          notes: `Scout POI (${poi.type}) — added from hunt scout report`,
          source_hunt_plan_id: huntPlanId,
          metadata: { scout_type: poi.type },
        }

        let { error: insertErr } = await supabase.from('hunting_field_map_pins').insert(pinData)

        // If source_hunt_plan_id column doesn't exist yet (migration not applied), retry without it
        if (insertErr && insertErr.message.includes('source_hunt_plan_id')) {
          console.warn('[field-map] source_hunt_plan_id column not found, inserting without it')
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { source_hunt_plan_id: _sourceId, ...pinDataWithout } = pinData
          const retry = await supabase.from('hunting_field_map_pins').insert(pinDataWithout)
          insertErr = retry.error
        }

        if (insertErr) {
          console.error('[field-map] insert pin failed:', insertErr.message)
          setScoutError({ locId, msg: `Failed to add pin: ${insertErr.message}` })
          setAddingToMap(null)
          return
        }
      }

      setAddedToMap(prev => new Set(prev).add(poiKey))
      // Add to fieldMapPins so the pin shows immediately on scout maps
      setFieldMapPins(prev => [...prev, {
        id: crypto.randomUUID(), // placeholder ID until next full load
        pin_type: SCOUT_TO_PIN[poi.type] ?? 'note',
        lat: poi.lat,
        lng: poi.lng,
        label: poi.label,
        color: null,
      }])
    } catch (err) {
      console.error('[field-map] addPoiToFieldMap error:', err)
      setScoutError({ locId, msg: 'Failed to add pin — check your connection.' })
    } finally {
      setAddingToMap(null)
    }
  }

  async function addAllPoisToFieldMap(
    pois: { label: string; lat: number; lng: number; type: string }[],
    huntPlanId: string,
    locId: string,
  ) {
    for (const poi of pois) {
      await addPoiToFieldMap(poi, huntPlanId, locId)
    }
  }

  function openNewForm() {
    setEditingHuntId(null)
    setForm({
      hunt_type: '',
      title: '',
      state: '',
      species: '',
      season: 'rifle',
      unit: '',
      notes: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    })
    setMembers([])
    setPrintRecipients([])
    setFriends([])
    setFriendSearch('')
    setFriendsLoaded(false)
    setAddingExternal(false)
    setExternalEmail('')
    setSaveError(null)
    setStep(1)
    setShowForm(true)
  }

  // ─── Hunt party helpers ────────────────────────────────────────────────────

  function addFriendToParty(friend: Friend) {
    if (members.some(m => m.user_id === friend.friend_id)) return
    setMembers(prev => [...prev, {
      tempId: crypto.randomUUID(),
      email: friend.email,
      display_name: friend.display_name || friend.email,
      user_id: friend.friend_id,
    }])
    setFriendSearch('')
  }

  function removeMember(tempId: string) {
    setMembers(prev => prev.filter(m => m.tempId !== tempId))
  }

  function confirmExternalRecipient() {
    if (!externalEmail.trim()) return
    setPrintRecipients(prev => [...prev, { tempId: crypto.randomUUID(), email: externalEmail.trim() }])
    setExternalEmail('')
    setAddingExternal(false)
  }

  function removePrintRecipient(tempId: string) {
    setPrintRecipients(prev => prev.filter(r => r.tempId !== tempId))
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.title || !form.hunt_type || !form.state || !form.species) return
    setSaving(true)
    setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const stateLabel = US_STATES.find(s => s.value === form.state)?.label ?? form.state

    type HuntType = 'group_draw' | 'otc' | 'out_of_state' | 'in_state' | 'solo'

    const { data: plan, error } = await supabase
      .from('hunting_plans')
      .insert({
        user_id: user.id,
        title: form.title,
        hunt_type: (form.hunt_type || null) as HuntType | null,
        state: form.state,
        state_name: stateLabel,
        species: form.species,
        season: form.season || 'general',
        year: new Date().getFullYear(),
        unit: form.unit || null,
        status: 'planning' as const,
        notes: form.notes || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        print_recipients: printRecipients.map(r => ({ email: r.email })),
      })
      .select()
      .single()

    if (error) {
      setSaveError(error.message.includes('relation') || error.message.includes('does not exist')
        ? 'Database tables not found. Run `supabase db push` to apply migrations.'
        : error.message)
      setSaving(false)
      return
    }

    // Save confirmed Scout members
    if (plan && members.length > 0) {
      await supabase.from('hunting_plan_members').insert(
        members.map(m => ({
          hunt_plan_id: plan.id,
          user_id: m.user_id,
          display_name: m.display_name,
          email: m.email,
          role: 'collaborator' as const,
          is_scout_user: true,
        }))
      )
    }

    setSaving(false)
    setShowForm(false)
    loadHunts()
    if (searchParams.get('new')) {
      router.replace('/hunting/hunts')
    }
  }

  async function loadHuntMembers(huntId: string) {
    if (huntMembers[huntId]) return // already cached
    const supabase = createClient()
    const { data } = await supabase
      .from('hunting_plan_members')
      .select('id, display_name, email, role, is_scout_user, added_at, updated_at')
      .eq('hunt_plan_id', huntId)
      .order('updated_at', { ascending: false })
    if (data) setHuntMembers(prev => ({ ...prev, [huntId]: data }))
  }

  async function handleUpdate(huntId: string) {
    if (!form.title || !form.state || !form.species) return
    setSaving(true); setSaveError(null)
    const supabase = createClient()
    const stateLabel = US_STATES.find(s => s.value === form.state)?.label ?? form.state
    const { error } = await supabase.from('hunting_plans').update({
      title: form.title,
      state: form.state,
      state_name: stateLabel,
      species: form.species,
      season: form.season || 'general',
      unit: form.unit || null,
      notes: form.notes || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
    }).eq('id', huntId)
    if (error) { setSaveError(error.message); setSaving(false); return }
    setSaving(false)
    setEditingHuntId(null)
    setShowForm(false)
    loadHunts()
  }

  async function loadHuntLocations(huntId: string) {
    if (huntLocations[huntId]) return // already cached
    const supabase = createClient()
    const { data } = await supabase
      .from('hunting_locations')
      .select('*')
      .eq('hunt_plan_id', huntId)
      .order('created_at')
    if (data) setHuntLocations(prev => ({ ...prev, [huntId]: data as HuntLocation[] }))
  }

  async function addHuntLocation(huntId: string): Promise<HuntLocation | null> {
    if (!newLocLabel.trim() && !newLocDesc.trim()) return null
    setLocationSaveError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('hunting_locations')
      .insert({
        hunt_plan_id: huntId,
        label: newLocLabel.trim() || 'Location',
        description: newLocDesc.trim() || null,
        lat: newLocLat ? parseFloat(newLocLat) : null,
        lng: newLocLng ? parseFloat(newLocLng) : null,
      })
      .select()
      .single()
    if (error) {
      setLocationSaveError(
        error.message.includes('does not exist') || error.message.includes('relation')
          ? 'Table not found — run `supabase db push` to apply migration 0007.'
          : error.message
      )
      return null
    }
    if (data) {
      setHuntLocations(prev => ({ ...prev, [huntId]: [...(prev[huntId] ?? []), data as HuntLocation] }))
      setNewLocLabel('')
      setNewLocDesc('')
      setNewLocLat('')
      setNewLocLng('')
      setAddingLocationForHunt(null)
      return data as HuntLocation
    }
    return null
  }

  async function saveAndScoutLocation(huntId: string) {
    const loc = await addHuntLocation(huntId)
    if (loc) generateLocationReport(loc)
  }

  async function deleteHuntLocation(locationId: string, huntId: string) {
    const supabase = createClient()
    await supabase.from('hunting_locations').delete().eq('id', locationId)
    setHuntLocations(prev => ({
      ...prev,
      [huntId]: (prev[huntId] ?? []).filter(l => l.id !== locationId),
    }))
  }

  async function updateHuntLocation(locationId: string, huntId: string) {
    if (!editLocLabel.trim() && !editLocDesc.trim()) return
    setLocationSaveError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('hunting_locations')
      .update({
        label: editLocLabel.trim() || 'Location',
        description: editLocDesc.trim() || null,
        lat: editLocLat ? parseFloat(editLocLat) : null,
        lng: editLocLng ? parseFloat(editLocLng) : null,
      })
      .eq('id', locationId)
    if (error) {
      setLocationSaveError(error.message)
      return
    }
    setHuntLocations(prev => ({
      ...prev,
      [huntId]: (prev[huntId] ?? []).map(l =>
        l.id === locationId
          ? { ...l, label: editLocLabel.trim() || 'Location', description: editLocDesc.trim() || null, lat: editLocLat ? parseFloat(editLocLat) : null, lng: editLocLng ? parseFloat(editLocLng) : null }
          : l
      ),
    }))
    setEditingLocationId(null)
  }

  function startEditLocation(loc: HuntLocation) {
    setEditingLocationId(loc.id)
    setEditLocLabel(loc.label)
    setEditLocDesc(loc.description ?? '')
    setEditLocLat(loc.lat != null ? String(loc.lat) : '')
    setEditLocLng(loc.lng != null ? String(loc.lng) : '')
    setLocationSaveError(null)
  }

  async function loadUserGear() {
    if (gearLoaded) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('hunting_gear_items')
      .select('id, name, category, brand')
      .eq('user_id', user.id)
      .order('category')
      .order('name')
    if (data) setUserGear(data as GearItem[])
    setGearLoaded(true)
  }

  function initHuntGearList(hunt: HuntPlan) {
    if (huntGearList[hunt.id] !== undefined) return
    const list = Array.isArray(hunt.gear_list) ? (hunt.gear_list as string[]) : []
    setHuntGearList(prev => ({ ...prev, [hunt.id]: list }))
  }

  function toggleGearItem(huntId: string, gearId: string) {
    setHuntGearList(prev => {
      const current = prev[huntId] ?? []
      const next = current.includes(gearId)
        ? current.filter(id => id !== gearId)
        : [...current, gearId]
      return { ...prev, [huntId]: next }
    })
  }

  async function saveGearList(huntId: string) {
    setSavingGear(huntId)
    const supabase = createClient()
    await supabase
      .from('hunting_plans')
      .update({ gear_list: huntGearList[huntId] ?? [] })
      .eq('id', huntId)
    setSavingGear(null)
  }

  function cancelScoutReport() {
    scoutAbortRef.current?.abort()
    scoutAbortRef.current = null
    setGeneratingReportId(null)
    setScoutStep('')
    setScoutError(null)
  }

  async function deleteHuntPlan(huntId: string, keepPins: boolean) {
    setDeletingInProgress(true)
    const supabase = createClient()

    if (!keepPins) {
      // Delete field map pins sourced from this hunt plan
      await supabase
        .from('hunting_field_map_pins')
        .delete()
        .eq('source_hunt_plan_id', huntId)
    } else {
      // Detach pins so they survive the hunt deletion (source_hunt_plan_id → null via ON DELETE SET NULL)
      // No action needed — the FK is ON DELETE SET NULL
    }

    // Delete the hunt plan (cascades to hunting_locations and hunting_plan_members)
    await supabase.from('hunting_plans').delete().eq('id', huntId)

    // Update local state
    setHunts(prev => prev.filter(h => h.id !== huntId))
    setHuntLocations(prev => {
      const next = { ...prev }
      delete next[huntId]
      return next
    })
    setHuntMembers(prev => {
      const next = { ...prev }
      delete next[huntId]
      return next
    })
    setExpandedHuntId(null)
    setDeletingHuntId(null)
    setDeletingInProgress(false)
  }

  async function updateHuntStatus(huntId: string, newStatus: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('hunting_plans')
      .update({ status: newStatus as 'planning' | 'applied' | 'booked' | 'completed' | 'cancelled' })
      .eq('id', huntId)
    if (!error) {
      setHunts(prev => prev.map(h => h.id === huntId ? { ...h, status: newStatus } : h))
    }
  }

  async function generateLocationReport(loc: HuntLocation) {
    scoutAbortRef.current = new AbortController()
    setGeneratingReportId(loc.id)
    setScoutError(null)
    setScoutStep('Checking quota…')


    await new Promise(r => setTimeout(r, 400))
    setScoutStep('Building scout prompt…')

    await new Promise(r => setTimeout(r, 500))
    setScoutStep('Asking Claude for intel…')

    try {
      const res = await fetch('/api/hunting/scout-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: loc.id }),
        signal: scoutAbortRef.current.signal,
      })

      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        setScoutError({ locId: loc.id, msg: `Server error (${res.status}) — check that migrations are applied and ANTHROPIC_API_KEY is set.` })
        return
      }

      if (data.error === 'quota_exceeded' || data.error === 'ai_unavailable') {
        setScoutError({ locId: loc.id, msg: data.message as string })
        return
      }

      if (!res.ok || (!data.report && !data.sections)) {
        setScoutError({ locId: loc.id, msg: (data.error as string) || `Unexpected error — status ${res.status}` })
        return
      }

      setScoutStep('Saving report…')
      setHuntLocations(prev => ({
        ...prev,
        [loc.hunt_plan_id]: (prev[loc.hunt_plan_id] ?? []).map(l =>
          l.id === loc.id
            ? {
                ...l,
                scout_report: {
                  text: (data.report as string) ?? '',
                  sections: Array.isArray(data.sections) ? data.sections as { key: string; title: string; rows: { label: string; value: string }[] }[] : [],
                  pois: Array.isArray(data.pois) ? data.pois as { label: string; lat: number; lng: number; type: string }[] : [],
                  truncated: data.truncated === true,
                  generated_at: new Date().toISOString(),
                },
              }
            : l
        ),
      }))
      // Auto-expand the report so the user sees it immediately
      setExpandedReportId(loc.id)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setScoutError({ locId: loc.id, msg: 'Request failed — check your connection and try again.' })
      }
    } finally {
      scoutAbortRef.current = null
      setGeneratingReportId(null)
      setScoutStep('')
    }
  }

  const inputClass = "bg-elevated border border-default text-primary rounded px-3 py-2 text-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-ring placeholder:text-muted w-full"
  const canProceed = form.hunt_type !== ''
  const canSave = !!(form.title && form.state && form.species)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading hunts...
      </div>
    )
  }

  return (
    <>
    <AIProgressModal
      open={!!generatingReportId}
      featureLabel="Scout Report"
      steps={['Checking quota…', 'Building scout prompt…', 'Asking Claude for intel…', 'Saving report…']}
    />
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tent className="h-5 w-5 text-accent-hover" />
          <div>
            <h1 className="text-2xl font-bold text-primary">My Hunts</h1>
            <p className="text-secondary text-sm">Plan and track your upcoming adventures.</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={openNewForm}
            className="flex items-center gap-2 btn-primary font-semibold rounded px-4 py-2 text-sm transition-colors">
            <Plus className="h-4 w-4" /> New Hunt
          </button>
        )}
      </div>

      {/* ── New Hunt Form ─────────────────────────────────────── */}
      {showForm && (
        <div className="glass-card border border-subtle rounded-lg mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
            <h2 className="text-primary font-semibold">
              {editingHuntId ? 'Edit Hunt' : step === 1 ? 'Choose Hunt Type' : 'Hunt Details'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditingHuntId(null) }} className="text-muted hover:text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step 1 — Hunt type */}
          {step === 1 && (
            <div className="p-5">
              <p className="text-secondary text-sm mb-4">What kind of hunt is this? This determines what we ask next.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                {HUNT_TYPES.map(ht => (
                  <button key={ht.value} type="button"
                    onClick={() => setForm(p => ({ ...p, hunt_type: ht.value }))}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      form.hunt_type === ht.value
                        ? 'bg-accent-dim border-accent text-primary'
                        : 'bg-elevated border-default text-secondary hover:border-strong hover:text-primary'
                    }`}>
                    <p className="font-semibold text-sm mb-1">{ht.label}</p>
                    <p className="text-xs text-muted">{ht.desc}</p>
                    {ht.note && (
                      <p className={`text-xs mt-2 ${form.hunt_type === ht.value ? 'text-accent-hover' : 'text-muted'}`}>
                        ↳ {ht.note}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} disabled={!canProceed}
                  className="flex items-center gap-2 btn-primary disabled:bg-elevated disabled:text-muted font-semibold rounded px-5 py-2 text-sm transition-colors">
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Hunt details */}
          {step === 2 && (
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-elevated text-secondary border border-default rounded px-2 py-0.5">
                  {TYPE_LABELS[form.hunt_type]}
                </span>
                <button onClick={() => setStep(1)} className="text-xs text-muted hover:text-secondary transition-colors">
                  (change)
                </button>
              </div>

              {/* Basic info */}
              <div>
                <label className="block text-muted text-xs mb-1">Hunt Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.title}
                  onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setSaveError(null) }}
                  className={inputClass} placeholder="e.g. CO Elk 2026 — Unit 85" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted text-xs mb-1">State <span className="text-red-500">*</span></label>
                  <TacticalSelect
                    value={form.state}
                    onChange={v => setForm(p => ({ ...p, state: v }))}
                    options={US_STATES.map(s => ({ value: s.value, label: `${s.value} — ${s.label}` }))}
                    placeholder="— Select —"
                  />
                </div>
                <div>
                  <label className="block text-muted text-xs mb-1">Species <span className="text-red-500">*</span></label>
                  <TacticalSelect
                    value={form.species}
                    onChange={v => setForm(p => ({ ...p, species: v }))}
                    options={SPECIES}
                    placeholder="— Select —"
                  />
                </div>
                <div>
                  <label className="block text-muted text-xs mb-1">Weapon</label>
                  <TacticalSelect
                    value={form.season}
                    onChange={v => setForm(p => ({ ...p, season: v }))}
                    options={WEAPONS}
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted text-xs mb-1">Unit / GMU</label>
                <input type="text" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  className={inputClass} placeholder="e.g. 85" />
              </div>

              <div>
                <label className="block text-muted text-xs mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className={`${inputClass} resize-none h-20`} placeholder="Goals, access notes, gear considerations..." />
              </div>

              {/* ── Emergency Contact ────────────────────────────── */}
              <div className="border-t border-subtle pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400/70" />
                  <span className="text-primary text-sm font-medium">Emergency Contact</span>
                </div>
                <p className="text-muted text-xs">Who should be contacted in an emergency? This will appear on the shared PDF.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-muted text-xs mb-1">Contact Name</label>
                    <input type="text" value={form.emergency_contact_name}
                      onChange={e => setForm(p => ({ ...p, emergency_contact_name: e.target.value }))}
                      className={inputClass} placeholder="e.g. Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-muted text-xs mb-1">Contact Phone</label>
                    <input type="tel" value={form.emergency_contact_phone}
                      onChange={e => setForm(p => ({ ...p, emergency_contact_phone: e.target.value }))}
                      className={inputClass} placeholder="e.g. (555) 123-4567" />
                  </div>
                </div>
              </div>

              {/* ── Hunt Party ──────────────────────────────────── */}
              <div className="border-t border-subtle pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted" />
                  <span className="text-primary text-sm font-medium">Hunt Party</span>
                </div>

                {form.hunt_type === 'group_draw' && (
                  <p className="text-amber-400/80 text-xs">
                    Reminder: Colorado group draws use the <strong>lowest member&apos;s points</strong> as the group&apos;s effective points.
                  </p>
                )}

                {/* Friend picker */}
                {!friendsLoaded ? (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading your circle…
                  </div>
                ) : friends.length === 0 ? (
                  <div className="bg-elevated border border-subtle rounded px-4 py-3 text-center">
                    <p className="text-muted text-xs">No confirmed friends yet.</p>
                    <a href="/hunting/community" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover mt-1 transition-colors">
                      <Link className="h-3 w-3" /> Build your circle in Community
                    </a>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={friendSearch}
                      onChange={e => setFriendSearch(e.target.value)}
                      placeholder="Search your circle…"
                      className="w-full bg-elevated border border-default text-primary rounded px-3 py-1.5 text-sm focus:border-accent focus:outline-none placeholder:text-muted mb-2"
                    />
                    <div className="bg-elevated border border-subtle rounded overflow-hidden max-h-40 overflow-y-auto">
                      {friends
                        .filter(f =>
                          !members.some(m => m.user_id === f.friend_id) &&
                          (friendSearch === '' ||
                            (f.display_name ?? '').toLowerCase().includes(friendSearch.toLowerCase()) ||
                            f.email.toLowerCase().includes(friendSearch.toLowerCase()))
                        )
                        .map(f => (
                          <button
                            key={f.friend_id}
                            type="button"
                            onClick={() => addFriendToParty(f)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-elevated border-b border-subtle last:border-0 transition-colors"
                          >
                            <span className="text-sm text-primary">{f.display_name || f.email}</span>
                            <span className="text-xs text-accent flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Add
                            </span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Added Scout members */}
                {members.length > 0 && (
                  <div className="space-y-1.5">
                    {members.map(m => (
                      <div key={m.tempId} className="flex items-center gap-2 bg-elevated border border-default rounded px-3 py-2">
                        <UserCheck className="h-3.5 w-3.5 text-accent-hover shrink-0" />
                        <span className="text-primary text-sm flex-1">{m.display_name}</span>
                        <span className="text-muted text-xs">{m.email}</span>
                        <span className="text-xs bg-accent-dim text-accent-hover border border-accent-border rounded px-1.5 py-0.5">Scout member</span>
                        <button type="button" onClick={() => removeMember(m.tempId)}
                          className="text-muted hover:text-red-400 transition-colors p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* External recipient input */}
                <div className="pt-1">
                  {addingExternal ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="email"
                        value={externalEmail}
                        onChange={e => setExternalEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmExternalRecipient()}
                        placeholder="Email for print recipient"
                        className="flex-1 bg-elevated border border-default text-primary rounded px-3 py-1.5 text-sm focus:border-accent focus:outline-none placeholder:text-muted"
                        autoFocus
                      />
                      <button type="button" onClick={confirmExternalRecipient}
                        className="text-xs bg-elevated hover:bg-elevated text-secondary rounded px-3 py-1.5 transition-colors">
                        Add
                      </button>
                      <button type="button" onClick={() => { setAddingExternal(false); setExternalEmail('') }}
                        className="text-muted hover:text-red-400 transition-colors p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setAddingExternal(true)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-secondary transition-colors">
                      <Mail className="h-3 w-3" /> Add non-Scout recipient (print only)
                    </button>
                  )}
                </div>
              </div>

              {/* ── Print / Share Recipients ─────────────────────── */}
              {printRecipients.length > 0 && (
                <div className="border-t border-subtle pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-muted" />
                    <span className="text-primary text-sm font-medium">Print / Share Recipients</span>
                  </div>
                  <p className="text-muted text-xs">
                    These people don&apos;t have Scout accounts. They&apos;ll receive a printable hunt plan summary by email. No live access.
                  </p>
                  {printRecipients.map(r => (
                    <div key={r.tempId} className="flex items-center gap-2 bg-elevated border border-default rounded px-3 py-2">
                      <Mail className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span className="text-secondary text-sm flex-1">{r.email}</span>
                      <span className="text-xs text-muted">Print only</span>
                      <button type="button" onClick={() => removePrintRecipient(r.tempId)}
                        className="text-muted hover:text-red-400 transition-colors p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save error */}
              {saveError && (
                <div className="flex items-start gap-2 p-3 rounded bg-red-950/40 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-subtle">
                <button onClick={() => { setShowForm(false); setEditingHuntId(null) }}
                  className="text-muted hover:text-primary text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={editingHuntId ? () => handleUpdate(editingHuntId) : handleSave} disabled={!canSave || saving}
                  className="flex items-center gap-2 btn-primary disabled:bg-elevated disabled:text-muted font-semibold rounded px-5 py-2 text-sm transition-colors">
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><CheckCircle className="h-4 w-4" /> {editingHuntId ? 'Update Hunt' : 'Save Hunt'}</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Hunt List ─────────────────────────────────────────── */}
      {hunts.length === 0 && !showForm ? (
        <div className="glass-card border border-subtle rounded-lg p-12 text-center">
          <Tent className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-primary font-medium mb-1">No hunts planned yet</p>
          <p className="text-muted text-sm mb-5">
            Create your first hunt plan to start organizing your season.
          </p>
          <button onClick={openNewForm}
            className="inline-flex items-center gap-2 btn-primary font-semibold rounded px-5 py-2.5 text-sm transition-colors">
            <Plus className="h-4 w-4" /> Plan a Hunt
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {hunts.map(hunt => {
            const isExpanded = expandedHuntId === hunt.id
            const members = huntMembers[hunt.id] ?? []
            const locations = huntLocations[hunt.id] ?? []

            return (
              <div key={hunt.id} className="glass-card border border-subtle rounded-lg transition-colors hover:border-default">
                {/* Card header — always visible */}
                <div
                  className="flex items-start justify-between gap-4 p-5 cursor-pointer"
                  onClick={() => {
                    const next = isExpanded ? null : hunt.id
                    setExpandedHuntId(next)
                    if (next) { loadHuntMembers(next); loadHuntLocations(next); loadUserGear(); initHuntGearList(hunt) }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-primary font-semibold">{hunt.title}</span>
                      <span className={`text-xs rounded border px-2 py-0.5 font-medium ${STATUS_STYLES[hunt.status] ?? STATUS_STYLES.planning}`}>
                        {STATUS_LABELS[hunt.status] ?? hunt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted text-xs flex-wrap mt-1">
                      {hunt.state && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {hunt.state_name || hunt.state}
                          {hunt.unit ? ` · Unit ${hunt.unit}` : ''}
                        </span>
                      )}
                      {hunt.species && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {SPECIES.find(s => s.value === hunt.species)?.label ?? hunt.species}
                        </span>
                      )}
                      {hunt.trip_start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(hunt.trip_start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {hunt.trip_end_date && hunt.trip_end_date !== hunt.trip_start_date && ` – ${new Date(hunt.trip_end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </span>
                      )}
                      {hunt.trip_start_date && (() => {
                        const daysUntil = Math.ceil((new Date(hunt.trip_start_date + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
                        if (daysUntil > 0 && daysUntil <= 90) return (
                          <span className={`font-medium ${daysUntil <= 14 ? 'text-amber-400' : 'text-secondary'}`}>
                            {daysUntil}d away
                          </span>
                        )
                        if (daysUntil === 0) return <span className="font-medium text-accent">Today!</span>
                        return null
                      })()}
                      {hunt.hunt_type && (
                        <span className="text-muted">{TYPE_LABELS[hunt.hunt_type] ?? hunt.hunt_type}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-subtle px-5 pb-5 pt-4 space-y-5">

                    {/* Action buttons + status — top of expanded panel */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <TacticalSelect
                        value={hunt.status}
                        onChange={(val) => updateHuntStatus(hunt.id, val)}
                        options={STATUS_ORDER.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                        className="w-36"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSharingHuntId(hunt.id)
                          setSharingHuntTitle(hunt.title)
                          setSharingRecipients(Array.isArray(hunt.print_recipients) ? (hunt.print_recipients as { email: string }[]) : [])
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded px-3 py-1.5 transition-colors"
                      >
                        <FileDown className="h-3.5 w-3.5" /> Share Plan
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setForm({
                            hunt_type: hunt.hunt_type ?? '',
                            title: hunt.title,
                            state: hunt.state,
                            species: hunt.species,
                            season: hunt.season,
                            unit: hunt.unit ?? '',
                            notes: hunt.notes ?? '',
                            emergency_contact_name: hunt.emergency_contact_name ?? '',
                            emergency_contact_phone: hunt.emergency_contact_phone ?? '',
                          })
                          setEditingHuntId(hunt.id)
                          setStep(2)
                          setShowForm(true)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary bg-elevated hover:bg-elevated rounded px-3 py-1.5 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit Hunt
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingHuntId(hunt.id)
                          setDeleteKeepPins(true)
                        }}
                        className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 bg-elevated hover:bg-elevated rounded px-3 py-1.5 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>

                    {/* Hunt details + Party — two-column layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Hunt & trip details */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          {hunt.unit && (
                            <div>
                              <span className="text-muted block mb-0.5">Unit</span>
                              <span className="text-primary">{hunt.unit}</span>
                            </div>
                          )}
                          {hunt.hunt_type && (
                            <div>
                              <span className="text-muted block mb-0.5">Type</span>
                              <span className="text-primary">{TYPE_LABELS[hunt.hunt_type] ?? hunt.hunt_type}</span>
                            </div>
                          )}
                          {hunt.trip_start_date && (
                            <div>
                              <span className="text-muted block mb-0.5">Trip Dates</span>
                              <span className="text-primary">
                                {new Date(hunt.trip_start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {hunt.trip_end_date && ` – ${new Date(hunt.trip_end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                              </span>
                            </div>
                          )}
                          {hunt.trip_days != null && (
                            <div>
                              <span className="text-muted block mb-0.5">Duration</span>
                              <span className="text-primary">{hunt.trip_days} day{hunt.trip_days !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {hunt.fly_or_drive && (
                            <div>
                              <span className="text-muted block mb-0.5">Travel</span>
                              <span className="text-primary capitalize">{hunt.fly_or_drive}</span>
                            </div>
                          )}
                          {hunt.budget && (
                            <div>
                              <span className="text-muted block mb-0.5">Budget</span>
                              <span className="text-primary">${hunt.budget}</span>
                            </div>
                          )}
                          {hunt.emergency_contact_name && (
                            <div className="col-span-2">
                              <span className="text-muted block mb-0.5">Emergency Contact</span>
                              <span className="text-primary">{hunt.emergency_contact_name}{hunt.emergency_contact_phone ? ` — ${hunt.emergency_contact_phone}` : ''}</span>
                            </div>
                          )}
                        </div>
                        {hunt.notes && (
                          <div>
                            <span className="text-muted text-xs block mb-0.5">Notes</span>
                            <p className="text-secondary text-xs">{hunt.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Hunt party */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-3.5 w-3.5 text-muted" />
                          <span className="text-secondary text-xs font-medium uppercase tracking-wide">Hunt Party</span>
                        </div>
                        {members.length === 0 ? (
                          <p className="text-muted text-xs">No party members added.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {members.map(m => (
                              <div key={m.id} className="flex items-center gap-2 text-xs">
                                <UserCircle className="h-3.5 w-3.5 text-muted shrink-0" />
                                <span className="text-primary">{m.display_name}</span>
                                <span className="text-xs text-muted bg-elevated rounded px-1.5 py-0.5 capitalize">{m.role}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Scout Locations ──────────────────────────────── */}
                    <div className="border-t border-subtle pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-accent-hover" />
                          <span className="text-secondary text-xs font-medium uppercase tracking-wide">Scout Locations</span>
                          {locations.length > 0 && (
                            <span className="text-xs text-muted bg-elevated rounded-full px-1.5 py-0.5">{locations.length}</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setAddingLocationForHunt(hunt.id)
                            setNewLocLabel(String.fromCharCode(65 + locations.length)) // A, B, C…
                            setNewLocDesc(''); setNewLocLat(''); setNewLocLng('')
                          }}
                          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                        >
                          <Plus className="h-3 w-3" /> Add Location
                        </button>
                      </div>

                      {/* Add location form */}
                      {addingLocationForHunt === hunt.id && (
                        <div className="mb-3 p-3 bg-elevated border border-default rounded-lg space-y-2">
                          <input
                            type="text"
                            value={newLocLabel}
                            onChange={e => setNewLocLabel(e.target.value)}
                            placeholder="Label (e.g. A, B, Camp Creek)"
                            className="w-full bg-elevated border border-default text-primary rounded px-2.5 py-1.5 text-xs focus:border-accent focus:outline-none placeholder:text-muted"
                          />
                          <input
                            type="text"
                            value={newLocDesc}
                            onChange={e => setNewLocDesc(e.target.value)}
                            placeholder="Description (drainage, landmark, road name…)"
                            className="w-full bg-elevated border border-default text-primary rounded px-2.5 py-1.5 text-xs focus:border-accent focus:outline-none placeholder:text-muted"
                          />
                          {/* Interactive map — click to drop pin */}
                          <LocationPickerMap
                            lat={newLocLat ? parseFloat(newLocLat) : null}
                            lng={newLocLng ? parseFloat(newLocLng) : null}
                            onPick={(lat, lng) => {
                              setNewLocLat(String(lat))
                              setNewLocLng(String(lng))
                            }}
                          />
                          {newLocLat && newLocLng && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted text-xs">{newLocLat}° N, {newLocLng}° W</span>
                              <button
                                type="button"
                                onClick={() => { setNewLocLat(''); setNewLocLng('') }}
                                className="text-xs text-muted hover:text-red-400 transition-colors"
                              >
                                Clear pin
                              </button>
                            </div>
                          )}
                          {locationSaveError && (
                            <p className="text-red-400 text-xs">{locationSaveError}</p>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => addHuntLocation(hunt.id)}
                                disabled={!newLocLabel.trim() && !newLocDesc.trim()}
                                className="text-xs btn-primary disabled:opacity-50 font-semibold rounded px-3 py-1.5 transition-colors"
                              >
                                Save Location
                              </button>
                              <button
                                onClick={() => { setAddingLocationForHunt(null); setLocationSaveError(null) }}
                                className="text-xs text-muted hover:text-primary transition-colors px-2"
                              >
                                Cancel
                              </button>
                            </div>
                            <button
                              onClick={() => saveAndScoutLocation(hunt.id)}
                              disabled={(!newLocLabel.trim() && !newLocDesc.trim()) || !newLocLat || !newLocLng}
                              title={!newLocLat || !newLocLng ? 'Drop a pin on the map to scout this location' : ''}
                              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 disabled:opacity-50 rounded px-3 py-1.5 transition-colors"
                            >
                              <Sparkles className="h-3 w-3" /> Scout
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Location list */}
                      {locations.length === 0 && addingLocationForHunt !== hunt.id && (
                        <p className="text-muted text-xs">No locations added yet. Add Location A, B, C to generate independent scout reports.</p>
                      )}
                      <div className="space-y-2">
                        {locations.map(loc => {
                          const isGenerating = generatingReportId === loc.id
                          const hasReport = !!loc.scout_report?.text
                          const reportExpanded = expandedReportId === loc.id
                          const isEditing = editingLocationId === loc.id
                          return (
                            <div key={loc.id} className="bg-elevated border border-subtle rounded-lg p-3">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editLocLabel}
                                    onChange={e => setEditLocLabel(e.target.value)}
                                    placeholder="Label (e.g. A, B, Camp Creek)"
                                    className="w-full bg-elevated border border-default text-primary rounded px-2.5 py-1.5 text-xs focus:border-accent focus:outline-none placeholder:text-muted"
                                  />
                                  <input
                                    type="text"
                                    value={editLocDesc}
                                    onChange={e => setEditLocDesc(e.target.value)}
                                    placeholder="Description (drainage, landmark, road name…)"
                                    className="w-full bg-elevated border border-default text-primary rounded px-2.5 py-1.5 text-xs focus:border-accent focus:outline-none placeholder:text-muted"
                                  />
                                  <LocationPickerMap
                                    lat={editLocLat ? parseFloat(editLocLat) : null}
                                    lng={editLocLng ? parseFloat(editLocLng) : null}
                                    onPick={(lat, lng) => {
                                      setEditLocLat(String(lat))
                                      setEditLocLng(String(lng))
                                    }}
                                  />
                                  {editLocLat && editLocLng && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted text-xs">{editLocLat}° N, {editLocLng}° W</span>
                                      <button
                                        type="button"
                                        onClick={() => { setEditLocLat(''); setEditLocLng('') }}
                                        className="text-xs text-muted hover:text-red-400 transition-colors"
                                      >
                                        Clear pin
                                      </button>
                                    </div>
                                  )}
                                  {locationSaveError && (
                                    <p className="text-red-400 text-xs">{locationSaveError}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => updateHuntLocation(loc.id, hunt.id)}
                                      disabled={!editLocLabel.trim() && !editLocDesc.trim()}
                                      className="text-xs btn-primary disabled:opacity-50 font-semibold rounded px-3 py-1.5 transition-colors"
                                    >
                                      Save Changes
                                    </button>
                                    <button
                                      onClick={() => setEditingLocationId(null)}
                                      className="text-xs text-muted hover:text-primary transition-colors px-2"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-primary text-xs font-semibold">{loc.label}</span>
                                    {hasReport && (
                                      <span className="text-xs text-accent-hover bg-accent-dim border border-accent-border rounded px-1.5 py-0.5">Report ready</span>
                                    )}
                                  </div>
                                  {loc.description && <p className="text-secondary text-xs truncate">{loc.description}</p>}
                                  {loc.lat && loc.lng && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-muted text-xs">{loc.lat}° N, {loc.lng}° W</span>
                                      <a
                                        href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-accent hover:text-accent-hover transition-colors"
                                      >
                                        <MapPin className="h-3 w-3 inline" /> Maps
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isGenerating && (
                                    <>
                                      <span className="flex items-center gap-1 text-xs text-secondary bg-elevated rounded px-2 py-1">
                                        <Loader2 className="h-3 w-3 animate-spin" /> {scoutStep || 'Working…'}
                                      </span>
                                      <button
                                        onClick={cancelScoutReport}
                                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-elevated hover:bg-elevated rounded px-2 py-1 transition-colors"
                                      >
                                        <X className="h-3 w-3" /> Cancel
                                      </button>
                                    </>
                                  )}
                                  {!isGenerating && loc.lat && loc.lng && (
                                    <button
                                      onClick={() => generateLocationReport(loc)}
                                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded px-3 py-1 transition-colors"
                                    >
                                      <Sparkles className="h-3 w-3" /> {hasReport ? 'Re-Scout' : 'Scout'}
                                    </button>
                                  )}
                                  {!isGenerating && (!loc.lat || !loc.lng) && !hasReport && (
                                    <span className="text-xs text-muted italic">Drop a pin to scout</span>
                                  )}
                                  {hasReport && !isGenerating && (
                                    <button
                                      onClick={() => setExpandedReportId(reportExpanded ? null : loc.id)}
                                      className="flex items-center gap-1.5 text-xs font-semibold text-accent-hover bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded px-3 py-1 transition-colors"
                                    >
                                      <FileText className="h-3 w-3" /> {reportExpanded ? 'Hide Report' : 'View Report'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => startEditLocation(loc)}
                                    className="text-muted hover:text-primary bg-elevated hover:bg-elevated rounded p-1 transition-colors"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteHuntLocation(loc.id, hunt.id)}
                                    className="text-muted hover:text-red-400 bg-elevated hover:bg-elevated rounded p-1 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              )}
                              {loc.lat != null && loc.lng != null && !isEditing && (
                                <LocationScoutMap
                                  lat={loc.lat}
                                  lng={loc.lng}
                                  pois={recoverPois(loc.scout_report) ?? loc.scout_report?.pois}
                                  existingPins={fieldMapPins}
                                  onAddPoi={(poi) => addPoiToFieldMap(poi, loc.hunt_plan_id, loc.id)}
                                  highlightedPoi={highlightedPoi}
                                />
                              )}
                              {scoutError?.locId === loc.id && (
                                <p className="mt-2 text-xs text-red-400">{scoutError.msg}</p>
                              )}
                              {reportExpanded && loc.scout_report && (
                                <div className="mt-3 pt-3 border-t border-subtle space-y-1.5">
                                  {/* Scout Report header */}
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Scout Report</span>
                                    {loc.scout_report.generated_at && (
                                      <span className="text-muted text-[10px]">
                                        {new Date(loc.scout_report.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                  {/* Truncation warning */}
                                  {loc.scout_report.truncated && (
                                    <div className="flex items-start gap-2 px-3 py-2 rounded bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs">
                                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                      <span>Partial result — the AI response was too long and some sections or map points may be missing. Re-run the scout report to try again.</span>
                                    </div>
                                  )}
                                  {/* POI list — above report sections, click to highlight on map */}
                                  {(() => {
                                    const resolvedPois = recoverPois(loc.scout_report) ?? loc.scout_report.pois ?? []
                                    if (resolvedPois.length === 0) return null
                                    return (
                                    <div className="border border-subtle rounded overflow-hidden">
                                      <button
                                        onClick={() => toggleSection(loc.id, '_pois')}
                                        className="group w-full flex items-center justify-between px-3 py-2.5 bg-elevated hover:bg-surface transition-colors text-left"
                                      >
                                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                                          Points of Interest ({resolvedPois.length})
                                        </span>
                                        {expandedSections[loc.id]?.has('_pois')
                                          ? <ChevronDown className="h-3.5 w-3.5 text-muted shrink-0 group-hover:text-secondary transition-colors" />
                                          : <ChevronRight className="h-3.5 w-3.5 text-muted shrink-0 group-hover:text-secondary transition-colors" />}
                                      </button>
                                      {expandedSections[loc.id]?.has('_pois') && (
                                        <div className="px-3 py-2.5 border-l-2 border-accent/30 ml-2 space-y-2">
                                          <div className="flex justify-end">
                                            <button
                                              onClick={() => addAllPoisToFieldMap(resolvedPois, loc.hunt_plan_id, loc.id)}
                                              className="flex items-center gap-1 text-xs border border-accent/40 text-accent hover:border-accent px-2 py-1 rounded-md transition-colors"
                                            >
                                              <MapPin className="h-3 w-3" />Add All to Field Map
                                            </button>
                                          </div>
                                          {resolvedPois.map((poi, pi) => {
                                            const poiKey = `${loc.id}:${poi.lat}:${poi.lng}`
                                            const isAdded = addedToMap.has(poiKey)
                                            const isAdding = addingToMap === poiKey
                                            const isHighlighted = highlightedPoi?.lat === poi.lat && highlightedPoi?.lng === poi.lng
                                            return (
                                              <div
                                                key={pi}
                                                className={`flex items-center justify-between gap-2 text-xs cursor-pointer rounded px-1.5 py-1 -mx-1.5 transition-colors ${isHighlighted ? 'bg-accent/15 border border-accent/30' : 'hover:bg-elevated border border-transparent'}`}
                                                onClick={() => setHighlightedPoi(isHighlighted ? null : { lat: poi.lat, lng: poi.lng })}
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span className="text-muted shrink-0">{POI_LABELS[poi.type] ?? poi.type}</span>
                                                  <span className="text-secondary truncate">{poi.label}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  {isAdded ? (
                                                    <span className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-md">
                                                      <CheckCircle className="h-3 w-3" /> Added
                                                    </span>
                                                  ) : (
                                                    <button
                                                      onClick={(e) => { e.stopPropagation(); addPoiToFieldMap(poi, loc.hunt_plan_id, loc.id) }}
                                                      disabled={isAdding}
                                                      className="flex items-center gap-1 bg-accent text-black font-semibold px-2.5 py-1 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 text-[11px]"
                                                    >
                                                      {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                                                      Add to Map
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                    )
                                  })()}
                                  {/* Report sections */}
                                  {(() => {
                                    const resolved = recoverSections(loc.scout_report)
                                    if (resolved && resolved.length > 0) {
                                      return (
                                        <>
                                          {resolved.map(section => {
                                            const isOpen = expandedSections[loc.id]?.has(section.key) ?? false
                                            return (
                                              <div key={section.key} className="border border-subtle rounded overflow-hidden">
                                                <button
                                                  onClick={() => toggleSection(loc.id, section.key)}
                                                  className="group w-full flex items-center justify-between px-3 py-2.5 bg-elevated hover:bg-surface transition-colors text-left"
                                                >
                                                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">{section.title}</span>
                                                  {isOpen
                                                    ? <ChevronDown className="h-3.5 w-3.5 text-muted shrink-0 group-hover:text-secondary transition-colors" />
                                                    : <ChevronRight className="h-3.5 w-3.5 text-muted shrink-0 group-hover:text-secondary transition-colors" />}
                                                </button>
                                                {isOpen && (
                                                  <div className="px-3 py-2.5 border-l-2 border-accent/30 ml-2 space-y-1.5">
                                                    {section.rows.map((row, ri) => (
                                                      <div key={ri} className="grid grid-cols-[120px_1fr] gap-2 text-xs">
                                                        <span className="text-muted">{row.label}</span>
                                                        <span className="text-secondary">{row.value}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </>
                                      )
                                    }
                                    if (loc.scout_report?.text) {
                                      return <pre className="text-secondary text-xs whitespace-pre-wrap font-sans leading-relaxed">{loc.scout_report.text}</pre>
                                    }
                                    return null
                                  })()}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* ── Gear List ────────────────────────────────────── */}
                    <div className="border-t border-subtle pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-accent-hover" />
                          <span className="text-secondary text-xs font-medium uppercase tracking-wide">Gear List</span>
                          {(huntGearList[hunt.id]?.length ?? 0) > 0 && (
                            <span className="text-xs text-muted bg-elevated rounded-full px-1.5 py-0.5">
                              {huntGearList[hunt.id]?.length} selected
                            </span>
                          )}
                        </div>
                        <a href="/hunting/gear" className="text-xs text-muted hover:text-accent-hover transition-colors">
                          Manage Gear →
                        </a>
                      </div>
                      {userGear.length === 0 && gearLoaded ? (
                        <p className="text-muted text-xs">
                          No gear in your inventory.{' '}
                          <a href="/hunting/gear" className="text-muted hover:text-primary underline">Add gear</a>{' '}
                          to build a packing list.
                        </p>
                      ) : !gearLoaded ? (
                        <p className="text-muted text-xs">Loading gear…</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-3 max-h-40 overflow-y-auto pr-1">
                            {userGear.map(g => {
                              const checked = (huntGearList[hunt.id] ?? []).includes(g.id)
                              return (
                                <label
                                  key={g.id}
                                  className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-xs transition-colors ${
                                    checked
                                      ? 'bg-accent-dim border border-accent-border text-primary'
                                      : 'bg-elevated border border-subtle text-secondary hover:border-default hover:text-secondary'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleGearItem(hunt.id, g.id)}
                                    className="accent-accent shrink-0"
                                  />
                                  <span className="truncate">{g.name}</span>
                                  {g.brand && <span className="text-muted shrink-0">{g.brand}</span>}
                                </label>
                              )
                            })}
                          </div>
                          <button
                            onClick={() => saveGearList(hunt.id)}
                            disabled={savingGear === hunt.id}
                            className="flex items-center gap-1 text-xs bg-elevated hover:bg-elevated disabled:opacity-50 text-secondary rounded px-3 py-1.5 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {savingGear === hunt.id ? 'Saving…' : 'Save Gear List'}
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>

    {/* ── Delete Hunt Confirmation Modal ─────────────────────────────────── */}
    {deletingHuntId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-surface border border-default rounded-lg shadow-xl max-w-sm w-full mx-4 p-5">
          <h3 className="text-primary font-semibold text-sm mb-2">Delete Hunt</h3>
          <p className="text-secondary text-xs mb-4">
            This will permanently delete this hunt plan, all locations, and gear selections. This cannot be undone.
          </p>

          <div className="mb-4">
            <p className="text-secondary text-xs font-medium mb-2">Scout pins on the Field Map:</p>
            <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
              <input
                type="radio"
                name="keepPins"
                checked={deleteKeepPins}
                onChange={() => setDeleteKeepPins(true)}
                className="accent-accent"
              />
              <span className="text-xs text-primary">Keep scout pins on my Field Map</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="keepPins"
                checked={!deleteKeepPins}
                onChange={() => setDeleteKeepPins(false)}
                className="accent-accent"
              />
              <span className="text-xs text-primary">Delete scout pins too</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => deleteHuntPlan(deletingHuntId, deleteKeepPins)}
              disabled={deletingInProgress}
              className="flex-1 text-xs font-semibold bg-red-900/50 hover:bg-red-900/70 text-red-300 border border-red-800/50 rounded px-3 py-2 transition-colors disabled:opacity-50"
            >
              {deletingInProgress ? 'Deleting…' : 'Delete Hunt'}
            </button>
            <button
              onClick={() => setDeletingHuntId(null)}
              disabled={deletingInProgress}
              className="flex-1 text-xs text-secondary hover:text-primary bg-elevated border border-subtle rounded px-3 py-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Share Hunt Plan Modal ───────────────────────────────────────── */}
    <ShareHuntModal
      open={!!sharingHuntId}
      onClose={() => setSharingHuntId(null)}
      huntId={sharingHuntId ?? ''}
      huntTitle={sharingHuntTitle}
      existingRecipients={sharingRecipients}
    />
    </>
  )
}

// ─── Page wrapper with Suspense for useSearchParams ───────────────────────────

export default function HuntsPage() {
  return (
    <Suspense fallback={<div className="text-muted text-sm py-12 text-center">Loading...</div>}>
      <HuntsInner />
    </Suspense>
  )
}
