import type { SupabaseClient } from '@supabase/supabase-js'

export type ModuleSlug = 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'
export type ModuleTier = 'free' | 'basic' | 'pro'

export const MODULE_TIER_RANK: Record<ModuleTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
}

export const MODULE_TIER_LABELS: Record<ModuleTier, string> = {
  free: 'Free',
  basic: 'Pro',
  pro: 'Pro+',
}

// AI query quota per module tier per month
export const MODULE_AI_QUOTA: Record<ModuleTier, number> = {
  free: 0,
  basic: 25,
  pro: 75,
}

export const MODULE_TIER_COLORS: Record<ModuleTier, string> = {
  free: 'tier-free',
  basic: 'tier-basic',
  pro: 'tier-pro',
}

export function hasModuleAccess(userTier: ModuleTier, requiredTier: ModuleTier): boolean {
  return MODULE_TIER_RANK[userTier] >= MODULE_TIER_RANK[requiredTier]
}

export function remainingModuleAIQueries(tier: ModuleTier, used: number): number {
  return Math.max(0, MODULE_AI_QUOTA[tier] - used)
}

/** Check if user has AI quota remaining for a module */
export function hasModuleAIQuota(tier: ModuleTier, used: number): boolean {
  return used < MODULE_AI_QUOTA[tier]
}

/** Check if a module tier meets the required tier for a resource (course, feature).
 *  Handles legacy 'elite' tier by mapping it to 'pro'. */
export function hasModuleTierAccess(userTier: ModuleTier, requiredTier: string): boolean {
  const required = (requiredTier === 'elite' ? 'pro' : requiredTier) as ModuleTier
  return MODULE_TIER_RANK[userTier] >= MODULE_TIER_RANK[required]
}

/** Server-side: fetch the user's active tier for a given module. Returns 'free' if no active subscription. */
export async function getUserModuleTier(
  supabase: SupabaseClient,
  userId: string,
  module: ModuleSlug
): Promise<ModuleTier> {
  const { data } = await supabase
    .from('module_subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .eq('module_slug', module)
    .maybeSingle()

  if (!data || data.status !== 'active') return 'free'
  return (data.tier as ModuleTier) ?? 'free'
}

export type ModuleSubscriptionInfo = {
  tier: ModuleTier
  aiQueriesThisMonth: number
}

/** Server-side: fetch the user's module subscription with tier + AI usage for a specific module. */
export async function getUserModuleSubscriptionInfo(
  supabase: SupabaseClient,
  userId: string,
  moduleSlug: ModuleSlug
): Promise<ModuleSubscriptionInfo> {
  const { data } = await supabase
    .from('module_subscriptions')
    .select('tier, status, ai_queries_this_month')
    .eq('user_id', userId)
    .eq('module_slug', moduleSlug)
    .maybeSingle()

  if (!data || data.status !== 'active') {
    return { tier: 'free', aiQueriesThisMonth: 0 }
  }
  return {
    tier: (data.tier as ModuleTier) ?? 'free',
    aiQueriesThisMonth: data.ai_queries_this_month ?? 0,
  }
}

/** Server-side: fetch all of a user's module subscriptions (for the hub page). */
export async function getUserModuleSubscriptions(
  supabase: SupabaseClient,
  userId: string
): Promise<Partial<Record<ModuleSlug, ModuleSubscriptionInfo>>> {
  const { data } = await supabase
    .from('module_subscriptions')
    .select('module_slug, tier, status, ai_queries_this_month')
    .eq('user_id', userId)
    .eq('status', 'active')

  const result: Partial<Record<ModuleSlug, ModuleSubscriptionInfo>> = {}
  for (const row of data ?? []) {
    result[row.module_slug as ModuleSlug] = {
      tier: (row.tier as ModuleTier) ?? 'free',
      aiQueriesThisMonth: row.ai_queries_this_month ?? 0,
    }
  }
  return result
}

/** Server-side: get the user's highest active tier across all modules. */
export async function getUserHighestTier(
  supabase: SupabaseClient,
  userId: string
): Promise<ModuleTier> {
  const { data } = await supabase
    .from('module_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .eq('status', 'active')

  let highest: ModuleTier = 'free'
  for (const row of data ?? []) {
    const t = row.tier as ModuleTier
    if (MODULE_TIER_RANK[t] > MODULE_TIER_RANK[highest]) highest = t
  }
  return highest
}

/** Server-side: sum AI queries across all active module subscriptions. */
export async function getUserTotalAIQueries(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from('module_subscriptions')
    .select('ai_queries_this_month')
    .eq('user_id', userId)
    .eq('status', 'active')

  let total = 0
  for (const row of data ?? []) {
    total += row.ai_queries_this_month ?? 0
  }
  return total
}

export const ALL_MODULES: {
  slug: ModuleSlug
  name: string
  description: string
  icon: string
  isActive: boolean
}[] = [
  { slug: 'hunting', name: 'Hunting', description: 'Draw deadlines, hunt planning, gear, and AI scouting reports.', icon: 'Tent', isActive: true },
  { slug: 'archery', name: 'Archery', description: 'Structured training, equipment guides, form coaching, and competition prep.', icon: 'Target', isActive: true },
  { slug: 'firearms', name: 'Firearms', description: 'Ballistics, maintenance logs, and range tracking.', icon: 'Crosshair', isActive: true },
  { slug: 'medical', name: 'Medical', description: 'Wilderness first aid protocols and emergency preparedness.', icon: 'Heart', isActive: true },
  { slug: 'fishing', name: 'Fishing', description: 'Fly fishing, spear fishing, regulations, and trip logs.', icon: 'Fish', isActive: true },
  { slug: 'fitness', name: 'Fitness', description: 'Hunt-specific fitness training and conditioning programs.', icon: 'Dumbbell', isActive: true },
]
