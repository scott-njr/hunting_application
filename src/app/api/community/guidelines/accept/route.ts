import { createClient } from '@/lib/supabase/server'
import { apiDone, unauthorized, serverError } from '@/lib/api-response'
import { CURRENT_GUIDELINES_VERSION } from '@/lib/community-guidelines'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return unauthorized()
  }

  const { error } = await supabase
    .from('members')
    .update({
      community_guidelines_accepted_at: new Date().toISOString(),
      community_guidelines_version: CURRENT_GUIDELINES_VERSION,
    })
    .eq('id', user.id)

  if (error) {
    return serverError('Failed to accept guidelines')
  }

  return apiDone()
}
