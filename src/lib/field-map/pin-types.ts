// Pin type definitions for the Journal mapping feature
// Modeled after onX Hunt waypoint categories

export type PinGroup = 'Sightings' | 'Sign' | 'Infrastructure' | 'Terrain' | 'Reference' | 'Custom'

export type PinTypeDefinition = {
  value: string
  label: string
  group: PinGroup
  color: string
}

export const PIN_GROUPS: PinGroup[] = ['Sightings', 'Sign', 'Infrastructure', 'Terrain', 'Reference', 'Custom']

export const PIN_TYPES: PinTypeDefinition[] = [
  // Sightings
  { value: 'buck',         label: 'Buck',          group: 'Sightings', color: '#d4a843' },
  { value: 'doe',          label: 'Doe',           group: 'Sightings', color: '#c49a3a' },
  { value: 'bull_elk',     label: 'Bull Elk',      group: 'Sightings', color: '#7c9a6e' },
  { value: 'cow_elk',      label: 'Cow Elk',       group: 'Sightings', color: '#6b8a5e' },
  { value: 'turkey',       label: 'Turkey',        group: 'Sightings', color: '#e67e22' },
  { value: 'bear',         label: 'Bear',          group: 'Sightings', color: '#c0392b' },
  { value: 'other_animal', label: 'Other Animal',  group: 'Sightings', color: '#6b7280' },

  // Sign
  { value: 'scrape',       label: 'Scrape',        group: 'Sign', color: '#8B6914' },
  { value: 'rub',          label: 'Rub',           group: 'Sign', color: '#8B6914' },
  { value: 'tracks',       label: 'Tracks / Trail',group: 'Sign', color: '#8B6914' },
  { value: 'scat',         label: 'Scat',          group: 'Sign', color: '#8B6914' },
  { value: 'bedding',      label: 'Bedding Area',  group: 'Sign', color: '#a0845c' },
  { value: 'shed',         label: 'Shed Antler',   group: 'Sign', color: '#d4a843' },

  // Infrastructure
  { value: 'trail_cam',    label: 'Trail Camera',  group: 'Infrastructure', color: '#3b82f6' },
  { value: 'stand',        label: 'Stand / Blind', group: 'Infrastructure', color: '#22c55e' },
  { value: 'food_plot',    label: 'Food Plot',     group: 'Infrastructure', color: '#22c55e' },
  { value: 'feeder',       label: 'Feeder',        group: 'Infrastructure', color: '#22c55e' },

  // Terrain
  { value: 'water',        label: 'Water Source',  group: 'Terrain', color: '#06b6d4' },
  { value: 'crossing',     label: 'Crossing',      group: 'Terrain', color: '#06b6d4' },
  { value: 'pinch_point',  label: 'Pinch Point',   group: 'Terrain', color: '#eab308' },
  { value: 'glassing',     label: 'Glassing Point',group: 'Terrain', color: '#eab308' },
  { value: 'access',       label: 'Access / Gate', group: 'Terrain', color: '#e5e7eb' },
  { value: 'parking',      label: 'Parking',       group: 'Terrain', color: '#e5e7eb' },
  { value: 'camp',         label: 'Camp',          group: 'Terrain', color: '#e5e7eb' },

  // Reference (scout-sourced + manual)
  { value: 'emergency',    label: 'Emergency',     group: 'Reference', color: '#ef4444' },
  { value: 'hazard',       label: 'Hazard',        group: 'Reference', color: '#f97316' },
  { value: 'town',         label: 'Town / Supply',  group: 'Reference', color: '#a78bfa' },
  { value: 'processor',    label: 'Meat Processor', group: 'Reference', color: '#d97706' },

  // Custom
  { value: 'note',         label: 'Note',          group: 'Custom', color: '#6b7280' },
]

export const PIN_COLORS: Record<string, string> = Object.fromEntries(
  PIN_TYPES.map(p => [p.value, p.color])
)

export function getPinType(value: string): PinTypeDefinition | undefined {
  return PIN_TYPES.find(p => p.value === value)
}

export function getPinLabel(value: string): string {
  return getPinType(value)?.label ?? value
}

export function getPinColor(value: string): string {
  return PIN_COLORS[value] ?? '#6b7280'
}

// ─── Type-specific metadata field definitions ───────────────────────────────

export type MetadataFieldType = 'select' | 'number' | 'text' | 'date' | 'boolean'

export type MetadataField = {
  key: string
  label: string
  type: MetadataFieldType
  options?: { value: string; label: string }[]
  placeholder?: string
}

const FRESHNESS_OPTIONS = [
  { value: 'fresh', label: 'Fresh (< 24h)' },
  { value: 'moderate', label: 'Moderate (1–3 days)' },
  { value: 'old', label: 'Old (3+ days)' },
]

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

const DIRECTION_OPTIONS = [
  { value: 'N', label: 'N' },  { value: 'NE', label: 'NE' },
  { value: 'E', label: 'E' },  { value: 'SE', label: 'SE' },
  { value: 'S', label: 'S' },  { value: 'SW', label: 'SW' },
  { value: 'W', label: 'W' },  { value: 'NW', label: 'NW' },
]

const BEHAVIOR_OPTIONS = [
  { value: 'feeding', label: 'Feeding' },
  { value: 'bedded', label: 'Bedded' },
  { value: 'traveling', label: 'Traveling' },
  { value: 'watering', label: 'Watering' },
  { value: 'rutting', label: 'Rutting' },
  { value: 'spooked', label: 'Spooked' },
  { value: 'standing', label: 'Standing' },
]

const ACTIVITY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const SIGHTING_FIELDS: MetadataField[] = [
  { key: 'animal_count', label: 'Count', type: 'number', placeholder: '1' },
  { key: 'point_count', label: 'Points / Antlers', type: 'number', placeholder: 'e.g. 8' },
  { key: 'distance_yards', label: 'Distance (yds)', type: 'number', placeholder: 'e.g. 180' },
  { key: 'direction', label: 'Direction', type: 'select', options: DIRECTION_OPTIONS },
  { key: 'behavior', label: 'Behavior', type: 'select', options: BEHAVIOR_OPTIONS },
]

const METADATA_FIELDS: Record<string, MetadataField[]> = {
  buck: SIGHTING_FIELDS,
  doe: SIGHTING_FIELDS.filter(f => f.key !== 'point_count'),
  bull_elk: SIGHTING_FIELDS,
  cow_elk: SIGHTING_FIELDS.filter(f => f.key !== 'point_count'),
  turkey: SIGHTING_FIELDS.filter(f => f.key !== 'point_count'),
  bear: SIGHTING_FIELDS.filter(f => f.key !== 'point_count'),
  other_animal: SIGHTING_FIELDS.filter(f => f.key !== 'point_count'),

  scrape: [
    { key: 'freshness', label: 'Freshness', type: 'select', options: FRESHNESS_OPTIONS },
    { key: 'size', label: 'Size', type: 'select', options: SIZE_OPTIONS },
    { key: 'licking_branch', label: 'Licking Branch?', type: 'boolean' },
  ],
  rub: [
    { key: 'freshness', label: 'Freshness', type: 'select', options: FRESHNESS_OPTIONS },
    { key: 'tree_diameter', label: 'Tree Diameter (in)', type: 'number', placeholder: 'e.g. 6' },
  ],
  tracks: [
    { key: 'freshness', label: 'Freshness', type: 'select', options: FRESHNESS_OPTIONS },
    { key: 'direction', label: 'Travel Direction', type: 'select', options: DIRECTION_OPTIONS },
  ],
  scat: [
    { key: 'freshness', label: 'Freshness', type: 'select', options: FRESHNESS_OPTIONS },
  ],
  bedding: [
    { key: 'size', label: 'Size', type: 'select', options: SIZE_OPTIONS },
  ],

  trail_cam: [
    { key: 'camera_model', label: 'Camera Model', type: 'text', placeholder: 'e.g. Moultrie' },
    { key: 'last_checked', label: 'Last Checked', type: 'date' },
    { key: 'activity_level', label: 'Activity Level', type: 'select', options: ACTIVITY_OPTIONS },
  ],
}

export function getMetadataFields(pinType: string): MetadataField[] {
  return METADATA_FIELDS[pinType] ?? []
}
