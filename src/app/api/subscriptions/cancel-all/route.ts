import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[cancel-all] SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Set all module subscriptions to free + cancelled
    const { error: subError } = await admin
      .from('module_subscriptions')
      .update({ tier: 'free', status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (subError) {
      console.error('[cancel-all] subscription update error:', subError.message)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cancel-all] unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
