import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/fitness/challenges/respond — Accept or decline a challenge
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { challenge_id, action } = await req.json()

  if (!challenge_id || !action) {
    return NextResponse.json({ error: 'challenge_id and action are required' }, { status: 400 })
  }

  if (!['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 })
  }

  // Verify user is the challenged party
  const { data: challenge } = await supabase
    .from('fitness_challenges')
    .select('*')
    .eq('id', challenge_id)
    .eq('challenged_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found or already responded' }, { status: 404 })
  }

  if (action === 'decline') {
    const { error } = await supabase
      .from('fitness_challenges')
      .update({ status: 'declined' as const })
      .eq('id', challenge_id)

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
    return NextResponse.json({ status: 'declined' })
  }

  // Accept
  const { error } = await supabase
    .from('fitness_challenges')
    .update({
      status: 'accepted' as const,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', challenge_id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ status: 'accepted' })
}
