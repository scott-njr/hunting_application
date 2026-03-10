import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type HunterProfile = {
  id: string
  display_name: string | null
  home_state: string | null
  residency_state: string | null
  experience_level: string | null
  years_hunting: number | null
  physical_condition: string | null
  annual_budget: string | null
  states_of_interest: string[]
  target_species: string[]
  hunt_styles: string[]
  weapon_types: string[]
  looking_for_buddy: boolean
  willing_to_mentor: boolean
  buddy_bio: string | null
  avatar_url: string | null
  is_verified: boolean
}

export type BuddyMatch = {
  user_id: string
  display_name: string | null
  home_state: string | null
  experience_level: string | null
  years_hunting: number | null
  states_of_interest: string[]
  target_species: string[]
  hunt_styles: string[]
  willing_to_mentor: boolean
  looking_for_buddy: boolean
  buddy_bio: string | null
  avatar_url: string | null
  is_verified: boolean
  score: number
  overlap_reasons: string[]
  social_facebook: string | null
  social_instagram: string | null
  social_x: string | null
}

const STATE_LABELS: Record<string, string> = {
  CO: 'Colorado', MT: 'Montana', WY: 'Wyoming', ID: 'Idaho',
  NV: 'Nevada', UT: 'Utah', AZ: 'Arizona', NM: 'New Mexico',
  OR: 'Oregon', WA: 'Washington', AK: 'Alaska',
}

const SPECIES_LABELS: Record<string, string> = {
  elk: 'Elk', mule_deer: 'Mule Deer', whitetail: 'Whitetail',
  pronghorn: 'Pronghorn', black_bear: 'Bear', bighorn_sheep: 'Bighorn',
  mountain_goat: 'Mtn Goat', moose: 'Moose', turkey: 'Turkey',
}

const STYLE_LABELS: Record<string, string> = {
  diy_public: 'DIY Public', backpack: 'Backpack', solo: 'Solo',
  guided: 'Guided', camp_based: 'Camp', horse_pack: 'Horse Pack',
}

function overlap(a: string[], b: string[]): string[] {
  const setB = new Set(b)
  return a.filter(x => setB.has(x))
}

function scoreBuddy(me: HunterProfile, candidate: HunterProfile): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // States overlap (3 pts each)
  const stateOverlap = overlap(me.states_of_interest, candidate.states_of_interest)
  score += stateOverlap.length * 3
  for (const s of stateOverlap.slice(0, 2)) {
    reasons.push(STATE_LABELS[s] ?? s)
  }

  // Species overlap (2 pts each)
  const speciesOverlap = overlap(me.target_species, candidate.target_species)
  score += speciesOverlap.length * 2
  for (const s of speciesOverlap.slice(0, 2)) {
    reasons.push(SPECIES_LABELS[s] ?? s)
  }

  // Hunt styles overlap (2 pts each)
  const styleOverlap = overlap(me.hunt_styles, candidate.hunt_styles)
  score += styleOverlap.length * 2
  for (const s of styleOverlap.slice(0, 1)) {
    reasons.push(STYLE_LABELS[s] ?? s)
  }

  // Weapon overlap (1 pt each)
  score += overlap(me.weapon_types, candidate.weapon_types).length

  // Same physical condition (3 pts)
  if (me.physical_condition && me.physical_condition === candidate.physical_condition) {
    score += 3
  }

  // Same budget tier (2 pts)
  if (me.annual_budget && me.annual_budget === candidate.annual_budget) {
    score += 2
  }

  // Same home state (2 pts)
  const myHome = me.home_state ?? me.residency_state
  const theirHome = candidate.home_state ?? candidate.residency_state
  if (myHome && myHome === theirHome) {
    score += 2
  }

  // Mentor bonus (5 pts) — if I'm beginner/intermediate and they mentor
  if (
    candidate.willing_to_mentor &&
    (me.experience_level === 'beginner' || me.experience_level === 'intermediate')
  ) {
    score += 5
    reasons.push('Mentor')
  }

  return { score, reasons }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current user's profile
  const { data: myProfile } = await supabase
    .from('hunter_profiles')
    .select('id, display_name, home_state, residency_state, experience_level, years_hunting, physical_condition, annual_budget, states_of_interest, target_species, hunt_styles, weapon_types, looking_for_buddy, willing_to_mentor, buddy_bio, avatar_url, is_verified')
    .eq('id', user.id)
    .maybeSingle()

  if (!myProfile) {
    return NextResponse.json({ matches: [], mentors: [], incomplete_profile: true })
  }

  if (!myProfile.is_verified) {
    return NextResponse.json({ matches: [], mentors: [], not_verified: true })
  }

  if (!myProfile.states_of_interest?.length && !myProfile.target_species?.length) {
    return NextResponse.json({ matches: [], mentors: [], incomplete_profile: true })
  }

  // Get existing friend IDs to exclude
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const excludeIds = new Set<string>([user.id])
  for (const f of friendships ?? []) {
    excludeIds.add(f.requester_id === user.id ? f.recipient_id : f.requester_id)
  }

  // Get buddy candidates (verified, opted in)
  const { data: candidates } = await supabase
    .from('hunter_profiles')
    .select('id, display_name, home_state, residency_state, experience_level, years_hunting, physical_condition, annual_budget, states_of_interest, target_species, hunt_styles, weapon_types, looking_for_buddy, willing_to_mentor, buddy_bio, avatar_url, is_verified, social_facebook, social_instagram, social_x')
    .eq('is_verified', true)
    .or('looking_for_buddy.eq.true,willing_to_mentor.eq.true')

  if (!candidates) {
    return NextResponse.json({ matches: [], mentors: [] })
  }

  const scored: BuddyMatch[] = []
  for (const c of candidates) {
    if (excludeIds.has(c.id)) continue

    const { score, reasons } = scoreBuddy(myProfile as HunterProfile, c as HunterProfile)
    if (score > 0) {
      scored.push({
        user_id: c.id,
        display_name: c.display_name,
        home_state: c.home_state ?? c.residency_state,
        experience_level: c.experience_level,
        years_hunting: c.years_hunting,
        states_of_interest: c.states_of_interest ?? [],
        target_species: c.target_species ?? [],
        hunt_styles: c.hunt_styles ?? [],
        willing_to_mentor: c.willing_to_mentor,
        looking_for_buddy: c.looking_for_buddy,
        buddy_bio: c.buddy_bio,
        avatar_url: c.avatar_url,
        is_verified: c.is_verified,
        score,
        overlap_reasons: reasons.slice(0, 4),
        social_facebook: c.social_facebook ?? null,
        social_instagram: c.social_instagram ?? null,
        social_x: c.social_x ?? null,
      })
    }
  }

  scored.sort((a, b) => b.score - a.score)

  const matches = scored.filter(m => m.looking_for_buddy).slice(0, 5)
  const mentors = scored.filter(m => m.willing_to_mentor).slice(0, 3)

  return NextResponse.json({ matches, mentors })
}
