import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlanQuestionnaire } from '@/components/fitness/coach/plan-questionnaire'
import { Activity, ArrowRight } from 'lucide-react'

export default async function RunCoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check for active run plan
  const { data: plan } = await supabase
    .from('training_plans')
    .select('id, goal, weeks_total')
    .eq('user_id', user.id)
    .eq('plan_type', 'run')
    .eq('status', 'active')
    .maybeSingle()

  return (
    <div className="space-y-6">
      {plan && (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-accent" />
            <div>
              <span className="text-primary text-sm font-medium">
                Active {plan.weeks_total}-week run plan
              </span>
              {plan.goal && <span className="text-muted text-sm ml-2">— {plan.goal}</span>}
            </div>
          </div>
          <Link
            href="/fitness/my-plan"
            className="inline-flex items-center gap-1.5 btn-primary px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
          >
            View Plan
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      <PlanQuestionnaire planType="run" />
    </div>
  )
}
