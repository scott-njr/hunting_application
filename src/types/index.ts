// Module system
export type { ModuleSlug, ModuleTier } from '@/lib/modules'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert'
export type FitnessLevel = 'just_starting' | 'moderately_active' | 'very_active' | 'competitive'

export interface Member {
  id: string
  email: string
  full_name: string | null
  stripe_customer_id: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}
