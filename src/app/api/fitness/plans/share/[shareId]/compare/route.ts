import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, notFound } from '@/lib/api-response'

// GET /api/fitness/plans/share/[shareId]/compare — Comparison data for shared plan
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { shareId } = await params

  // Fetch the share — RLS ensures user is source or target
  const { data: share } = await supabase
    .from('fitness_shared_plans')
    .select('*')
    .eq('id', shareId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!share || !share.target_plan_id) {
    return notFound('Shared plan not found or not accepted')
  }

  // Fetch both plans (cross-plan RLS policies allow this)
  const [sourceResult, targetResult] = await Promise.all([
    supabase
      .from('fitness_training_plans')
      .select('id, user_id, plan_type, plan_data, goal, weeks_total, started_at')
      .eq('id', share.source_plan_id)
      .single(),
    supabase
      .from('fitness_training_plans')
      .select('id, user_id, plan_type, plan_data, goal, weeks_total, started_at')
      .eq('id', share.target_plan_id)
      .single(),
  ])

  if (!sourceResult.data || !targetResult.data) {
    return notFound('One or both plans no longer exist')
  }

  // Fetch both plans' logs (cross-plan RLS policies allow this)
  const { data: allLogs } = await supabase
    .from('fitness_plan_workout_logs')
    .select('plan_id, week_number, session_number, notes, completed_at')
    .in('plan_id', [share.source_plan_id, share.target_plan_id])
    .eq('completed', true)

  const logs = allLogs ?? []
  const sourceLogs = logs.filter(l => l.plan_id === share.source_plan_id)
  const targetLogs = logs.filter(l => l.plan_id === share.target_plan_id)

  // Build per-week completion maps
  function buildWeekMap(planLogs: typeof logs) {
    const map: Record<number, Set<number>> = {}
    for (const l of planLogs) {
      if (!map[l.week_number]) map[l.week_number] = new Set()
      map[l.week_number].add(l.session_number)
    }
    return map
  }

  const sourceWeekMap = buildWeekMap(sourceLogs)
  const targetWeekMap = buildWeekMap(targetLogs)

  // Build comparison per week using source plan structure (they should be identical)
  type PlanData = { weeks?: Array<{ week_number: number; theme: string; sessions: Array<{ session_number: number; title: string; type: string }> }> }
  const sourcePlanData = sourceResult.data.plan_data as PlanData | null
  const weeks = sourcePlanData?.weeks ?? []

  const comparison = weeks.map(week => {
    const sourceCompleted = sourceWeekMap[week.week_number] ?? new Set<number>()
    const targetCompleted = targetWeekMap[week.week_number] ?? new Set<number>()

    return {
      week_number: week.week_number,
      theme: week.theme,
      total_sessions: week.sessions.length,
      source_completed: sourceCompleted.size,
      target_completed: targetCompleted.size,
      sessions: week.sessions.map(s => ({
        session_number: s.session_number,
        title: s.title,
        type: s.type,
        source_done: sourceCompleted.has(s.session_number),
        target_done: targetCompleted.has(s.session_number),
      })),
    }
  })

  // Fetch display names for both users
  const { data: profiles } = await supabase
    .from('user_profile')
    .select('id, display_name')
    .in('id', [share.source_user_id, share.target_user_id])

  const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  // Summary stats
  const totalSessions = weeks.reduce((sum, w) => sum + w.sessions.length, 0)
  const sourceTotalCompleted = sourceLogs.filter(l => l.session_number > 0).length
  const targetTotalCompleted = targetLogs.filter(l => l.session_number > 0).length

  return apiOk({
    share_id: share.id,
    plan_type: sourceResult.data.plan_type,
    goal: sourceResult.data.goal,
    source: {
      user_id: share.source_user_id,
      name: nameMap.get(share.source_user_id) ?? 'Unknown',
      plan_id: share.source_plan_id,
      total_completed: sourceTotalCompleted,
      completion_pct: totalSessions > 0 ? Math.round((sourceTotalCompleted / totalSessions) * 100) : 0,
    },
    target: {
      user_id: share.target_user_id,
      name: nameMap.get(share.target_user_id) ?? 'Unknown',
      plan_id: share.target_plan_id,
      total_completed: targetTotalCompleted,
      completion_pct: totalSessions > 0 ? Math.round((targetTotalCompleted / totalSessions) * 100) : 0,
    },
    total_sessions: totalSessions,
    weeks: comparison,
    is_source: user.id === share.source_user_id,
  })
}
