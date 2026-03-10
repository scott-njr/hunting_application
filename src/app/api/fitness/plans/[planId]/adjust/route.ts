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
  const { feedback } = await req.json()

  if (!feedback?.trim()) {
    return NextResponse.json({ error: 'Feedback is required' }, { status: 400 })
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
    .from('training_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const feature = plan.plan_type === 'run'
    ? 'run_plan_generator'
    : plan.plan_type === 'strength'
    ? 'strength_plan_generator'
    : 'meal_plan_generator' as const

  const profileContext = await getFitnessProfileContext(supabase, user.id)
  const currentPlan = JSON.stringify(plan.plan_data, null, 2)
  const config = plan.config as Record<string, unknown>

  const basePrompt = plan.plan_type === 'meal'
    ? `Adjust this existing 7-day meal plan based on user feedback.

Current meal plan:
${currentPlan}

User config:
- Goal: ${config.goal}
- Dietary preference: ${config.dietaryPref === 'none' ? 'No restrictions' : config.dietaryPref}
- Weekly budget: $${config.weeklyBudget ?? 100}
${config.notes ? `- Notes: ${config.notes}` : ''}

User feedback: "${feedback}"

Return ONLY valid JSON (no markdown, no code fences) with the COMPLETE adjusted meal plan using the exact same structure as the current plan. Apply the user's feedback while maintaining nutritional balance. Keep the same JSON structure with all fields (days, meals, grocery_list, costs, etc).`
    : `Adjust this existing ${plan.plan_type === 'run' ? '8-week running' : '8-week strength training'} plan based on user feedback.

Current plan:
${currentPlan}

User config:
- Goal: ${config.goal}
- Fitness level: ${config.fitnessLevel}
- Days per week: ${config.daysPerWeek}
${config.notes ? `- Notes: ${config.notes}` : ''}

User feedback: "${feedback}"

Return ONLY valid JSON (no markdown, no code fences) with the COMPLETE adjusted plan using the exact same structure as the current plan. Apply the user's feedback while maintaining progressive overload and safety. Keep all fields (goal_summary, weeks, sessions, etc).`

  const prompt = basePrompt + profileContext

  const tokenLimit = plan.plan_type === 'strength' ? 16384
    : plan.plan_type === 'meal' ? 12288
    : 8192

  const result = await aiCall({
    module: 'fitness',
    feature,
    userMessage: prompt,
    userId: user.id,
    maxTokens: tokenLimit,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'AI adjustment failed' }, { status: 500 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = extractJSON(result.response)
  } catch {
    const truncated = result.flags.includes('truncated')
    return NextResponse.json({
      error: truncated
        ? 'AI response was too long and got cut off. Please try again.'
        : 'Failed to parse AI response. Please try again.',
    }, { status: 500 })
  }

  const { error } = await supabase
    .from('training_plans')
    .update({
      plan_data: parsed as unknown as Json,
      goal: (parsed.goal_summary as string) ?? plan.goal,
    })
    .eq('id', planId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: user.id,
    module_slug_param: 'fitness',
  })

  return NextResponse.json({ success: true })
}
