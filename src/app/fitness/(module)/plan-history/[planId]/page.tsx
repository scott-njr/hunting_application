import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity, Dumbbell, UtensilsCrossed } from 'lucide-react'
import { PlanComparisonChart } from '@/components/fitness/coach/plan-comparison-chart'
import { PlanCompareDetail } from '@/components/fitness/coach/plan-compare-detail'
import { RevertButton } from './revert-button'

const PLAN_ICONS: Record<string, typeof Activity> = {
  run: Activity,
  strength: Dumbbell,
  meal: UtensilsCrossed,
}

const PLAN_LABELS: Record<string, string> = {
  run: 'Run Plan',
  strength: 'Strength Plan',
  meal: 'Meal Plan',
}

export default async function PlanHistoryComparePage({ params }: { params: Promise<{ planId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { planId } = await params

  // Fetch the historical (abandoned) plan
  const { data: historicalPlan } = await supabase
    .from('fitness_training_plans')
    .select('id, user_id, plan_type, plan_data, goal, weeks_total, started_at')
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('status', 'abandoned')
    .maybeSingle()

  if (!historicalPlan) redirect('/fitness/my-plan')

  // Fetch current active plan of the same type
  const { data: activePlan } = await supabase
    .from('fitness_training_plans')
    .select('id, plan_type, plan_data, goal, weeks_total, started_at')
    .eq('user_id', user.id)
    .eq('plan_type', historicalPlan.plan_type)
    .eq('status', 'active')
    .maybeSingle()

  // Fetch logs for both plans
  const planIds = [historicalPlan.id, ...(activePlan ? [activePlan.id] : [])]
  const { data: allLogs } = await supabase
    .from('fitness_plan_workout_logs')
    .select('plan_id, week_number, session_number')
    .in('plan_id', planIds)

  const logs = allLogs ?? []

  function buildWeekMap(planLogs: typeof logs) {
    const map = new Map<number, Set<number>>()
    for (const l of planLogs) {
      if (!map.has(l.week_number)) map.set(l.week_number, new Set())
      map.get(l.week_number)!.add(l.session_number)
    }
    return map
  }

  const historicalLogs = logs.filter(l => l.plan_id === historicalPlan.id)
  const activeLogs = activePlan ? logs.filter(l => l.plan_id === activePlan.id) : []
  const historicalWeekMap = buildWeekMap(historicalLogs)
  const activeWeekMap = buildWeekMap(activeLogs)

  type SessionData = {
    session_number: number
    title: string
    type: string
    description?: string
    distance_miles?: number
    duration_min?: number
    effort_level?: string
    exercises?: Array<{ name: string; sets: number; reps: string; notes?: string }>
    warmup?: string
    cooldown?: string
  }
  type WeekData = { week_number: number; theme?: string; focus?: string; sessions: SessionData[] }
  type PlanDataShape = { weeks?: WeekData[] }

  const historicalData = historicalPlan.plan_data as PlanDataShape | null
  const activeData = activePlan?.plan_data as PlanDataShape | null
  const historicalWeeks = historicalData?.weeks ?? []
  const activeWeeks = activeData?.weeks ?? []
  const maxWeeks = Math.max(historicalWeeks.length, activeWeeks.length)

  // Build chart comparison data
  const chartComparison = Array.from({ length: maxWeeks }, (_, i) => {
    const hw = historicalWeeks[i]
    const aw = activeWeeks[i]
    const weekNum = i + 1
    const sessions = aw?.sessions ?? hw?.sessions ?? []
    const ac = activeWeekMap.get(weekNum) ?? new Set<number>()
    const hc = historicalWeekMap.get(weekNum) ?? new Set<number>()
    return {
      week_number: weekNum,
      theme: aw?.theme ?? hw?.theme ?? '',
      total_sessions: sessions.length,
      source_completed: ac.size,
      target_completed: hc.size,
    }
  })

  // Build detailed week comparison for the client component
  const detailWeeks = Array.from({ length: maxWeeks }, (_, i) => {
    const weekNum = i + 1
    return {
      week_number: weekNum,
      current: activeWeeks[i] ?? null,
      previous: historicalWeeks[i] ?? null,
      currentCompleted: [...(activeWeekMap.get(weekNum) ?? [])],
      previousCompleted: [...(historicalWeekMap.get(weekNum) ?? [])],
    }
  })

  const totalSessions = chartComparison.reduce((sum, w) => sum + w.total_sessions, 0)
  const activeCompleted = activeLogs.length
  const historicalCompleted = historicalLogs.length
  const activePct = totalSessions > 0 ? Math.round((activeCompleted / totalSessions) * 100) : 0
  const historicalPct = totalSessions > 0 ? Math.round((historicalCompleted / totalSessions) * 100) : 0

  const PlanIcon = PLAN_ICONS[historicalPlan.plan_type] ?? Activity
  const planLabel = PLAN_LABELS[historicalPlan.plan_type] ?? 'Plan'

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/fitness/my-plan" className="text-muted hover:text-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PlanIcon className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-primary font-bold text-xl">{planLabel} History</h1>
            <p className="text-muted text-sm">New Plan vs Previous (started {formatDate(historicalPlan.started_at)})</p>
          </div>
        </div>
        <RevertButton planId={historicalPlan.id} planType={historicalPlan.plan_type} />
      </div>

      {/* Goals comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activePlan?.goal && (
          <div className="rounded border border-accent/20 bg-surface p-3">
            <p className="text-muted text-xs uppercase mb-1">New Plan</p>
            <p className="text-secondary text-sm">{activePlan.goal}</p>
          </div>
        )}
        {historicalPlan.goal && (
          <div className="rounded border border-blue-400/20 bg-surface p-3">
            <p className="text-muted text-xs uppercase mb-1">Previous Plan</p>
            <p className="text-secondary text-sm">{historicalPlan.goal}</p>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-accent/30 bg-surface p-4 text-center">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">New Plan</p>
          <p className="text-3xl font-bold text-accent">{activePct}%</p>
          <p className="text-muted text-xs mt-1">{activeCompleted}/{totalSessions} sessions</p>
        </div>
        <div className="rounded-lg border border-blue-400/30 bg-surface p-4 text-center">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Previous Plan</p>
          <p className="text-3xl font-bold text-blue-400">{historicalPct}%</p>
          <p className="text-muted text-xs mt-1">{historicalCompleted}/{totalSessions} sessions</p>
        </div>
      </div>

      {/* Chart */}
      {chartComparison.length > 0 && (
        <PlanComparisonChart
          weeks={chartComparison}
          sourceName="New"
          targetName="Previous"
        />
      )}

      {/* Detailed week-by-week comparison with cherry-pick */}
      {activePlan && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-primary font-bold text-sm">Week-by-Week Comparison</h2>
            {historicalPlan.plan_type !== 'meal' && (
              <p className="text-muted text-xs">Select weeks from the previous plan to add to your new plan</p>
            )}
          </div>
          <PlanCompareDetail
            activePlanId={activePlan.id}
            sourcePlanId={historicalPlan.id}
            weeks={detailWeeks}
            planType={historicalPlan.plan_type}
          />
        </div>
      )}
    </div>
  )
}
