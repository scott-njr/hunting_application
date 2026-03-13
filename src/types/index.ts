// Module system
export type { ModuleSlug, ModuleTier } from '@/lib/modules'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert'

export type BlogCategory =
  | 'field_reports'
  | 'gear_reviews'
  | 'strategy_breakdowns'
  | 'scouting_intel'
  | 'community_stories'
  | 'how_to_guides'

export type BlogStatus = 'draft' | 'published' | 'archived'
export type FitnessLevel = 'just_starting' | 'moderately_active' | 'very_active' | 'competitive'
export type BroadcastCategory = 'release_notes' | 'newsletter' | 'blog' | 'announcement'

export interface Member {
  id: string
  email: string
  full_name: string | null
  stripe_customer_id: string | null
  onboarding_completed: boolean
  created_on: string
  updated_on: string
}
