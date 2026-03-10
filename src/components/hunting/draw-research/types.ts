export type WizardInputs = {
  state: string
  species: string
  season: string // rifle | archery | muzzleloader
  residency: string // resident | nonresident
  transportation: string[] // atv, horses, backpack, truck_road
  tripStyle: string[] // day_hunt, base_camp, spike_camp, backcountry, hotel
  priorities: string[] // trophy, draw_odds, solitude, access, amenities, affordable
  notes: string
}

export type AutoContext = {
  points: { state: string; species: string; points: number; point_type: string }[]
  physicalCondition: string | null
  experienceLevel: string | null
  residencyState: string | null
  yearsHunting: number | null
  weaponTypes: string[] | null
  statesOfInterest: string[] | null
  targetSpecies: string[] | null
  baselineTest: {
    run_time_seconds: number
    pushups: number
    situps: number
    pullups: number
    tested_at: string
  } | null
}

export type SuggestedHuntCode = {
  code: string // e.g., "E-E-076-O1-R"
  description: string // "Bull elk, 1st rifle, Unit 76"
  verified: false // Always false — user must verify
}

export type DrawStrategy = {
  choicePosition: '1st' | '2nd' | '3rd'
  reasoning: string // "Put Unit 76 as 1st choice because..."
  pairedWith: string | null // "Use Unit 61 as your 2nd choice"
}

export type UnitRecommendation = {
  rank: number
  unitNumber: string
  state: string
  score: number // 1-100
  drawOddsEstimate: string // "~45% with 4 pts"
  drawStrategy: DrawStrategy
  suggestedHuntCodes: SuggestedHuntCode[]
  successRate: string
  terrainDifficulty: string // Moderate, Strenuous, Extreme
  highlights: string[]
  fishingNotes: string | null
  amenityNotes: string | null
  pros: string[]
  cons: string[]
  reasoning: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type DrawResearchReport = {
  id: string
  title: string
  state: string
  species: string
  season: string | null
  wizardInputs: WizardInputs
  recommendations: UnitRecommendation[]
  summary: string | null
  chatHistory: ChatMessage[]
  userRankings: string[] | null // ordered unit numbers
  status: 'draft' | 'final' | 'shared'
  sharedWith: string[]
  createdAt: string
  updatedAt: string
}

export const STATE_OPTIONS = [
  { value: 'CO', label: 'Colorado' },
  { value: 'MT', label: 'Montana' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'ID', label: 'Idaho' },
  { value: 'NV', label: 'Nevada' },
  { value: 'UT', label: 'Utah' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'OR', label: 'Oregon' },
  { value: 'WA', label: 'Washington' },
  { value: 'SD', label: 'South Dakota' },
]

export const SPECIES_OPTIONS = [
  { value: 'elk', label: 'Elk' },
  { value: 'mule_deer', label: 'Mule Deer' },
  { value: 'pronghorn', label: 'Pronghorn' },
  { value: 'bighorn_sheep', label: 'Bighorn Sheep' },
  { value: 'moose', label: 'Moose' },
  { value: 'mountain_goat', label: 'Mountain Goat' },
  { value: 'whitetail', label: 'Whitetail Deer' },
]

export const SEASON_OPTIONS = [
  { value: 'rifle', label: 'Rifle' },
  { value: 'archery', label: 'Archery' },
  { value: 'muzzleloader', label: 'Muzzleloader' },
]

export const RESIDENCY_OPTIONS = [
  { value: 'resident', label: 'Resident' },
  { value: 'nonresident', label: 'Non-Resident' },
]

export const TRANSPORTATION_OPTIONS = [
  { value: 'truck_road', label: 'Truck / Road Access' },
  { value: 'atv', label: 'ATV / UTV' },
  { value: 'horses', label: 'Horses / Pack Animals' },
  { value: 'backpack', label: 'Backpack Only' },
]

export const TRIP_STYLE_OPTIONS = [
  { value: 'day_hunt', label: 'Day Hunt from Town' },
  { value: 'base_camp', label: 'Base Camp' },
  { value: 'spike_camp', label: 'Spike Camp' },
  { value: 'backcountry', label: 'Backcountry' },
  { value: 'hotel', label: 'Hotel / Lodge' },
]

export const PRIORITY_OPTIONS = [
  { value: 'draw_odds', label: 'High Draw Odds' },
  { value: 'trophy', label: 'Trophy Quality' },
  { value: 'solitude', label: 'Solitude / Low Pressure' },
  { value: 'access', label: 'Easy Access' },
  { value: 'amenities', label: 'Nearby Amenities (fishing, town)' },
  { value: 'affordable', label: 'Affordable' },
]
