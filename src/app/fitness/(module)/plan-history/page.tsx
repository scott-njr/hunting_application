import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity, Dumbbell, UtensilsCrossed, GitCompare, RotateCcw, Calendar, CheckCircle2 } from 'lucide-react'
import { RevertButtonInline } from './revert-button-inline'

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

export default async function PlanHistoryPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { type: planType } = await searchParams
  if (!planType || !['run', 'strength', 'meal'].includes(planType)) {
    redirect('/fitness/my-plan')
  }

  // Fetch abandoned plans
  const { data: plans } = await supabase
    .from('fitness_training_plans')
    .select('id, goal, weeks_total, started_at, config, created_on')
    .eq('user_id', user.id)
    .eq('plan_type', planType as 'run' | 'strength' | 'meal')
    .eq('status', 'abandoned')
    .order('started_at', { ascending: false })

  // Get log counts per plan
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

  // Check if there's a current active plan (for compare link)
  const { data: activePlan } = await supabase
    .from('fitness_training_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan_type', planType as 'run' | 'strength' | 'meal')
    .eq('status', 'active')
    .maybeSingle()

  const hasActivePlan = !!activePlan

  const PlanIcon = PLAN_ICONS[planType] ?? Activity
  const planLabel = PLAN_LABELS[planType] ?? 'Plan'

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/fitness/my-plan" className="text-muted hover:text-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PlanIcon className="h-6 w-6 text-accent" />
        <div>
          <h1 className="text-primary font-bold text-xl">{planLabel} History</h1>
          <p className="text-muted text-sm">{(plans ?? []).length} previous plan{(plans ?? []).length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Plan list */}
      {(plans ?? []).length === 0 ? (
        <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
          <p className="text-muted text-sm">No previous {planLabel.toLowerCase()}s found.</p>
          <p className="text-muted text-xs mt-1">When you adjust or start a new plan, your old ones will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(plans ?? []).map(plan => {
            const sessionsCompleted = logCounts.get(plan.id) ?? 0
            const config = plan.config as Record<string, unknown> | null
            const goal = config?.goal as string | undefined

            return (
              <div key={plan.id} className="rounded-lg border border-subtle bg-surface p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-primary font-medium text-sm">{plan.goal ?? 'Untitled plan'}</p>
                    {goal && goal !== plan.goal && (
                      <p className="text-muted text-xs mt-0.5">Goal: {goal}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(plan.started_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''} completed
                      </span>
                      <span>{plan.weeks_total} weeks</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-subtle">
                  {hasActivePlan && (
                    <Link
                      href={`/fitness/plan-history/${plan.id}`}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      <GitCompare className="h-3.5 w-3.5" /> Compare with New Plan
                    </Link>
                  )}
                  <RevertButtonInline planId={plan.id} planType={planType} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
