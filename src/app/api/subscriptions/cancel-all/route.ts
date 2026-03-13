import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { apiDone, unauthorized, serverError } from '@/lib/api-response'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[cancel-all] SUPABASE_SERVICE_ROLE_KEY not set')
      return serverError('Server configuration error')
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
      return serverError()
    }

    return apiDone()
  } catch (err) {
    console.error('[cancel-all] unexpected error:', err)
    return serverError('An unexpected error occurred')
  }
}
