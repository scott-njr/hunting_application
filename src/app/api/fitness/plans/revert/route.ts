import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/fitness/plans/revert — Revert to a previous (abandoned) plan
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan_id } = await req.json()
  if (!plan_id) return NextResponse.json({ error: 'plan_id is required' }, { status: 400 })

  // Verify the plan belongs to the user and is abandoned
  const { data: targetPlan } = await supabase
    .from('fitness_training_plans')
    .select('id, plan_type, status')
    .eq('id', plan_id)
    .eq('user_id', user.id)
    .eq('status', 'abandoned')
    .maybeSingle()

  if (!targetPlan) {
    return NextResponse.json({ error: 'Plan not found or not abandoned' }, { status: 404 })
  }

  // Abandon the current active plan of the same type
  const { error: abandonError } = await supabase
    .from('fitness_training_plans')
    .update({ status: 'abandoned' as const })
    .eq('user_id', user.id)
    .eq('plan_type', targetPlan.plan_type)
    .eq('status', 'active')

  if (abandonError) return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })

  // Reactivate the target plan
  const { data: reactivated, error: reactivateError } = await supabase
    .from('fitness_training_plans')
    .update({
      status: 'active' as const,
      started_at: new Date().toISOString(),
    })
    .eq('id', plan_id)
    .select()
    .single()

  if (reactivateError) return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })

  return NextResponse.json({ plan: reactivated })
}
