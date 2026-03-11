// Shared constants for profile and onboarding forms

export const US_STATES = [
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

export const SEASONS = [
  { value: 'archery', label: 'Archery' },
  { value: 'rifle', label: 'Rifle' },
  { value: 'muzzleloader', label: 'Muzzleloader' },
  { value: 'shotgun', label: 'Shotgun / Slug' },
]

export const SPECIES = [
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

export const HUNT_STYLES = [
  { value: 'diy_public', label: 'DIY Public Land' },
  { value: 'guided', label: 'Guided' },
  { value: 'outfitter', label: 'Outfitter / Lodge' },
  { value: 'solo', label: 'Solo' },
  { value: 'backpack', label: 'Backpack' },
  { value: 'horse_pack', label: 'Horse Pack' },
  { value: 'camp_based', label: 'Camp-Based' },
  { value: 'day_hunt', label: 'Day Hunts' },
  { value: 'atv_accessible', label: 'ATV Accessible' },
]

export const SEASON_OPTS = [
  { value: 'general', label: 'General' },
  { value: 'archery', label: 'Archery' },
  { value: 'rifle', label: 'Rifle' },
  { value: 'muzzleloader', label: 'Muzzleloader' },
  { value: 'shotgun', label: 'Shotgun' },
]

export const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'New to this — ready to learn' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience — looking to level up' },
  { value: 'experienced', label: 'Experienced', desc: 'Years of field experience' },
  { value: 'expert', label: 'Expert', desc: 'Seasoned — here for community and tools' },
] as const

export const FITNESS_OPTIONS = [
  { value: 'just_starting', label: 'Just Starting Out', desc: 'Getting back into it or brand new' },
  { value: 'moderately_active', label: 'Moderately Active', desc: 'Regular activity, room to grow' },
  { value: 'very_active', label: 'Very Active', desc: 'Consistent training schedule' },
  { value: 'competitive', label: 'Competitive', desc: 'Training for events or competitions' },
] as const

export const PHYSICAL_CONDITION_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strenuous', label: 'Strenuous' },
  { value: 'extreme', label: 'Extreme' },
]
