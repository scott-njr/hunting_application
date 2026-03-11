import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/fitness/plans/share-item — Share an individual workout/meal with a friend
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipient_id, item_type, item_snapshot, source_plan_id, message } = await req.json()

  if (!recipient_id || !item_type || !item_snapshot) {
    return NextResponse.json({ error: 'recipient_id, item_type, and item_snapshot are required' }, { status: 400 })
  }

  const validTypes = ['run_session', 'strength_session', 'meal']
  if (!validTypes.includes(item_type)) {
    return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 })
  }

  // Verify recipient is an accepted friend
  const { data: friends } = await supabase
    .from('my_friends')
    .select('friend_id')
    .eq('status', 'accepted')

  const isFriend = friends?.some(f => f.friend_id === recipient_id)
  if (!isFriend) return NextResponse.json({ error: 'Not a confirmed friend' }, { status: 403 })

  const { data: item, error } = await supabase
    .from('fitness_shared_items')
    .insert({
      sender_id: user.id,
      recipient_id,
      item_type: item_type as 'run_session' | 'strength_session' | 'meal',
      item_snapshot,
      source_plan_id: source_plan_id ?? null,
      message: message?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ item })
}

// GET /api/fitness/plans/share-item — List received shared items
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10)

  const { data: items, error } = await supabase
    .from('fitness_shared_items')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Enrich with sender display names
  const senderIds = new Set((items ?? []).map(i => i.sender_id))
  const { data: profiles } = senderIds.size > 0
    ? await supabase
        .from('user_profile')
        .select('id, display_name')
        .in('id', [...senderIds])
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  const enriched = (items ?? []).map(i => ({
    ...i,
    sender_name: profileMap.get(i.sender_id) ?? 'Unknown',
  }))

  return NextResponse.json({ items: enriched })
}
