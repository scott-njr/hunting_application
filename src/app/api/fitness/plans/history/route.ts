import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, badRequest, serverError } from '@/lib/api-response'

// GET /api/fitness/plans/history?type=run|strength|meal — List abandoned (historical) plans
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const planType = req.nextUrl.searchParams.get('type')
  if (!planType || !['run', 'strength', 'meal'].includes(planType)) {
    return badRequest('type param required (run, strength, or meal)')
  }

  const { data: plans, error } = await supabase
    .from('fitness_training_plans')
    .select('id, goal, weeks_total, started_at, config, created_on')
    .eq('user_id', user.id)
    .eq('plan_type', planType as 'run' | 'strength' | 'meal')
    .eq('status', 'abandoned')
    .order('started_at', { ascending: false })

  if (error) {
    console.error('[Fitness Plan History] error:', error)
    return serverError()
  }

  // Get log counts for each plan
  const planIds = (plans ?? []).map(p => p.id)
  const { data: logs } = planIds.length > 0
    ? await supabase
        .from('fitness_plan_workout_logs')
        .select('plan_id')
        .in('plan_id', planIds)
        .eq('completed', true)
    : { data: [] }

  const logCounts = new Map<string, number>()
  for (const log of logs ?? []) {
    logCounts.set(log.plan_id, (logCounts.get(log.plan_id) ?? 0) + 1)
  }

  const enriched = (plans ?? []).map(p => ({
    ...p,
    sessions_completed: logCounts.get(p.id) ?? 0,
  }))

  return apiOk({ plans: enriched })
}
