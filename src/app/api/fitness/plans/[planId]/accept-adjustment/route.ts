import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Json } from '@/types/database.types'
import { apiDone, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

// POST /api/fitness/plans/[planId]/accept-adjustment
// Accepts a draft adjustment: snapshots current plan to history, then saves the draft
export const POST = withHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { planId } = await params
  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { draft, goal } = body

  if (!draft) {
    return badRequest('Draft plan data is required')
  }

  // Fetch current plan and verify ownership
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!plan) return notFound('Plan not found')

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
    return serverError('Failed to save plan history')
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
    return serverError()
  }

  return apiDone()
})

