import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ count: 0 }, { status: 401 })
  }

  const { count, error } = await supabase
    .from('social_messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null)

  if (error) {
    return NextResponse.json({ count: 0 }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
}
