import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENT_GUIDELINES_VERSION } from '@/lib/community-guidelines'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('members')
    .update({
      community_guidelines_accepted_at: new Date().toISOString(),
      community_guidelines_version: CURRENT_GUIDELINES_VERSION,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to accept guidelines' }, { status: 500 })
  }

  return NextResponse.json({ accepted: true })
}
