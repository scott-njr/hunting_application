import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { getFitnessProfileContext } from '@/lib/ai/fitness-profile'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import type { Json } from '@/types/database.types'
import { apiDone, apiError, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

export const POST = withHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { planId } = await params
  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { week_number, session_number, feedback } = body

  if (!week_number || !session_number) {
    return badRequest('Missing week_number or session_number')
  }

  // Check module-specific quota
  const subInfo = await getUserModuleSubscriptionInfo(supabase, user.id, 'fitness')
  if (!hasModuleAIQuota(subInfo.tier, subInfo.aiQueriesThisMonth)) {
    return apiError('quota_exceeded', 403, { message: 'Monthly AI query limit reached for Fitness. Upgrade your plan for more.' })
  }

  // Fetch plan and verify ownership
  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('plan_type', 'meal')
    .eq('status', 'active')
    .single()

  if (!plan) return notFound('Plan not found')

  const planData = plan.plan_data as Record<string, unknown>
  const weeks = planData.weeks as Array<Record<string, unknown>>
  const week = weeks?.find((w) => w.week_number === week_number)
  if (!week) return notFound('Week not found')

  const sessions = week.sessions as Array<Record<string, unknown>>
  const currentMeal = sessions?.find((s) => s.session_number === session_number)
  if (!currentMeal) return notFound('Meal not found')

  const config = plan.config as Record<string, unknown>
  const dailyTargets = planData.daily_targets as Record<string, number> | undefined

  const profileContext = await getFitnessProfileContext(supabase, user.id)

  const prompt = `Generate a single replacement meal for a meal plan.

Current meal being replaced:
- Type: ${currentMeal.meal_type}
- Title: ${currentMeal.title}
- Calories: ${currentMeal.calories}
- Day: ${currentMeal.day_name ?? ''}
${feedback ? `- User feedback: ${feedback}` : ''}

Dietary context:
- Goal: ${config.goal}
- Dietary preference: ${config.dietaryPref === 'none' ? 'No restrictions' : config.dietaryPref}
- Weekly budget: $${config.weeklyBudget ?? 100}
- Daily calorie target: ${dailyTargets?.calories ?? 2000} calories
${config.notes ? `- Allergies/notes: ${config.notes}` : ''}

Return ONLY valid JSON (no markdown, no code fences) for the replacement meal:
{
  "session_number": ${session_number},
  "type": "meal",
  "title": "New Meal Title",
  "meal_type": "${currentMeal.meal_type}",
  "day_name": "${currentMeal.day_name ?? ''}",
  "day_number": ${currentMeal.day_number ?? 1},
  "calories": 450,
  "protein_g": 25,
  "description": "Brief description of the meal",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Preparation steps",
  "estimated_cost_usd": 3.50
}

Keep similar calorie count to the original. Make it different and appetizing.
Include simple quantities for main ingredients but skip fussy measurements like teaspoons of salt or pinches of spices.
Instructions should be 1-3 sentences max — enough to know the method, not a detailed recipe.${profileContext}`

  const result = await aiCall({
    module: 'fitness',
    feature: 'fitness_meal_prep',
    userMessage: prompt,
    userId: user.id,
    maxTokens: 1024,

  })

  if (!result.success) {
    return serverError(result.error ?? 'AI generation failed')
  }

  let newMeal: Record<string, unknown>
  try {
    newMeal = extractJSON(result.response)
  } catch {
    return serverError('Failed to parse AI response. Please try again.')
  }

  // Replace the meal session in plan_data
  const updatedSessions = sessions.map((s) =>
    s.session_number === session_number ? newMeal : s
  )
  const updatedWeek = { ...week, sessions: updatedSessions }
  const updatedWeeks = weeks.map((w) =>
    w.week_number === week_number ? updatedWeek : w
  )
  const updatedPlanData = { ...planData, weeks: updatedWeeks }

  const { error } = await supabase
    .from('fitness_training_plans')
    .update({ plan_data: updatedPlanData as unknown as Json })
    .eq('id', planId)

  if (error) return serverError()

  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: user.id,
    module_slug_param: 'fitness',
  })

  return apiDone({ meal: newMeal })
})

