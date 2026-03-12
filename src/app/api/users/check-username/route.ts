import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const userName = req.nextUrl.searchParams.get('username')?.toLowerCase().trim()
  if (!userName || userName.length < 3 || userName.length > 20) {
    return apiOk({ available: false, reason: 'Must be 3-20 characters' })
  }

  if (!/^[a-z0-9_]{3,20}$/.test(userName)) {
    return apiOk({ available: false, reason: 'Letters, numbers, and underscores only' })
  }

  const { data: existing } = await supabase
    .from('user_profile')
    .select('id')
    .ilike('user_name', userName)
    .neq('id', user.id)
    .maybeSingle()

  return apiOk({ available: !existing })
}
