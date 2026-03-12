import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getCurrentWeek, getWeekMonday } from '@/lib/fitness/date-helpers'
import { apiDone, unauthorized, notFound, badRequest, serverError, withHandler } from '@/lib/api-response'

const TRAINING_DAYS: Record<number, number[]> = {
  1: [1],
  2: [2, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
}

// POST /api/fitness/plans/[planId]/catch-up
// Shifts the plan timeline so the next unfinished workout falls on today.
// No AI call — pure schedule adjustment.
export const POST = withHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { planId } = await params

  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!plan) return notFound('Plan not found')
  if (plan.plan_type === 'meal') {
    return badRequest('Catch up is not available for meal plans')
  }

  const config = plan.config as Record<string, unknown>
  const daysPerWeek = (config.daysPerWeek as number) ?? 3
  const trainingDays = TRAINING_DAYS[daysPerWeek] ?? TRAINING_DAYS[3]
  const currentWeek = getCurrentWeek(plan.started_at, plan.weeks_total)

  // Get all completed logs for this plan
  const { data: logs } = await supabase
    .from('fitness_plan_workout_logs')
    .select('week_number, session_number')
    .eq('plan_id', planId)
    .eq('completed', true)

  const completedSet = new Set((logs ?? []).map(l => `${l.week_number}:${l.session_number}`))

  // Find the first uncompleted session from current week onward
  const planData = plan.plan_data as Record<string, unknown>
  const weeks = (planData.weeks ?? []) as Array<{ sessions: unknown[] }>

  let target: { week: number; sessionIndex: number } | null = null
  for (let w = currentWeek - 1; w < weeks.length; w++) {
    const weekNum = w + 1
    const sessions = weeks[w]?.sessions ?? []
    for (let s = 0; s < sessions.length; s++) {
      if (!completedSet.has(`${weekNum}:${s + 1}`)) {
        target = { week: weekNum, sessionIndex: s + 1 }
        break
      }
    }
    if (target) break
  }

  if (!target) {
    return badRequest('All sessions are already completed')
  }

  // Calculate new started_at so that target session falls on today.
  // Session sessionIndex maps to trainingDays[sessionIndex-1] (day of week, 1=Mon).
  // We need: weekMonday(today) + (target training day - 1) days = today
  //          started_at = weekMonday(today) - (target.week - 1) * 7 days
  const today = new Date()
  const todayMonday = getWeekMonday(today)

  // Shift so that target.week's Monday aligns with this week's Monday
  const newStart = new Date(todayMonday)
  newStart.setDate(newStart.getDate() - (target.week - 1) * 7)

  // But we also need the specific session to land on today.
  // Today's day number (1=Mon..7=Sun):
  const jsDay = today.getDay()
  const todayDayNum = jsDay === 0 ? 7 : jsDay
  const targetTrainingDay = trainingDays[target.sessionIndex - 1]

  if (targetTrainingDay !== undefined && targetTrainingDay !== todayDayNum) {
    // Shift start so the target training day lands on today
    // Training day offset from Monday = targetTrainingDay - 1
    // Today's offset from Monday = todayDayNum - 1
    // Difference = todayDayNum - targetTrainingDay
    const dayShift = todayDayNum - targetTrainingDay
    newStart.setDate(newStart.getDate() + dayShift)
  }

  const newStartedAt = newStart.toISOString()

  const { error } = await supabase
    .from('fitness_training_plans')
    .update({ started_at: newStartedAt })
    .eq('id', planId)

  if (error) return serverError()

  const newCurrentWeek = getCurrentWeek(newStartedAt, plan.weeks_total)

  return apiDone({
    started_at: newStartedAt,
    current_week: newCurrentWeek,
    next_session: target as Record<string, unknown>,
  })
})

