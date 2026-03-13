import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

export const POST = withHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { planId } = await params

  // Verify plan belongs to current user
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!plan) return notFound('Plan not found')

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { week_number, session_number, notes } = body

  if (week_number == null || session_number == null) {
    return badRequest('week_number and session_number are required')
  }

  // Upsert (one log per session per plan), mark as completed
  const { data: log, error } = await supabase
    .from('fitness_plan_workout_logs')
    .upsert({
      plan_id: planId,
      user_id: user.id,
      week_number,
      session_number,
      notes: notes || null,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'plan_id,week_number,session_number' })
    .select()
    .single()

  if (error) {
    console.error('[fitness/plans/logs POST] upsert error:', error.message)
    return serverError()
  }

  return apiOk({ log }, 201)
})


export const PATCH = withHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { planId } = await params

  // Verify plan belongs to current user
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!plan) return notFound('Plan not found')

  const patchBody = await parseBody(req)
  if (isErrorResponse(patchBody)) return patchBody
  const { week_number, session_number, completed } = patchBody

  if (week_number == null || session_number == null || completed == null) {
    return badRequest('week_number, session_number, and completed are required')
  }

  const { data: log, error } = await supabase
    .from('fitness_plan_workout_logs')
    .update({ completed })
    .eq('plan_id', planId)
    .eq('user_id', user.id)
    .eq('week_number', week_number)
    .eq('session_number', session_number)
    .select()
    .single()

  if (error) {
    console.error('[fitness/plans/logs PATCH] update error:', error.message)
    return serverError()
  }

  return apiOk({ log })
})

