import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

// POST /api/fitness/plans/revert — Revert to a previous (abandoned) plan
export const POST = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { plan_id } = body
  if (!plan_id) return badRequest('plan_id is required')

  // Verify the plan belongs to the user and is abandoned
  const { data: targetPlan } = await supabase
    .from('fitness_training_plans')
    .select('id, plan_type, status')
    .eq('id', plan_id)
    .eq('user_id', user.id)
    .eq('status', 'abandoned')
    .maybeSingle()

  if (!targetPlan) {
    return notFound('Plan not found or not abandoned')
  }

  // Abandon the current active plan of the same type
  const { error: abandonError } = await supabase
    .from('fitness_training_plans')
    .update({ status: 'abandoned' as const })
    .eq('user_id', user.id)
    .eq('plan_type', targetPlan.plan_type)
    .eq('status', 'active')

  if (abandonError) return serverError()

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

  if (reactivateError) return serverError()

  return apiOk({ plan: reactivated })
})

