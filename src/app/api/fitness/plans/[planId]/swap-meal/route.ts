import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { getFitnessProfileContext } from '@/lib/ai/fitness-profile'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import type { Json } from '@/types/database.types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId } = await params
  const { day_number, meal_number, feedback } = await req.json()

  if (!day_number || !meal_number) {
    return NextResponse.json({ error: 'Missing day_number or meal_number' }, { status: 400 })
  }

  // Check module-specific quota
  const subInfo = await getUserModuleSubscriptionInfo(supabase, user.id, 'fitness')
  if (!hasModuleAIQuota(subInfo.tier, subInfo.aiQueriesThisMonth)) {
    return NextResponse.json(
      { error: 'quota_exceeded', message: 'Monthly AI query limit reached for Fitness. Upgrade your plan for more.' },
      { status: 403 }
    )
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

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const planData = plan.plan_data as Record<string, unknown>
  const days = planData.days as Array<Record<string, unknown>>
  const day = days?.find((d) => d.day_number === day_number)
  if (!day) return NextResponse.json({ error: 'Day not found' }, { status: 404 })

  const meals = day.meals as Array<Record<string, unknown>>
  const currentMeal = meals?.find((m) => m.meal_number === meal_number)
  if (!currentMeal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 })

  const config = plan.config as Record<string, unknown>
  const dailyTargets = planData.daily_targets as Record<string, number> | undefined

  const profileContext = await getFitnessProfileContext(supabase, user.id)

  const prompt = `Generate a single replacement meal for a meal plan.

Current meal being replaced:
- Type: ${currentMeal.meal_type}
- Title: ${currentMeal.title}
- Calories: ${currentMeal.calories}
${feedback ? `- User feedback: ${feedback}` : ''}

Dietary context:
- Goal: ${config.goal}
- Dietary preference: ${config.dietaryPref === 'none' ? 'No restrictions' : config.dietaryPref}
- Weekly budget: $${config.weeklyBudget ?? 100}
- Daily calorie target: ${dailyTargets?.calories ?? 2000} calories
${config.notes ? `- Allergies/notes: ${config.notes}` : ''}

Return ONLY valid JSON (no markdown, no code fences) for the replacement meal:
{
  "meal_number": ${meal_number},
  "meal_type": "${currentMeal.meal_type}",
  "title": "New Meal Title",
  "calories": 450,
  "protein_g": 25,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Preparation steps",
  "estimated_cost_usd": 3.50
}

Keep similar calorie count to the original. Make it different and appetizing.${profileContext}`

  const result = await aiCall({
    module: 'fitness',
    feature: 'meal_plan_generator',
    userMessage: prompt,
    userId: user.id,
    maxTokens: 1024,

  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'AI generation failed' }, { status: 500 })
  }

  let newMeal: Record<string, unknown>
  try {
    newMeal = extractJSON(result.response)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
  }

  // Replace the meal in plan_data
  const updatedMeals = meals.map((m) =>
    m.meal_number === meal_number ? newMeal : m
  )
  const updatedDay = { ...day, meals: updatedMeals }
  const updatedDays = days.map((d) =>
    d.day_number === day_number ? updatedDay : d
  )
  const updatedPlanData = { ...planData, days: updatedDays }

  const { error } = await supabase
    .from('fitness_training_plans')
    .update({ plan_data: updatedPlanData as unknown as Json })
    .eq('id', planId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: user.id,
    module_slug_param: 'fitness',
  })

  return NextResponse.json({ success: true, meal: newMeal })
}
