import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, withHandler, serverError } from '@/lib/api-response'

type MergedProfile = {
  id: string
  display_name: string | null
  user_name: string | null
  state: string | null
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
  social_facebook: string | null
  social_instagram: string | null
  social_x: string | null
}

export type BuddyMatch = {
  user_id: string
  display_name: string | null
  user_name: string | null
  state: string | null
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

function scoreBuddy(me: MergedProfile, candidate: MergedProfile): { score: number; reasons: string[] } {
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
  if (me.state && me.state === candidate.state) {
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

export const GET = withHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return unauthorized()
  }

  // Get current user's profile from both tables
  const [{ data: myUserProfile }, { data: myHuntingProfile }] = await Promise.all([
    supabase
      .from('user_profile')
      .select('id, display_name, user_name, state, physical_condition, avatar_url, is_verified, social_facebook, social_instagram, social_x')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('hunting_profile')
      .select('id, experience_level, years_hunting, annual_budget, states_of_interest, target_species, hunt_styles, weapon_types, looking_for_buddy, willing_to_mentor, buddy_bio')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!myUserProfile || !myHuntingProfile) {
    return apiOk({ matches: [], mentors: [], incomplete_profile: true })
  }

  if (!myUserProfile.is_verified) {
    return apiOk({ matches: [], mentors: [], not_verified: true })
  }

  if (!myHuntingProfile.states_of_interest?.length && !myHuntingProfile.target_species?.length) {
    return apiOk({ matches: [], mentors: [], incomplete_profile: true })
  }

  const myProfile: MergedProfile = {
    ...myUserProfile,
    ...myHuntingProfile,
    id: myUserProfile.id,
    user_name: myUserProfile.user_name ?? null,
    state: myUserProfile.state,
    states_of_interest: myHuntingProfile.states_of_interest ?? [],
    target_species: myHuntingProfile.target_species ?? [],
    hunt_styles: myHuntingProfile.hunt_styles ?? [],
    weapon_types: myHuntingProfile.weapon_types ?? [],
  }

  // Get existing friend IDs to exclude
  const { data: friendships } = await supabase
    .from('social_friendships')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const excludeIds = new Set<string>([user.id])
  for (const f of friendships ?? []) {
    excludeIds.add(f.requester_id === user.id ? f.recipient_id : f.requester_id)
  }

  // Get buddy candidates from both tables
  const [{ data: candidateUserProfiles }, { data: candidateHuntingProfiles }] = await Promise.all([
    supabase
      .from('user_profile')
      .select('id, display_name, user_name, state, physical_condition, avatar_url, is_verified, social_facebook, social_instagram, social_x')
      .eq('is_verified', true),
    supabase
      .from('hunting_profile')
      .select('id, experience_level, years_hunting, annual_budget, states_of_interest, target_species, hunt_styles, weapon_types, looking_for_buddy, willing_to_mentor, buddy_bio')
      .or('looking_for_buddy.eq.true,willing_to_mentor.eq.true'),
  ])

  if (!candidateUserProfiles || !candidateHuntingProfiles) {
    return apiOk({ matches: [], mentors: [] })
  }

  // Build map of user profiles by id
  const userProfileMap = new Map((candidateUserProfiles).map(p => [p.id, p]))

  // Merge hunting profiles with user profiles, only keeping candidates that exist in both
  const scored: BuddyMatch[] = []
  for (const hp of candidateHuntingProfiles) {
    if (excludeIds.has(hp.id)) continue
    const up = userProfileMap.get(hp.id)
    if (!up) continue

    const candidate: MergedProfile = {
      ...up,
      ...hp,
      id: hp.id,
      user_name: up.user_name ?? null,
      state: up.state,
      states_of_interest: hp.states_of_interest ?? [],
      target_species: hp.target_species ?? [],
      hunt_styles: hp.hunt_styles ?? [],
      weapon_types: hp.weapon_types ?? [],
    }

    const { score, reasons } = scoreBuddy(myProfile, candidate)
    if (score > 0) {
      scored.push({
        user_id: candidate.id,
        display_name: candidate.display_name,
        user_name: candidate.user_name ?? null,
        state: candidate.state,
        experience_level: candidate.experience_level,
        years_hunting: candidate.years_hunting,
        states_of_interest: candidate.states_of_interest,
        target_species: candidate.target_species,
        hunt_styles: candidate.hunt_styles,
        willing_to_mentor: candidate.willing_to_mentor,
        looking_for_buddy: candidate.looking_for_buddy,
        buddy_bio: candidate.buddy_bio,
        avatar_url: candidate.avatar_url,
        is_verified: candidate.is_verified,
        score,
        overlap_reasons: reasons.slice(0, 4),
        social_facebook: candidate.social_facebook ?? null,
        social_instagram: candidate.social_instagram ?? null,
        social_x: candidate.social_x ?? null,
      })
    }
  }

  scored.sort((a, b) => b.score - a.score)

  const matches = scored.filter(m => m.looking_for_buddy).slice(0, 5)
  const mentors = scored.filter(m => m.willing_to_mentor).slice(0, 3)

  return apiOk({ matches, mentors })
})

