import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Json } from '@/types/database.types'
import { apiDone, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

// POST /api/fitness/plans/[planId]/apply-weeks
// Cherry-pick specific weeks from a historical plan into the current active plan.
// Body: { source_plan_id: string, week_numbers: number[] }
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
  const { source_plan_id, week_numbers } = body

  if (!source_plan_id || !Array.isArray(week_numbers) || week_numbers.length === 0) {
    return badRequest('source_plan_id and week_numbers[] are required')
  }

  // Fetch the active (target) plan
  const { data: activePlan } = await supabase
    .from('fitness_training_plans')
    .select('id, plan_type, plan_data, goal, config, weeks_total, started_at')
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!activePlan) return notFound('Active plan not found')

  // Fetch the source (historical) plan
  const { data: sourcePlan } = await supabase
    .from('fitness_training_plans')
    .select('id, plan_type, plan_data')
    .eq('id', source_plan_id)
    .eq('user_id', user.id)
    .eq('status', 'abandoned')
    .single()

  if (!sourcePlan) return notFound('Source plan not found')
  if (sourcePlan.plan_type !== activePlan.plan_type) {
    return badRequest('Plan types must match')
  }

  // Snapshot current plan before modification
  await supabase
    .from('fitness_training_plans')
    .insert({
      user_id: user.id,
      plan_type: activePlan.plan_type,
      goal: activePlan.goal,
      plan_data: activePlan.plan_data,
      config: activePlan.config,
      weeks_total: activePlan.weeks_total,
      started_at: activePlan.started_at,
      status: 'abandoned' as const,
    })

  const activeData = activePlan.plan_data as Record<string, unknown>
  const sourceData = sourcePlan.plan_data as Record<string, unknown>
  const activeWeeks = (activeData.weeks ?? []) as Array<Record<string, unknown>>
  const sourceWeeks = (sourceData.weeks ?? []) as Array<Record<string, unknown>>

  // Replace selected weeks
  for (const weekNum of week_numbers) {
    const idx = weekNum - 1
    if (sourceWeeks[idx] && idx < activeWeeks.length) {
      activeWeeks[idx] = sourceWeeks[idx]
    }
  }

  activeData.weeks = activeWeeks

  const { error } = await supabase
    .from('fitness_training_plans')
    .update({ plan_data: activeData as unknown as Json })
    .eq('id', planId)

  if (error) return serverError()

  return apiDone({ weeks_applied: week_numbers })
})

