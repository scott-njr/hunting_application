import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { getFitnessProfileContext } from '@/lib/ai/fitness-profile'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import { getCurrentWeek, getPassedSessionNumbers } from '@/lib/fitness/date-helpers'
import { apiOk, apiError, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { planId } = await params
  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { feedback } = body

  if (!feedback?.trim()) {
    return badRequest('Feedback is required')
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
    .eq('status', 'active')
    .single()

  if (!plan) return notFound('Plan not found')

  const feature = plan.plan_type === 'run'
    ? 'fitness_run_coach'
    : plan.plan_type === 'strength'
    ? 'fitness_strength_coach'
    : 'fitness_meal_prep' as const

  const profileContext = await getFitnessProfileContext(supabase, user.id)
  const planData = plan.plan_data as Record<string, unknown>
  const currentPlan = JSON.stringify(planData, null, 2)
  const config = plan.config as Record<string, unknown>

  // Determine current week so AI only adjusts remaining weeks
  const currentWeek = getCurrentWeek(plan.started_at, plan.weeks_total)

  // Find sessions in the current week that must be preserved:
  // 1. Sessions the user has logged (completed)
  // 2. Sessions whose scheduled day has already passed (even if not completed)
  let frozenSessionNumbers: number[] = []
  if (currentWeek >= 1) {
    const { data: logs } = await supabase
      .from('fitness_plan_workout_logs')
      .select('session_number')
      .eq('plan_id', planId)
      .eq('week_number', currentWeek)
      .eq('completed', true)

    const loggedSessions = (logs ?? []).map(l => l.session_number)
    // For meal plans, freeze based on day-of-week (meals have sessions for every day)
    // For workout plans, freeze based on training day schedule
    const daysPerWeek = plan.plan_type === 'meal'
      ? 7 // meals have sessions for every day
      : ((config.daysPerWeek as number) ?? 3)
    const passedSessions = getPassedSessionNumbers(daysPerWeek)

    // Merge logged + passed, deduplicate
    frozenSessionNumbers = [...new Set([...loggedSessions, ...passedSessions])].sort((a, b) => a - b)
  }

  let weekContext = ''
  if (currentWeek > 1 || frozenSessionNumbers.length > 0) {
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

  const planTypeLabel = plan.plan_type === 'run' ? '8-week running'
    : plan.plan_type === 'strength' ? '8-week strength training'
    : '8-week meal'

  const basePrompt = plan.plan_type === 'meal'
    ? `Adjust this existing 8-week meal plan based on user feedback.

Current meal plan:
${currentPlan}

User config:
- Goal: ${config.goal}
- Dietary preference: ${config.dietaryPref === 'none' ? 'No restrictions' : config.dietaryPref}
- Weekly budget: $${config.weeklyBudget ?? 100}
${config.notes ? `- Notes: ${config.notes}` : ''}

User feedback: "${feedback}"${weekContext}

Return ONLY valid JSON (no markdown, no code fences) with the COMPLETE adjusted meal plan using the exact same structure as the current plan. Apply the user's feedback while maintaining nutritional balance. Keep the same JSON structure with all fields (goal_summary, weeks, sessions, grocery_list, costs, etc).`
    : `Adjust this existing ${planTypeLabel} plan based on user feedback.

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

  const tokenLimit = plan.plan_type === 'meal' ? 32768
    : plan.plan_type === 'strength' ? 16384
    : 8192

  const result = await aiCall({
    module: 'fitness',
    feature,
    userMessage: prompt,
    userId: user.id,
    maxTokens: tokenLimit,
  })

  if (!result.success) {
    return serverError(result.error ?? 'AI adjustment failed')
  }

  let parsed: Record<string, unknown>
  try {
    parsed = extractJSON(result.response)
  } catch {
    const truncated = result.flags.includes('truncated')
    return serverError(truncated
      ? 'AI response was too long and got cut off. Please try again.'
      : 'Failed to parse AI response. Please try again.')
  }

  // Preserve completed weeks and sessions in case AI modified them
  if (currentWeek > 1 || frozenSessionNumbers.length > 0) {
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
  return apiOk({
    draft: parsed as Record<string, unknown>,
    goal: ((parsed.goal_summary as string) ?? plan.goal) as string,
  })
}
