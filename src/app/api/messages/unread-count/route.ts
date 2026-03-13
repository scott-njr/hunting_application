import { createClient } from '@/lib/supabase/server'
import { apiOk, apiError, withHandler, serverError } from '@/lib/api-response'

export const GET = withHandler(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('Unauthorized', 401)
  }

  const { count, error } = await supabase
    .from('social_messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null)

  if (error) {
    return apiOk({ count: 0 })
  }

  return apiOk({ count: count ?? 0 })
})

