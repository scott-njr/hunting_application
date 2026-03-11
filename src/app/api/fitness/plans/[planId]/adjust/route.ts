import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { getFitnessProfileContext } from '@/lib/ai/fitness-profile'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import { getCurrentWeek, getPassedSessionNumbers } from '@/lib/fitness/date-helpers'

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
    .from('fitness_training_plans')
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
  const planData = plan.plan_data as Record<string, unknown>
  const currentPlan = JSON.stringify(planData, null, 2)
  const config = plan.config as Record<string, unknown>

  // For workout plans, determine current week so AI only adjusts remaining weeks
  const currentWeek = plan.plan_type !== 'meal'
    ? getCurrentWeek(plan.started_at, plan.weeks_total)
    : 0

  // Find sessions in the current week that must be preserved:
  // 1. Sessions the user has logged (completed)
  // 2. Sessions whose scheduled day has already passed (even if not completed)
  let frozenSessionNumbers: number[] = []
  if (currentWeek >= 1 && plan.plan_type !== 'meal') {
    const { data: logs } = await supabase
      .from('fitness_plan_workout_logs')
      .select('session_number')
      .eq('plan_id', planId)
      .eq('week_number', currentWeek)

    const loggedSessions = (logs ?? []).map(l => l.session_number)
    const daysPerWeek = (config.daysPerWeek as number) ?? 3
    const passedSessions = getPassedSessionNumbers(daysPerWeek)

    // Merge logged + passed, deduplicate
    frozenSessionNumbers = [...new Set([...loggedSessions, ...passedSessions])].sort((a, b) => a - b)
  }

  let weekContext = ''
  if (plan.plan_type !== 'meal' && (currentWeek > 1 || frozenSessionNumbers.length > 0)) {
    const parts: string[] = []
    if (currentWeek > 1) {
      parts.push(`Keep weeks 1 through ${currentWeek - 1} EXACTLY as they are — those are already completed.`)
    }
    if (frozenSessionNumbers.length > 0) {
      parts.push(`In week ${currentWeek}, sessions ${frozenSessionNumbers.join(', ')} have already passed — keep those EXACTLY as they are. Only modify the remaining sessions in week ${currentWeek} and all sessions in weeks ${currentWeek + 1} through ${plan.weeks_total}.`)
    } else {
      parts.push(`Apply the feedback to week ${currentWeek} through ${plan.weeks_total}.`)
    }
    weekContext = `\n\nIMPORTANT: The user is currently on week ${currentWeek} of ${plan.weeks_total}. ${parts.join(' ')}`
  }

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

User feedback: "${feedback}"${weekContext}

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

  // For workout plans, preserve completed weeks and sessions in case AI modified them
  if (plan.plan_type !== 'meal' && (currentWeek > 1 || frozenSessionNumbers.length > 0)) {
    const originalWeeks = (planData.weeks ?? []) as Array<Record<string, unknown>>
    const adjustedWeeks = (parsed.weeks ?? []) as Array<Record<string, unknown>>

    // Replace weeks before current week with originals (already completed)
    for (let i = 0; i < currentWeek - 1 && i < originalWeeks.length; i++) {
      if (adjustedWeeks[i]) {
        adjustedWeeks[i] = originalWeeks[i]
      }
    }

    // Within the current week, preserve completed sessions
    if (frozenSessionNumbers.length > 0) {
      const weekIdx = currentWeek - 1
      const origWeek = originalWeeks[weekIdx] as Record<string, unknown> | undefined
      const adjWeek = adjustedWeeks[weekIdx] as Record<string, unknown> | undefined
      if (origWeek && adjWeek) {
        const origSessions = (origWeek.sessions ?? []) as Array<Record<string, unknown>>
        const adjSessions = (adjWeek.sessions ?? []) as Array<Record<string, unknown>>
        for (const sessNum of frozenSessionNumbers) {
          const idx = sessNum - 1
          if (origSessions[idx] && adjSessions[idx]) {
            adjSessions[idx] = origSessions[idx]
          }
        }
        adjWeek.sessions = adjSessions
      }
    }

    parsed.weeks = adjustedWeeks
  }

  // Increment AI quota (the generation costs regardless of accept/reject)
  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: user.id,
    module_slug_param: 'fitness',
  })

  // Return draft for user preview — not saved until accepted
  return NextResponse.json({
    draft: parsed,
    goal: (parsed.goal_summary as string) ?? plan.goal,
  })
}
