import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity, Dumbbell, UtensilsCrossed, Check, Minus } from 'lucide-react'
import { PlanComparisonChart } from '@/components/fitness/coach/plan-comparison-chart'

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

export default async function ComparePage({ params }: { params: Promise<{ shareId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { shareId } = await params

  // Fetch the share
  const { data: share } = await supabase
    .from('shared_plans')
    .select('*')
    .eq('id', shareId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!share || !share.target_plan_id) redirect('/fitness/my-plan')

  // Fetch both plans
  const [sourceResult, targetResult] = await Promise.all([
    supabase
      .from('training_plans')
      .select('id, user_id, plan_type, plan_data, goal, weeks_total, started_at')
      .eq('id', share.source_plan_id)
      .single(),
    supabase
      .from('training_plans')
      .select('id, user_id, plan_type, plan_data, goal, weeks_total, started_at')
      .eq('id', share.target_plan_id)
      .single(),
  ])

  if (!sourceResult.data || !targetResult.data) redirect('/fitness/my-plan')

  const sourcePlan = sourceResult.data
  const targetPlan = targetResult.data

  // Fetch logs for both plans
  const { data: allLogs } = await supabase
    .from('plan_workout_logs')
    .select('plan_id, week_number, session_number, completed_at')
    .in('plan_id', [share.source_plan_id, share.target_plan_id])

  const logs = allLogs ?? []
  const sourceLogs = logs.filter(l => l.plan_id === share.source_plan_id)
  const targetLogs = logs.filter(l => l.plan_id === share.target_plan_id)

  function buildWeekMap(planLogs: typeof logs) {
    const map = new Map<number, Set<number>>()
    for (const l of planLogs) {
      if (!map.has(l.week_number)) map.set(l.week_number, new Set())
      map.get(l.week_number)!.add(l.session_number)
    }
    return map
  }

  const sourceWeekMap = buildWeekMap(sourceLogs)
  const targetWeekMap = buildWeekMap(targetLogs)

  // Fetch display names
  const { data: profiles } = await supabase
    .from('hunter_profiles')
    .select('id, display_name')
    .in('id', [share.source_user_id, share.target_user_id])

  const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name ?? 'Unknown']))
  const sourceName = nameMap.get(share.source_user_id) ?? 'Unknown'
  const targetName = nameMap.get(share.target_user_id) ?? 'Unknown'

  // Build comparison data
  type PlanData = { weeks?: Array<{ week_number: number; theme: string; sessions: Array<{ session_number: number; title: string; type: string }> }> }
  const planData = sourcePlan.plan_data as PlanData | null
  const weeks = planData?.weeks ?? []

  const comparison = weeks.map(week => {
    const sc = sourceWeekMap.get(week.week_number) ?? new Set<number>()
    const tc = targetWeekMap.get(week.week_number) ?? new Set<number>()
    return {
      week_number: week.week_number,
      theme: week.theme,
      total_sessions: week.sessions.length,
      source_completed: sc.size,
      target_completed: tc.size,
      sessions: week.sessions.map(s => ({
        ...s,
        source_done: sc.has(s.session_number),
        target_done: tc.has(s.session_number),
      })),
    }
  })

  const totalSessions = weeks.reduce((sum, w) => sum + w.sessions.length, 0)
  const sourceTotalCompleted = sourceLogs.filter(l => l.session_number > 0).length
  const targetTotalCompleted = targetLogs.filter(l => l.session_number > 0).length
  const sourcePct = totalSessions > 0 ? Math.round((sourceTotalCompleted / totalSessions) * 100) : 0
  const targetPct = totalSessions > 0 ? Math.round((targetTotalCompleted / totalSessions) * 100) : 0

  const PlanIcon = PLAN_ICONS[sourcePlan.plan_type] ?? Activity
  const planLabel = PLAN_LABELS[sourcePlan.plan_type] ?? 'Plan'
  const isSource = user.id === share.source_user_id
  const youName = isSource ? sourceName : targetName
  const partnerName = isSource ? targetName : sourceName

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/fitness/my-plan" className="text-muted hover:text-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PlanIcon className="h-6 w-6 text-accent" />
        <div>
          <h1 className="text-primary font-bold text-xl">{planLabel} Comparison</h1>
          <p className="text-muted text-sm">{youName} vs {partnerName}</p>
        </div>
      </div>

      {sourcePlan.goal && (
        <p className="text-secondary text-sm">{sourcePlan.goal}</p>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-accent/30 bg-surface p-4 text-center">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">{isSource ? 'You' : sourceName}</p>
          <p className="text-3xl font-bold text-accent">{sourcePct}%</p>
          <p className="text-muted text-xs mt-1">{sourceTotalCompleted}/{totalSessions} sessions</p>
        </div>
        <div className="rounded-lg border border-blue-400/30 bg-surface p-4 text-center">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">{isSource ? partnerName : 'You'}</p>
          <p className="text-3xl font-bold text-blue-400">{targetPct}%</p>
          <p className="text-muted text-xs mt-1">{targetTotalCompleted}/{totalSessions} sessions</p>
        </div>
      </div>

      {/* Chart */}
      <PlanComparisonChart
        weeks={comparison}
        sourceName={isSource ? 'You' : sourceName}
        targetName={isSource ? partnerName : 'You'}
      />

      {/* Week-by-week detail */}
      <div className="space-y-4">
        {comparison.map(week => (
          <div key={week.week_number} className="rounded-lg border border-subtle bg-surface overflow-hidden">
            {/* Week header */}
            <div className="px-4 py-2 bg-elevated/50 border-b border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold text-xs">Week {week.week_number}</span>
                <span className="text-muted text-xs">— {week.theme}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-accent font-medium">{isSource ? 'You' : sourceName}: {week.source_completed}/{week.total_sessions}</span>
                <span className="text-blue-400 font-medium">{isSource ? partnerName : 'You'}: {week.target_completed}/{week.total_sessions}</span>
              </div>
            </div>

            {/* Sessions */}
            <div className="divide-y divide-subtle/50">
              {week.sessions.map(session => (
                <div key={session.session_number} className="px-4 py-2 flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-elevated border border-subtle text-muted capitalize whitespace-nowrap">
                      {session.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-primary truncate">{session.title}</span>
                  </div>

                  {/* Source status */}
                  <div className="flex items-center gap-1 w-20 justify-center" title={isSource ? 'You' : sourceName}>
                    {session.source_done ? (
                      <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-subtle flex items-center justify-center">
                        <Minus className="h-3 w-3 text-muted/40" />
                      </div>
                    )}
                    <span className="text-[10px] text-muted">{isSource ? 'You' : sourceName.split(' ')[0]}</span>
                  </div>

                  {/* Target status */}
                  <div className="flex items-center gap-1 w-20 justify-center" title={isSource ? partnerName : 'You'}>
                    {session.target_done ? (
                      <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-blue-400" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-subtle flex items-center justify-center">
                        <Minus className="h-3 w-3 text-muted/40" />
                      </div>
                    )}
                    <span className="text-[10px] text-muted">{isSource ? partnerName.split(' ')[0] : 'You'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
