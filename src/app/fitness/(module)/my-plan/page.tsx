import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, Activity, Dumbbell, UtensilsCrossed, Flame, Target, AlertTriangle, Calendar, Trophy } from 'lucide-react'
import { PlanTableView } from '@/components/fitness/coach/plan-table-view'
import { StartNewPlanButton } from '@/components/fitness/coach/start-new-plan-button'
import { AdjustPlanButton } from '@/components/fitness/coach/adjust-plan-button'
import { SharePlanButton } from '@/components/fitness/coach/share-plan-button'
import { SharedPlanInbox } from '@/components/fitness/coach/shared-plan-inbox'
import { SharedPlansList } from '@/components/fitness/coach/shared-plans-list'
import { SharedItemsInbox } from '@/components/fitness/coach/shared-items-inbox'
import { ChallengesInbox } from '@/components/fitness/coach/challenges-inbox'
import { PlanHistoryButton } from '@/components/fitness/coach/plan-history-button'
import { CatchUpButton } from '@/components/fitness/coach/catch-up-button'
import { TodayChecklist } from './today-checklist'
import { ExpandableText } from '@/components/ui/expandable-text'

import { getCurrentWeek } from '@/lib/fitness/date-helpers'
import { EXERCISE_DISCLAIMER } from '@/lib/fitness/constants'

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
      .from('fitness_training_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_type', 'run')
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('fitness_training_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_type', 'strength')
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('fitness_training_plans')
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

  // Fetch leaderboard: try calculated points first, fall back to raw submissions
  const [{ data: leaderboardPoints }, { data: allSubmissions }] = await Promise.all([
    supabase.from('fitness_leaderboard_points').select('user_id, points'),
    supabase.from('fitness_workout_submissions').select('user_id'),
  ])

  let myRank: number | null = null
  let myTotalPoints = 0
  let totalParticipants = 0

  if (leaderboardPoints && leaderboardPoints.length > 0) {
    const userTotals: Record<string, number> = {}
    for (const row of leaderboardPoints) {
      userTotals[row.user_id] = (userTotals[row.user_id] ?? 0) + row.points
    }
    const sorted = Object.entries(userTotals).sort((a, b) => b[1] - a[1])
    totalParticipants = sorted.length
    const myIdx = sorted.findIndex(([uid]) => uid === user.id)
    if (myIdx !== -1) {
      myRank = myIdx + 1
      myTotalPoints = sorted[myIdx][1]
    }
  } else if (allSubmissions && allSubmissions.length > 0) {
    // Points not yet calculated — rank by submission count
    const userCounts: Record<string, number> = {}
    for (const row of allSubmissions) {
      userCounts[row.user_id] = (userCounts[row.user_id] ?? 0) + 1
    }
    const sorted = Object.entries(userCounts).sort((a, b) => b[1] - a[1])
    totalParticipants = sorted.length
    const myIdx = sorted.findIndex(([uid]) => uid === user.id)
    if (myIdx !== -1) {
      myRank = myIdx + 1
      myTotalPoints = sorted[myIdx][1]
    }
  }

  // Fetch logs for all active plans (including notes + dates for table view)
  const planIds = [runPlan?.id, strengthPlan?.id, mealPlan?.id].filter(Boolean) as string[]
  let allLogs: Array<{ plan_id: string; week_number: number; session_number: number; notes: string | null; completed: boolean; completed_at: string }> = []
  if (planIds.length > 0) {
    const { data } = await supabase
      .from('fitness_plan_workout_logs')
      .select('plan_id, week_number, session_number, notes, completed, completed_at')
      .in('plan_id', planIds)
    allLogs = data ?? []
  }

  // Build logs map per plan: planId -> Map<weekNumber, Set<sessionNumber>> (completed only)
  function buildLogsByWeek(planId: string) {
    const map = new Map<number, Set<number>>()
    for (const log of allLogs.filter(l => l.plan_id === planId && l.completed)) {
      if (!map.has(log.week_number)) map.set(log.week_number, new Set())
      map.get(log.week_number)!.add(log.session_number)
    }
    return map
  }

  const runLogs = runPlan ? buildLogsByWeek(runPlan.id) : new Map<number, Set<number>>()
  const strengthLogs = strengthPlan ? buildLogsByWeek(strengthPlan.id) : new Map<number, Set<number>>()
  const mealLogs = mealPlan ? buildLogsByWeek(mealPlan.id) : new Map<number, Set<number>>()

  const runData = runPlan?.plan_data as PlanData | null
  const strengthData = strengthPlan?.plan_data as PlanData | null
  const mealData = mealPlan?.plan_data as PlanData | null

  const todayDayNumber = getTodayDayNumber()

  // Current week for all plans
  const runCurrentWeek = runPlan ? getCurrentWeek(runPlan.started_at, runPlan.weeks_total) : 0
  const strengthCurrentWeek = strengthPlan ? getCurrentWeek(strengthPlan.started_at, strengthPlan.weeks_total) : 0
  const mealCurrentWeek = mealPlan ? getCurrentWeek(mealPlan.started_at, mealPlan.weeks_total) : 0

  const runThisWeek = runData?.weeks?.find(w => w.week_number === runCurrentWeek)
  const strengthThisWeek = strengthData?.weeks?.find(w => w.week_number === strengthCurrentWeek)
  const mealThisWeek = mealData?.weeks?.find(w => w.week_number === mealCurrentWeek)

  // Determine today's specific sessions based on training day mapping
  function getTodaySessions(weekData: { week_number: number; theme: string; sessions: Array<Record<string, unknown>> } | undefined, logs: Map<number, Set<number>>, currentWeek: number): Array<Record<string, unknown> & { session_number: number; isCompleted: boolean }> {
    if (!weekData) return []
    const sessionCount = weekData.sessions.length
    const trainingDays = TRAINING_DAYS[sessionCount] ?? TRAINING_DAYS[3]
    const todayIdx = trainingDays.indexOf(todayDayNumber)
    if (todayIdx === -1) return [] // no session today
    const session = weekData.sessions[todayIdx]
    if (!session) return []
    // Use session_number from the plan JSON — must match what PlanTableView uses
    // so logs are consistent between the Today checklist and the Plan Breakdown table
    const sessionNum = (session.session_number as number) ?? (todayIdx + 1)
    const isCompleted = logs.get(currentWeek)?.has(sessionNum) ?? false
    return [{ ...session, session_number: sessionNum, isCompleted }]
  }

  const todayRunSessions = runThisWeek ? getTodaySessions(runThisWeek, runLogs, runCurrentWeek) : []
  const todayStrengthSessions = strengthThisWeek ? getTodaySessions(strengthThisWeek, strengthLogs, strengthCurrentWeek) : []

  // Today's meals: filter current week's sessions by today's day_number
  type MealSession = Record<string, unknown> & { session_number: number; isCompleted: boolean }
  const todayMealSessions: MealSession[] = mealThisWeek
    ? (mealThisWeek.sessions as Array<Record<string, unknown>>)
        .filter(s => (s.day_number as number) === todayDayNumber)
        .map(s => {
          const sessionNum = (s.session_number as number)
          const isCompleted = mealLogs.get(mealCurrentWeek)?.has(sessionNum) ?? false
          return { ...s, session_number: sessionNum, isCompleted }
        })
    : []
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

  // This week's session progress (across run + strength + meal)
  let thisWeekTotal = 0
  let thisWeekCompleted = 0
  for (const { data, logs, cw } of [
    { data: runData, logs: runLogs, cw: runCurrentWeek },
    { data: strengthData, logs: strengthLogs, cw: strengthCurrentWeek },
    { data: mealData, logs: mealLogs, cw: mealCurrentWeek },
  ]) {
    if (!data?.weeks || cw <= 0) continue
    const wk = data.weeks.find(w => w.week_number === cw)
    if (wk) {
      thisWeekTotal += wk.sessions.length
      thisWeekCompleted += logs.get(cw)?.size ?? 0
    }
  }

  // Missed sessions (past weeks only — run + strength only, meals don't count as "missed")
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

  // No separate mealPlanInput — meals are now part of the plans array

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
              <p className="text-muted text-xs mt-1">8-week meal plan</p>
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
          <ChallengesInbox />
          <SharedItemsInbox />

          {/* ── Today + Leaderboard ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                details: s as Record<string, unknown>,
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
                details: s as Record<string, unknown>,
              })),
              ...todayMealSessions.map(s => ({
                id: `meal-${mealPlan!.id}-${mealCurrentWeek}-${s.session_number}`,
                planId: mealPlan!.id,
                weekNumber: mealCurrentWeek,
                sessionNumber: s.session_number,
                label: (s.title as string) || (s.meal_type as string) || 'Meal',
                sublabel: `${s.calories ?? ''} cal · ${s.protein_g ?? ''}g protein`,
                type: 'meal' as const,
                isCompleted: s.isCompleted,
                details: s as Record<string, unknown>,
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

            {/* Leaderboard Rank Card */}
            <Link href="/fitness/community/leaderboard" className="rounded-lg border border-accent/30 bg-surface p-5 flex flex-col items-center justify-center text-center hover:border-accent transition-colors">
              <Trophy className={`h-8 w-8 mb-2 ${myRank !== null && myRank <= 3 ? 'text-amber-400' : 'text-accent'}`} />
              <span className="text-muted text-[10px] uppercase tracking-wider mb-1">Leaderboard</span>
              {myRank !== null ? (
                <>
                  <span className="text-3xl font-bold text-primary">#{myRank}</span>
                  <span className="text-muted text-xs mt-0.5">of {totalParticipants}</span>
                  <div className="mt-3 pt-3 border-t border-subtle w-full">
                    <span className="text-accent font-bold text-lg">{myTotalPoints}</span>
                    <span className="text-muted text-xs ml-1">pts</span>
                  </div>
                </>
              ) : (
                <span className="text-muted text-xs mt-1">Complete a weekly challenge to get ranked</span>
              )}
            </Link>
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
                  <PlanHistoryButton planType="run" />
                  <SharePlanButton planId={runPlan.id} />
                  <AdjustPlanButton planId={runPlan.id} planType="run" />
                  <CatchUpButton planId={runPlan.id} planType="run" />
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
                  <PlanHistoryButton planType="strength" />
                  <SharePlanButton planId={strengthPlan.id} />
                  <AdjustPlanButton planId={strengthPlan.id} planType="strength" />
                  <CatchUpButton planId={strengthPlan.id} planType="strength" />
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
                <ExpandableText text={mealData.goal_summary || 'AI-generated 8-week meal plan'} />
                <div className="grid grid-cols-3 sm:gap-2 gap-1.5 text-center mt-3">
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{mealPlan.weeks_total}</p>
                    <p className="text-muted text-[10px] uppercase">Weeks</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">{mealCurrentWeek}</p>
                    <p className="text-muted text-[10px] uppercase">Current</p>
                  </div>
                  <div className="rounded bg-elevated p-2">
                    <p className="text-primary text-sm font-bold">
                      {mealData.daily_targets?.calories ?? '—'}
                    </p>
                    <p className="text-muted text-[10px] uppercase">Cal/day</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 mt-auto border-t border-subtle">
                  <PlanHistoryButton planType="meal" />
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
                  ...(mealPlan && mealData?.weeks ? [{
                    planId: mealPlan.id,
                    planType: 'meal' as const,
                    weeks: mealData.weeks as unknown as Parameters<typeof PlanTableView>[0]['plans'][0]['weeks'],
                    daysPerWeek: 7,
                    startedAt: mealPlan.started_at,
                    logsByWeek: mealLogs,
                    logs: allLogs.filter(l => l.plan_id === mealPlan.id),
                  }] : []),
                ]}
                currentWeek={Math.max(runCurrentWeek, strengthCurrentWeek, mealCurrentWeek) || 1}
              />
            </div>
          )}

          {/* ── Shared Plans ── */}
          <SharedPlansList />

          <p className="text-muted text-xs text-center">
            {EXERCISE_DISCLAIMER}
          </p>
        </>
      )}
    </div>
  )
}
