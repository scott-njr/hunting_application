import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/fitness/plans/history?type=run|strength|meal — List abandoned (historical) plans
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planType = req.nextUrl.searchParams.get('type')
  if (!planType || !['run', 'strength', 'meal'].includes(planType)) {
    return NextResponse.json({ error: 'type param required (run, strength, or meal)' }, { status: 400 })
  }

  const { data: plans, error } = await supabase
    .from('fitness_training_plans')
    .select('id, goal, weeks_total, started_at, config, created_at')
    .eq('user_id', user.id)
    .eq('plan_type', planType as 'run' | 'strength' | 'meal')
    .eq('status', 'abandoned')
    .order('started_at', { ascending: false })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Get log counts for each plan
  const planIds = (plans ?? []).map(p => p.id)
  const { data: logs } = planIds.length > 0
    ? await supabase
        .from('fitness_plan_workout_logs')
        .select('plan_id')
        .in('plan_id', planIds)
    : { data: [] }

  const logCounts = new Map<string, number>()
  for (const log of logs ?? []) {
    logCounts.set(log.plan_id, (logCounts.get(log.plan_id) ?? 0) + 1)
  }

  const enriched = (plans ?? []).map(p => ({
    ...p,
    sessions_completed: logCounts.get(p.id) ?? 0,
  }))

  return NextResponse.json({ plans: enriched })
}
