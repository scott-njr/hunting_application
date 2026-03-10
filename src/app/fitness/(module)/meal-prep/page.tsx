import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MealQuestionnaire } from '@/components/fitness/meals/meal-questionnaire'
import { UtensilsCrossed, ArrowRight } from 'lucide-react'

export default async function MealPrepPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check for active meal plan
  const { data: plan } = await supabase
    .from('training_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan_type', 'meal')
    .eq('status', 'active')
    .maybeSingle()

  return (
    <div className="space-y-6">
      {plan && (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-5 w-5 text-accent" />
            <span className="text-primary text-sm font-medium">
              Active 7-day meal plan
            </span>
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
      <MealQuestionnaire />
    </div>
  )
}
