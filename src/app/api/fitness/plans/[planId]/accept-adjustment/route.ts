import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Json } from '@/types/database.types'

// POST /api/fitness/plans/[planId]/accept-adjustment
// Accepts a draft adjustment: snapshots current plan to history, then saves the draft
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId } = await params
  const { draft, goal } = await req.json()

  if (!draft) {
    return NextResponse.json({ error: 'Draft plan data is required' }, { status: 400 })
  }

  // Fetch current plan and verify ownership
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Snapshot current plan as abandoned (preserves history for revert)
  const { error: snapshotError } = await supabase
    .from('fitness_training_plans')
    .insert({
      user_id: user.id,
      plan_type: plan.plan_type,
      goal: plan.goal,
      plan_data: plan.plan_data,
      config: plan.config,
      weeks_total: plan.weeks_total,
      started_at: plan.started_at,
      status: 'abandoned' as const,
    })

  if (snapshotError) {
    return NextResponse.json({ error: 'Failed to save plan history' }, { status: 500 })
  }

  // Apply the accepted draft to the active plan
  const { error: updateError } = await supabase
    .from('fitness_training_plans')
    .update({
      plan_data: draft as unknown as Json,
      goal: (goal as string) ?? plan.goal,
    })
    .eq('id', planId)

  if (updateError) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
