import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

// POST /api/fitness/plans/share/respond — Accept or decline a shared plan
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { share_id, action } = body

  if (!share_id || !['accept', 'decline'].includes(action)) {
    return badRequest('share_id and action (accept|decline) are required')
  }

  // Fetch the share — RLS ensures only target_user can update
  const { data: share } = await supabase
    .from('fitness_shared_plans')
    .select('*')
    .eq('id', share_id)
    .eq('target_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!share) return notFound('Share not found or already responded')

  if (action === 'decline') {
    const { error } = await supabase
      .from('fitness_shared_plans')
      .update({ status: 'declined' as const })
      .eq('id', share_id)

    if (error) {
      console.error('[Fitness Share Respond] decline error:', error)
      return serverError()
    }
    return apiOk({ status: 'declined' })
  }

  // Accept: copy the source plan for the recipient
  const { data: sourcePlan } = await supabase
    .from('fitness_training_plans')
    .select('plan_type, config, plan_data, goal, weeks_total')
    .eq('id', share.source_plan_id)
    .single()

  if (!sourcePlan) {
    return notFound('Source plan no longer exists')
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

  if (insertError) {
    console.error('[Fitness Share Respond] plan copy error:', insertError)
    return serverError()
  }

  // Update the share with the new plan reference
  const { error: updateError } = await supabase
    .from('fitness_shared_plans')
    .update({
      target_plan_id: newPlan.id,
      status: 'accepted' as const,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', share_id)

  if (updateError) {
    console.error('[Fitness Share Respond] status update error:', updateError)
    return serverError()
  }

  return apiOk({ status: 'accepted' as const, plan: newPlan })
}
