import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ModuleSlug, ModuleTier } from '@/lib/modules'
import { ALL_MODULES } from '@/lib/modules'

// Manual tier selection — will be replaced by Stripe checkout when payments are wired.

const VALID_SLUGS = ALL_MODULES.map(m => m.slug)
const VALID_TIERS: ModuleTier[] = ['free', 'basic', 'pro']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const moduleSlug = body.module as ModuleSlug
    const tier = body.tier as ModuleTier

    if (!VALID_SLUGS.includes(moduleSlug)) {
      return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
    }
    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[select-tier] SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, module: moduleSlug, tier })
  } catch (err) {
    console.error('[select-tier] unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
