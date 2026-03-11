import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId } = await params

  // Verify plan belongs to current user
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { week_number, session_number, notes } = await req.json()

  if (week_number == null || session_number == null) {
    return NextResponse.json({ error: 'week_number and session_number are required' }, { status: 400 })
  }

  // Upsert (one log per session per plan)
  const { data: log, error } = await supabase
    .from('fitness_plan_workout_logs')
    .upsert({
      plan_id: planId,
      user_id: user.id,
      week_number,
      session_number,
      notes: notes || null,
    }, { onConflict: 'plan_id,week_number,session_number' })
    .select()
    .single()

  if (error) {
    console.error('[fitness/plans/logs POST] upsert error:', error.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ log })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId } = await params

  // Verify plan belongs to current user
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { week_number, session_number } = await req.json()

  if (week_number == null || session_number == null) {
    return NextResponse.json({ error: 'week_number and session_number are required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('fitness_plan_workout_logs')
    .delete()
    .eq('plan_id', planId)
    .eq('user_id', user.id)
    .eq('week_number', week_number)
    .eq('session_number', session_number)

  if (error) {
    console.error('[fitness/plans/logs DELETE] delete error:', error.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
