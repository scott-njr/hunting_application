import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, Activity, Dumbbell, UtensilsCrossed, Flame, Target, AlertTriangle, Calendar } from 'lucide-react'
import { PlanTableView } from '@/components/fitness/coach/plan-table-view'
import { StartNewPlanButton } from '@/components/fitness/coach/start-new-plan-button'
import { AdjustPlanButton } from '@/components/fitness/coach/adjust-plan-button'
import { SharePlanButton } from '@/components/fitness/coach/share-plan-button'
import { SharedPlanInbox } from '@/components/fitness/coach/shared-plan-inbox'
import { SharedPlansList } from '@/components/fitness/coach/shared-plans-list'
import { MyPlanMeals } from './my-plan-meals'
import { TodayChecklist } from './today-checklist'
import { ExpandableText } from '@/components/ui/expandable-text'

import { getCurrentWeek, getWeekMonday } from '@/lib/fitness/date-helpers'

function getTodayDayNumber(): number {
  const day = new Date().getDay()
  // Convert: Sunday=0 → 7, Monday=1, etc.
  return day === 0 ? 7 : day
}

/** Maps session count → which days of the week (1=Mon, ..., 7=Sun) */
const TRAINING_DAYS: Record<number, number[]> = {
  1: [1],
  2: [2, 4],             // Tue, Thu
  3: [1, 3, 5],          // Mon, Wed, Fri
  4: [1, 2, 4, 5],       // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5],    // Mon–Fri
}

type PlanData = {
  goal_summary?: string
  weeks?: Array<{
    week_number: number
    theme: string
    sessions: Array<Record<string, unknown>>
  }>
  days?: Array<{
    day_number: number
    day_name: string
    meals: Array<Record<string, unknown>>
    total_calories: number
    total_protein_g: number
    total_cost_usd: number
  }>
  grocery_list?: Array<{ item: string; estimated_cost_usd: number }>
  weekly_cost_usd?: number
  daily_targets?: Record<string, number>
}

export default async function MyPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all active plans in parallel
  const [runResult, strengthResult, mealResult] = await Promise.all([
    supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_type', 'run')
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_type', 'strength')
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_type', 'meal')
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const runPlan = runResult.data
  const strengthPlan = strengthResult.data
  const mealPlan = mealResult.data

  const hasAnyPlan = runPlan || strengthPlan || mealPlan

  // Fetch logs for all active plans (including notes + dates for table view)
  const planIds = [runPlan?.id, strengthPlan?.id, mealPlan?.id].filter(Boolean) as string[]
  let allLogs: Array<{ plan_id: string; week_number: number; session_number: number; notes: string | null; completed_at: string }> = []
  if (planIds.length > 0) {
    const { data } = await supabase
      .from('plan_workout_logs')
      .select('plan_id, week_number, session_number, notes, completed_at')
      .in('plan_id', planIds)
    allLogs = data ?? []
  }

  // Build logs map per plan: planId -> Map<weekNumber, Set<sessionNumber>>
  function buildLogsByWeek(planId: string) {
    const map = new Map<number, Set<number>>()
    for (const log of allLogs.filter(l => l.plan_id === planId)) {
      if (!map.has(log.week_number)) map.set(log.week_number, new Set())
      map.get(log.week_number)!.add(log.session_number)
    }
    return map
  }

  const runLogs = runPlan ? buildLogsByWeek(runPlan.id) : new Map<number, Set<number>>()
  const strengthLogs = strengthPlan ? buildLogsByWeek(strengthPlan.id) : new Map<number, Set<number>>()

  // Meal logs: only count this week's entries (meals repeat weekly, old logs shouldn't carry over)
  const thisWeekMonday = getWeekMonday(new Date())
  const thisWeekMondayStr = thisWeekMonday.toISOString().split('T')[0]
  const nextMonday = new Date(thisWeekMonday)
  nextMonday.setDate(nextMonday.getDate() + 7)
  const nextMondayStr = nextMonday.toISOString().split('T')[0]
  const mealLogsThisWeek = mealPlan
    ? allLogs.filter(l => l.plan_id === mealPlan.id && l.completed_at.split('T')[0] >= thisWeekMondayStr && l.completed_at.split('T')[0] < nextMondayStr)
    : []
  const mealLogs = new Map<number, Set<number>>()
  for (const log of mealLogsThisWeek) {
    if (!mealLogs.has(log.week_number)) mealLogs.set(log.week_number, new Set())
    mealLogs.get(log.week_number)!.add(log.session_number)
  }

  const runData = runPlan?.plan_data as PlanData | null
  const strengthData = strengthPlan?.plan_data as PlanData | null
  const mealData = mealPlan?.plan_data as PlanData | null

  const todayDayNumber = getTodayDayNumber()
  const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const todayMealsRaw = mealData?.days?.find(d => d.day_number === todayDayNumber)
  const todayMeals = todayMealsRaw ? { ...todayMealsRaw, day_name: DAY_NAMES[todayDayNumber] } : undefined

  // Current week for workout plans
  const runCurrentWeek = runPlan ? getCurrentWeek(runPlan.started_at, runPlan.weeks_total) : 0
  const strengthCurrentWeek = strengthPlan ? getCurrentWeek(strengthPlan.started_at, strengthPlan.weeks_total) : 0

  const runThisWeek = runData?.weeks?.find(w => w.week_number === runCurrentWeek)
  const strengthThisWeek = strengthData?.weeks?.find(w => w.week_number === strengthCurrentWeek)

  // Determine today's specific sessions based on training day mapping
  function getTodaySessions(weekData: { week_number: number; theme: string; sessions: Array<Record<string, unknown>> } | undefined, logs: Map<number, Set<number>>, currentWeek: number): Array<Record<string, unknown> & { session_number: number; isCompleted: boolean }> {
    if (!weekData) return []
    const sessionCount = weekData.sessions.length
    const trainingDays = TRAINING_DAYS[sessionCount] ?? TRAINING_DAYS[3]
    const todayIdx = trainingDays.indexOf(todayDayNumber)
    if (todayIdx === -1) return [] // no session today
    const session = weekData.sessions[todayIdx]
    if (!session) return []
    const sessionNum = todayIdx + 1
    const isCompleted = logs.get(currentWeek)?.has(sessionNum) ?? false
    return [{ ...session, session_number: sessionNum, isCompleted }]
  }

  const todayRunSessions = runThisWeek ? getTodaySessions(runThisWeek, runLogs, runCurrentWeek) : []
  const todayStrengthSessions = strengthThisWeek ? getTodaySessions(strengthThisWeek, strengthLogs, strengthCurrentWeek) : []
  const todayMealItems = todayMeals ? (todayMeals.meals as unknown as Array<{ meal_number: number; meal_type: string; title: string; calories: number; protein_g: number }>)
    .map(m => ({ ...m, isCompleted: mealLogs.get(todayDayNumber)?.has(m.meal_number) ?? false })) : []
  const hasTodayItems = todayRunSessions.length > 0 || todayStrengthSessions.length > 0 || todayMealItems.length > 0

  // Chart data builders
  function buildChartData(planData: PlanData | null, logsByWeek: Map<number, Set<number>>) {
    const sessionsPerWeek: number[] = []
    const completedPerWeek: number[] = []
    if (planData?.weeks) {
      for (const week of planData.weeks) {
        sessionsPerWeek.push(week.sessions.length)
        completedPerWeek.push(logsByWeek.get(week.week_number)?.size ?? 0)
      }
    }
    return { sessionsPerWeek, completedPerWeek }
  }

  const runChart = buildChartData(runData, runLogs)
  const strengthChart = buildChartData(strengthData, strengthLogs)

  // ── Streak & progress calculations ──
  const logDates = [...new Set(allLogs.map(l => l.completed_at.split('T')[0]))].sort().reverse()
  let streak = 0
  const today = new Date()
  for (let i = 0; i < logDates.length; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const checkStr = checkDate.toISOString().split('T')[0]
    if (logDates.includes(checkStr)) {
      streak++
    } else {
      break
    }
  }

  // This week's session progress (across run + strength)
  let thisWeekTotal = 0
  let thisWeekCompleted = 0
  if (runData?.weeks && runCurrentWeek > 0) {
    const rw = runData.weeks.find(w => w.week_number === runCurrentWeek)
    if (rw) {
      thisWeekTotal += rw.sessions.length
      thisWeekCompleted += runLogs.get(runCurrentWeek)?.size ?? 0
    }
  }
  if (strengthData?.weeks && strengthCurrentWeek > 0) {
    const sw = strengthData.weeks.find(w => w.week_number === strengthCurrentWeek)
    if (sw) {
      thisWeekTotal += sw.sessions.length
      thisWeekCompleted += strengthLogs.get(strengthCurrentWeek)?.size ?? 0
    }
  }

  // Missed sessions (past weeks only)
  let missedSessions = 0
  for (const plan of [
    { data: runData, logs: runLogs, currentWeek: runCurrentWeek },
    { data: strengthData, logs: strengthLogs, currentWeek: strengthCurrentWeek },
  ]) {
    if (!plan.data?.weeks) continue
    for (const week of plan.data.weeks) {
      if (week.week_number >= plan.currentWeek) continue
      const weekLogged = plan.logs.get(week.week_number) ?? new Set<number>()
      missedSessions += week.sessions.length - weekLogged.size
    }
  }

  // Build meal plan input for PlanTableView
  const mealPlanInput = mealPlan && mealData?.days ? {
    planId: mealPlan.id,
    days: mealData.days.map(d => ({
      day_number: d.day_number,
      day_name: d.day_name,
      meals: (d.meals as Array<{ meal_number: number; meal_type: string; title: string; calories: number; protein_g: number; ingredients?: string[]; instructions?: string }>),
    })),
    logsByDay: mealLogs,
    logs: allLogs.filter(l => l.plan_id === mealPlan.id),
  } : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-6 w-6 text-accent" />
        <h1 className="text-primary font-bold text-xl">My Fitness</h1>
      </div>

      {!hasAnyPlan ? (
        /* No plans — CTA cards */
        <div className="rounded-lg border border-subtle bg-surface p-6 text-center">
          <p className="text-secondary text-sm mb-4">
            You don&apos;t have any active plans yet. Create one to get started.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/fitness/run-coach"
              className="rounded-lg border border-subtle bg-elevated p-4 hover:border-accent transition-colors"
            >
              <Activity className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-primary text-sm font-medium">Run Coach</p>
              <p className="text-muted text-xs mt-1">8-week running plan</p>
            </Link>
            <Link
              href="/fitness/strength-coach"
              className="rounded-lg border border-subtle bg-elevated p-4 hover:border-accent transition-colors"
            >
              <Dumbbell className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-primary text-sm font-medium">Strength Coach</p>
              <p className="text-muted text-xs mt-1">8-week strength plan</p>
            </Link>
            <Link
              href="/fitness/meal-prep"
              className="rounded-lg border border-subtle bg-elevated p-4 hover:border-accent transition-colors"
            >
              <UtensilsCrossed className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-primary text-sm font-medium">Meal Prep</p>
              <p className="text-muted text-xs mt-1">7-day meal plan</p>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── Pending shared plan invitations ── */}
          <SharedPlanInbox
            hasActivePlanTypes={[
              ...(runPlan ? ['run'] : []),
              ...(strengthPlan ? ['strength'] : []),
              ...(mealPlan ? ['meal'] : []),
            ]}
          />

          {/* ── Today ── */}
          <div className="rounded-lg border border-accent/30 bg-surface p-5 space-y-4">
            {/* Date + Stats row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                <span className="text-primary font-semibold text-sm">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              {(runPlan || strengthPlan) && (
                <div className="flex items-center gap-4">
                  {streak > 0 && (
                    <div className="flex items-center gap-1.5" title={`${streak}-day streak`}>
                      <Flame className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-bold text-orange-400">{streak}</span>
                      <span className="text-[10px] text-muted uppercase">day{streak !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {thisWeekTotal > 0 && (
                    <div className="flex items-center gap-1.5" title={`${thisWeekCompleted}/${thisWeekTotal} sessions this week`}>
                      <Target className="h-4 w-4 text-accent" />
                      <span className="text-sm font-bold text-primary">{thisWeekCompleted}/{thisWeekTotal}</span>
                      <span className="text-[10px] text-muted uppercase">this week</span>
                    </div>
                  )}
                  {missedSessions > 0 && (
                    <div className="flex items-center gap-1.5" title={`${missedSessions} missed sessions`}>
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">{missedSessions}</span>
                      <span className="text-[10px] text-muted uppercase">missed</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Today's Checklist */}
            <TodayChecklist items={[
              ...todayRunSessions.map(s => ({
                id: `run-${runPlan!.id}-${runCurrentWeek}-${s.session_number}`,
                planId: runPlan!.id,
                weekNumber: runCurrentWeek,
                sessionNumber: s.session_number as number,
                label: (s.title as string) || 'Run Session',
                sublabel: [
                  s.distance_miles ? `${s.distance_miles} mi` : null,
                  s.duration_min ? `${s.duration_min} min` : null,
                  s.type ? (s.type as string).replace(/_/g, ' ') : null,
                ].filter(Boolean).join(' · ') || undefined,
                type: 'run' as const,
                isCompleted: s.isCompleted as boolean,
              })),
              ...todayStrengthSessions.map(s => ({
                id: `str-${strengthPlan!.id}-${strengthCurrentWeek}-${s.session_number}`,
                planId: strengthPlan!.id,
                weekNumber: strengthCurrentWeek,
                sessionNumber: s.session_number as number,
                label: (s.title as string) || 'Strength Session',
                sublabel: s.duration_min ? `${s.duration_min} min` : undefined,
                type: 'strength' as const,
                isCompleted: s.isCompleted as boolean,
              })),
              ...todayMealItems.map(m => ({
                id: `meal-${mealPlan!.id}-${todayDayNumber}-${m.meal_number}`,
                planId: mealPlan!.id,
                weekNumber: todayDayNumber,
                sessionNumber: m.meal_number,
                label: m.title || m.meal_type,
                sublabel: `${m.calories} cal · ${m.protein_g}g protein`,
                type: 'meal' as const,
                isCompleted: m.isCompleted,
              })),
            ]} />

            {/* CTAs for missing plans */}
            {(!runPlan || !strengthPlan || !mealPlan) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-subtle">
                {!runPlan && (
                  <Link href="/fitness/run-coach" className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
                    <Activity className="h-3.5 w-3.5" /> Add Run Plan
                  </Link>
                )}
                {!strengthPlan && (
                  <Link href="/fitness/strength-coach" className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
                    <Dumbbell className="h-3.5 w-3.5" /> Add Strength Plan
                  </Link>
                )}
                {!mealPlan && (
                  <Link href="/fitness/meal-prep" className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
                    <UtensilsCrossed className="h-3.5 w-3.5" /> Add Meal Plan
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Plan Cards with Adjust/New buttons ── */}
          <div className={`grid grid-cols-1 ${[runPlan, strengthPlan, mealPlan].filter(Boolean).length > 1 ? 'lg:grid-cols-2 xl:grid-cols-3' : ''} gap-4`}>
            {runPlan && runData && (
              <div className="rounded-lg border border-subtle bg-surface p-4 flex flex-col">
                <div className="flex items-center gap-2 h-7">
                  <Activity className="h-5 w-5 text-accent shrink-0" />
                  <h2 className="text-primary font-bold text-lg">Run Plan</h2>
                </div>
                <ExpandableText text={runData.goal_summary || 'AI-generated running plan'} />
                <div className="grid grid-cols-3 sm:gap-2 gap-1.5 text-center mt-3">
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{runPlan.weeks_total}</p>
                    <p className="text-muted text-[10px] uppercase">Weeks</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{runCurrentWeek}</p>
                    <p className="text-muted text-[10px] uppercase">Current</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{runChart.completedPerWeek.reduce((a, b) => a + b, 0)}</p>
                    <p className="text-muted text-[10px] uppercase">Logged</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 mt-auto border-t border-subtle">
                  <SharePlanButton planId={runPlan.id} />
                  <AdjustPlanButton planId={runPlan.id} planType="run" />
                  <StartNewPlanButton planType="run" />
                </div>
              </div>
            )}

            {strengthPlan && strengthData && (
              <div className="rounded-lg border border-subtle bg-surface p-4 flex flex-col">
                <div className="flex items-center gap-2 h-7">
                  <Dumbbell className="h-5 w-5 text-accent shrink-0" />
                  <h2 className="text-primary font-bold text-lg">Strength Plan</h2>
                </div>
                <ExpandableText text={strengthData.goal_summary || 'AI-generated strength plan'} />
                <div className="grid grid-cols-3 sm:gap-2 gap-1.5 text-center mt-3">
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{strengthPlan.weeks_total}</p>
                    <p className="text-muted text-[10px] uppercase">Weeks</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{strengthCurrentWeek}</p>
                    <p className="text-muted text-[10px] uppercase">Current</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{strengthChart.completedPerWeek.reduce((a, b) => a + b, 0)}</p>
                    <p className="text-muted text-[10px] uppercase">Logged</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 mt-auto border-t border-subtle">
                  <SharePlanButton planId={strengthPlan.id} />
                  <AdjustPlanButton planId={strengthPlan.id} planType="strength" />
                  <StartNewPlanButton planType="strength" />
                </div>
              </div>
            )}

            {mealPlan && mealData && (
              <div className="rounded-lg border border-subtle bg-surface p-4 flex flex-col">
                <div className="flex items-center gap-2 h-7">
                  <UtensilsCrossed className="h-5 w-5 text-accent shrink-0" />
                  <h2 className="text-primary font-bold text-lg">Meal Plan</h2>
                </div>
                <ExpandableText text={mealData.goal_summary || 'AI-generated 7-day meal plan'} />
                <div className="grid grid-cols-3 sm:gap-2 gap-1.5 text-center mt-3">
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">7</p>
                    <p className="text-muted text-[10px] uppercase">Days</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">
                      {mealData.daily_targets?.calories ?? mealData.days?.[0]?.total_calories ?? '—'}
                    </p>
                    <p className="text-muted text-[10px] uppercase">Cal/day</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">
                      {mealData.weekly_cost_usd ? `$${mealData.weekly_cost_usd.toFixed(0)}` : '—'}
                    </p>
                    <p className="text-muted text-[10px] uppercase">Cost/wk</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 mt-auto border-t border-subtle">
                  <SharePlanButton planId={mealPlan.id} />
                  <AdjustPlanButton planId={mealPlan.id} planType="meal" />
                  <StartNewPlanButton planType="meal" />
                </div>
              </div>
            )}
          </div>

          {/* ── Plan Breakdown ── */}
          {hasAnyPlan && (
            <div className="space-y-3">
              <h2 className="text-primary font-bold text-lg">Plan Breakdown</h2>
              <PlanTableView
                plans={[
                  ...(runPlan && runData?.weeks ? [{
                    planId: runPlan.id,
                    planType: 'run' as const,
                    weeks: runData.weeks as unknown as Parameters<typeof PlanTableView>[0]['plans'][0]['weeks'],
                    daysPerWeek: runData.weeks[0]?.sessions?.length ?? 3,
                    startedAt: runPlan.started_at,
                    logsByWeek: runLogs,
                    logs: allLogs.filter(l => l.plan_id === runPlan.id),
                  }] : []),
                  ...(strengthPlan && strengthData?.weeks ? [{
                    planId: strengthPlan.id,
                    planType: 'strength' as const,
                    weeks: strengthData.weeks as unknown as Parameters<typeof PlanTableView>[0]['plans'][0]['weeks'],
                    daysPerWeek: strengthData.weeks[0]?.sessions?.length ?? 3,
                    startedAt: strengthPlan.started_at,
                    logsByWeek: strengthLogs,
                    logs: allLogs.filter(l => l.plan_id === strengthPlan.id),
                  }] : []),
                ]}
                mealPlan={mealPlanInput}
                currentWeek={Math.max(runCurrentWeek, strengthCurrentWeek) || 1}
              />
            </div>
          )}

          {/* ── Shared Plans ── */}
          <SharedPlansList />

          <p className="text-muted text-xs text-center">
            AI-generated plans are general guidance. Consult a physician before starting any new exercise or diet program.
          </p>
        </>
      )}
    </div>
  )
}
