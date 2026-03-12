import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { ModuleSlug, ModuleTier } from '@/lib/modules'
import { ALL_MODULES } from '@/lib/modules'
import { apiDone, apiError, unauthorized, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

// Manual tier selection — will be replaced by Stripe checkout when payments are wired.
// SECURITY: In production with Stripe, this route must verify payment before upgrading.
// For now, only allow upgrades in development or when ALLOW_FREE_TIER_SELECTION is set.

const VALID_SLUGS = ALL_MODULES.map(m => m.slug)
const VALID_TIERS: ModuleTier[] = ['free', 'basic', 'pro']

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req)
    if (isErrorResponse(body)) return body
    const moduleSlug = body.module as ModuleSlug
    const tier = body.tier as ModuleTier

    if (!VALID_SLUGS.includes(moduleSlug)) {
      return badRequest('Invalid module')
    }
    if (!VALID_TIERS.includes(tier)) {
      return badRequest('Invalid tier')
    }

    // Block paid tier upgrades unless explicitly allowed (pre-Stripe development mode)
    // Double-guard: even if env var is accidentally set in production, block upgrades
    if (tier !== 'free') {
      if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY) {
        return apiError('Payment required. Tier upgrades require Stripe integration.', 402)
      }
      if (!process.env.ALLOW_FREE_TIER_SELECTION && !process.env.STRIPE_SECRET_KEY) {
        return apiError('Payment required. Tier upgrades are not available without a valid subscription.', 402)
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[select-tier] SUPABASE_SERVICE_ROLE_KEY not set')
      return serverError('Server configuration error')
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Upsert module subscription
    const { error } = await admin
      .from('module_subscriptions')
      .upsert({
        user_id: user.id,
        module_slug: moduleSlug,
        tier,
        status: 'active',
      }, { onConflict: 'user_id,module_slug' })

    if (error) {
      console.error('[select-tier] upsert error:', error.message)
      return serverError()
    }

    return apiDone({ module: moduleSlug, tier })
  } catch (err) {
    console.error('[select-tier] unexpected error:', err)
    return serverError('An unexpected error occurred')
  }
}
