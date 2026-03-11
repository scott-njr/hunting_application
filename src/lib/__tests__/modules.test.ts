import { describe, it, expect } from 'vitest'
import {
  hasModuleAccess,
  hasModuleAIQuota,
  hasModuleTierAccess,
  remainingModuleAIQueries,
  getUserModuleTier,
  getUserModuleSubscriptions,
  getUserModuleSubscriptionInfo,
  MODULE_TIER_RANK,
  MODULE_AI_QUOTA,
  MODULE_TIER_LABELS,
  ALL_MODULES,
} from '../modules'

describe('MODULE_TIER_RANK', () => {
  it('ranks tiers in ascending order', () => {
    expect(MODULE_TIER_RANK.free).toBeLessThan(MODULE_TIER_RANK.basic)
    expect(MODULE_TIER_RANK.basic).toBeLessThan(MODULE_TIER_RANK.pro)
  })

  it('free is rank 0', () => {
    expect(MODULE_TIER_RANK.free).toBe(0)
  })
})

describe('MODULE_AI_QUOTA', () => {
  it('free tier has no AI access (0)', () => {
    expect(MODULE_AI_QUOTA.free).toBe(0)
  })

  it('basic tier has limited AI access', () => {
    expect(MODULE_AI_QUOTA.basic).toBeGreaterThan(0)
    expect(typeof MODULE_AI_QUOTA.basic).toBe('number')
  })

  it('pro tier has more AI access than basic', () => {
    expect(MODULE_AI_QUOTA.pro).toBeGreaterThan(MODULE_AI_QUOTA.basic)
  })
})

describe('MODULE_TIER_LABELS', () => {
  it('all tiers have non-empty labels', () => {
    for (const label of Object.values(MODULE_TIER_LABELS)) {
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

describe('hasModuleAccess', () => {
  it('same tier has access', () => {
    expect(hasModuleAccess('free', 'free')).toBe(true)
    expect(hasModuleAccess('basic', 'basic')).toBe(true)
    expect(hasModuleAccess('pro', 'pro')).toBe(true)
  })

  it('higher tier has access to lower tier features', () => {
    expect(hasModuleAccess('basic', 'free')).toBe(true)
    expect(hasModuleAccess('pro', 'free')).toBe(true)
    expect(hasModuleAccess('pro', 'basic')).toBe(true)
  })

  it('lower tier does not have access to higher tier features', () => {
    expect(hasModuleAccess('free', 'basic')).toBe(false)
    expect(hasModuleAccess('free', 'pro')).toBe(false)
    expect(hasModuleAccess('basic', 'pro')).toBe(false)
  })
})

describe('remainingModuleAIQueries', () => {
  it('free tier always has 0 remaining (no AI access)', () => {
    expect(remainingModuleAIQueries('free', 0)).toBe(0)
    expect(remainingModuleAIQueries('free', 5)).toBe(0)
  })

  it('basic tier returns correct remaining count', () => {
    const quota = MODULE_AI_QUOTA.basic
    expect(remainingModuleAIQueries('basic', 0)).toBe(quota)
    expect(remainingModuleAIQueries('basic', 3)).toBe(quota - 3)
    expect(remainingModuleAIQueries('basic', quota)).toBe(0)
  })

  it('does not return negative values when overused', () => {
    expect(remainingModuleAIQueries('basic', MODULE_AI_QUOTA.basic + 100)).toBe(0)
  })

  it('returns correct remaining for pro tier', () => {
    expect(remainingModuleAIQueries('pro', 0)).toBe(MODULE_AI_QUOTA.pro)
    expect(remainingModuleAIQueries('pro', MODULE_AI_QUOTA.pro)).toBe(0)
  })
})

describe('ALL_MODULES', () => {
  it('has at least 5 modules defined', () => {
    expect(ALL_MODULES.length).toBeGreaterThanOrEqual(5)
  })

  it('hunting module is active', () => {
    const hunting = ALL_MODULES.find(m => m.slug === 'hunting')
    expect(hunting).toBeDefined()
    expect(hunting!.isActive).toBe(true)
  })

  it('all modules have required fields', () => {
    for (const mod of ALL_MODULES) {
      expect(mod.slug.length).toBeGreaterThan(0)
      expect(mod.name.length).toBeGreaterThan(0)
      expect(mod.description.length).toBeGreaterThan(0)
      expect(mod.icon.length).toBeGreaterThan(0)
      expect(typeof mod.isActive).toBe('boolean')
    }
  })

  it('module slugs are unique', () => {
    const slugs = ALL_MODULES.map(m => m.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })
})

describe('getUserModuleTier', () => {
  function makeSupabaseMock(data: Record<string, unknown> | null, error: unknown = null) {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data, error }),
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getUserModuleTier>[0]
  }

  it('returns the tier when an active subscription exists', async () => {
    const supabase = makeSupabaseMock({ tier: 'pro', status: 'active' })
    const result = await getUserModuleTier(supabase, 'user-1', 'hunting')
    expect(result).toBe('pro')
  })

  it('returns free when no subscription row exists', async () => {
    const supabase = makeSupabaseMock(null)
    const result = await getUserModuleTier(supabase, 'user-1', 'hunting')
    expect(result).toBe('free')
  })

  it('returns free when subscription is inactive', async () => {
    const supabase = makeSupabaseMock({ tier: 'pro', status: 'inactive' })
    const result = await getUserModuleTier(supabase, 'user-1', 'hunting')
    expect(result).toBe('free')
  })

  it('returns free when subscription is cancelled', async () => {
    const supabase = makeSupabaseMock({ tier: 'basic', status: 'cancelled' })
    const result = await getUserModuleTier(supabase, 'user-1', 'hunting')
    expect(result).toBe('free')
  })

  it('returns basic tier when active basic subscription exists', async () => {
    const supabase = makeSupabaseMock({ tier: 'basic', status: 'active' })
    const result = await getUserModuleTier(supabase, 'user-1', 'firearms')
    expect(result).toBe('basic')
  })
})

describe('getUserModuleSubscriptions', () => {
  it('returns subscriptions keyed by module slug with tier and AI usage', async () => {
    const mockData = [
      { module_slug: 'hunting', tier: 'pro', status: 'active', ai_queries_this_month: 5 },
      { module_slug: 'firearms', tier: 'basic', status: 'active', ai_queries_this_month: 0 },
    ]

    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ data: mockData }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getUserModuleSubscriptions>[0]

    const result = await getUserModuleSubscriptions(supabase, 'user-1')
    expect(result['hunting']).toEqual({ tier: 'pro', aiQueriesThisMonth: 5 })
    expect(result['firearms']).toEqual({ tier: 'basic', aiQueriesThisMonth: 0 })
  })

  it('returns empty object when no subscriptions exist', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ data: null }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getUserModuleSubscriptions>[0]

    const result = await getUserModuleSubscriptions(supabase, 'user-1')
    expect(Object.keys(result).length).toBe(0)
  })
})

describe('hasModuleAIQuota', () => {
  it('returns true when under quota', () => {
    expect(hasModuleAIQuota('basic', 0)).toBe(true)
    expect(hasModuleAIQuota('basic', MODULE_AI_QUOTA.basic - 1)).toBe(true)
    expect(hasModuleAIQuota('pro', 0)).toBe(true)
  })

  it('returns false when at or over quota', () => {
    expect(hasModuleAIQuota('basic', MODULE_AI_QUOTA.basic)).toBe(false)
    expect(hasModuleAIQuota('basic', MODULE_AI_QUOTA.basic + 10)).toBe(false)
    expect(hasModuleAIQuota('pro', MODULE_AI_QUOTA.pro)).toBe(false)
  })

  it('free tier always returns false (quota is 0)', () => {
    expect(hasModuleAIQuota('free', 0)).toBe(false)
  })
})

describe('hasModuleTierAccess', () => {
  it('same tier has access', () => {
    expect(hasModuleTierAccess('free', 'free')).toBe(true)
    expect(hasModuleTierAccess('basic', 'basic')).toBe(true)
    expect(hasModuleTierAccess('pro', 'pro')).toBe(true)
  })

  it('higher tier has access to lower tier features', () => {
    expect(hasModuleTierAccess('pro', 'free')).toBe(true)
    expect(hasModuleTierAccess('pro', 'basic')).toBe(true)
    expect(hasModuleTierAccess('basic', 'free')).toBe(true)
  })

  it('lower tier does not have access to higher tier features', () => {
    expect(hasModuleTierAccess('free', 'basic')).toBe(false)
    expect(hasModuleTierAccess('free', 'pro')).toBe(false)
    expect(hasModuleTierAccess('basic', 'pro')).toBe(false)
  })

  it('maps legacy elite tier to pro', () => {
    expect(hasModuleTierAccess('pro', 'elite')).toBe(true)
    expect(hasModuleTierAccess('basic', 'elite')).toBe(false)
  })
})

describe('getUserModuleSubscriptionInfo', () => {
  function makeSupabaseMock(data: Record<string, unknown> | null) {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getUserModuleSubscriptionInfo>[0]
  }

  it('returns tier and AI usage for active subscription', async () => {
    const supabase = makeSupabaseMock({ tier: 'pro', status: 'active', ai_queries_this_month: 12 })
    const result = await getUserModuleSubscriptionInfo(supabase, 'user-1', 'hunting')
    expect(result).toEqual({ tier: 'pro', aiQueriesThisMonth: 12 })
  })

  it('returns free with 0 queries when no subscription exists', async () => {
    const supabase = makeSupabaseMock(null)
    const result = await getUserModuleSubscriptionInfo(supabase, 'user-1', 'hunting')
    expect(result).toEqual({ tier: 'free', aiQueriesThisMonth: 0 })
  })

  it('returns free with 0 queries when subscription is inactive', async () => {
    const supabase = makeSupabaseMock({ tier: 'pro', status: 'inactive', ai_queries_this_month: 5 })
    const result = await getUserModuleSubscriptionInfo(supabase, 'user-1', 'hunting')
    expect(result).toEqual({ tier: 'free', aiQueriesThisMonth: 0 })
  })
})
