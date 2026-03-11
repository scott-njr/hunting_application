import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/fitness/plans/share/respond — Accept or decline a shared plan
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { share_id, action } = await req.json()

  if (!share_id || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'share_id and action (accept|decline) are required' }, { status: 400 })
  }

  // Fetch the share — RLS ensures only target_user can update
  const { data: share } = await supabase
    .from('fitness_shared_plans')
    .select('*')
    .eq('id', share_id)
    .eq('target_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!share) return NextResponse.json({ error: 'Share not found or already responded' }, { status: 404 })

  if (action === 'decline') {
    const { error } = await supabase
      .from('fitness_shared_plans')
      .update({ status: 'declined' as const })
      .eq('id', share_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'declined' })
  }

  // Accept: copy the source plan for the recipient
  const { data: sourcePlan } = await supabase
    .from('fitness_training_plans')
    .select('plan_type, config, plan_data, goal, weeks_total')
    .eq('id', share.source_plan_id)
    .single()

  if (!sourcePlan) {
    return NextResponse.json({ error: 'Source plan no longer exists' }, { status: 404 })
  }

  // Abandon any existing active plan of this type for the recipient
  await supabase
    .from('fitness_training_plans')
    .update({ status: 'abandoned' as const })
    .eq('user_id', user.id)
    .eq('plan_type', sourcePlan.plan_type)
    .eq('status', 'active')

  // Create the copy
  const { data: newPlan, error: insertError } = await supabase
    .from('fitness_training_plans')
    .insert({
      user_id: user.id,
      plan_type: sourcePlan.plan_type,
      status: 'active' as const,
      config: sourcePlan.config,
      plan_data: sourcePlan.plan_data,
      goal: sourcePlan.goal,
      weeks_total: sourcePlan.weeks_total,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Update the share with the new plan reference
  const { error: updateError } = await supabase
    .from('fitness_shared_plans')
    .update({
      target_plan_id: newPlan.id,
      status: 'accepted' as const,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', share_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ status: 'accepted', plan: newPlan })
}
