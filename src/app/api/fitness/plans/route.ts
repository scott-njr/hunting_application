import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { getFitnessProfileContext } from '@/lib/ai/fitness-profile'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import type { Json } from '@/types/database.types'
import { apiOk, apiDone, apiError, unauthorized, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

const RUN_PLAN_PROMPT = (config: {
  goal: string
  fitnessLevel: string
  daysPerWeek: number
  currentMileage: string
  notes: string
}) => `Generate an 8-week running training plan for an outdoor athlete.

User profile:
- Goal: ${config.goal}
- Current fitness level: ${config.fitnessLevel}
- Available days per week: ${config.daysPerWeek}
- Current weekly mileage: ${config.currentMileage}
- Notes/injuries: ${config.notes || 'None'}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "goal_summary": "One sentence describing the training goal",
  "weeks": [
    {
      "week_number": 1,
      "theme": "Base Building",
      "sessions": [
        {
          "session_number": 1,
          "type": "easy_run",
          "title": "Easy 30-Minute Run",
          "distance_miles": 3,
          "duration_min": 30,
          "effort_level": "conversational pace / RPE 4-5",
          "description": "Detailed instructions with form tips and purpose of session"
        }
      ]
    }
  ]
}

Include exactly ${config.daysPerWeek} sessions per week. Session types: easy_run, tempo_run, intervals, long_run, recovery_run, cross_train.
Progress gradually — no more than 10% mileage increase week-over-week.
Include a recovery/deload week every 3-4 weeks.`

const STRENGTH_PLAN_PROMPT = (config: {
  goal: string
  fitnessLevel: string
  daysPerWeek: number
  equipment: string
  notes: string
}) => `Generate an 8-week strength training plan for an outdoor athlete focused on functional fitness.

User profile:
- Goal: ${config.goal}
- Current fitness level: ${config.fitnessLevel}
- Available days per week: ${config.daysPerWeek}
- Equipment access: ${config.equipment}
- Notes/injuries: ${config.notes || 'None'}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "goal_summary": "One sentence describing the training goal",
  "weeks": [
    {
      "week_number": 1,
      "theme": "Foundation",
      "sessions": [
        {
          "session_number": 1,
          "type": "strength",
          "title": "Lower Body Strength",
          "duration_min": 45,
          "description": "Session focus and objectives",
          "warmup": "5 min dynamic warmup description",
          "exercises": [
            { "name": "Bulgarian Split Squat", "sets": 3, "reps": "10 each leg", "notes": "Form cue or RPE target" }
          ],
          "cooldown": "5 min cooldown/stretch description"
        }
      ]
    }
  ]
}

Include exactly ${config.daysPerWeek} sessions per week. Focus on compound movements.
Include beginner-friendly progressions and RPE targets.
Include a deload week every 3-4 weeks.
For ${config.equipment === 'bodyweight' ? 'bodyweight-only workouts, use progressions like pike pushups, pistol squat progressions, etc.' : config.equipment === 'dumbbells' ? 'dumbbell workouts, include key lifts like goblet squats, DB rows, overhead press.' : 'full gym workouts, include barbell compounds like squat, deadlift, bench, OHP.'}`

// Meal plans are too large for a single AI call (168+ sessions with full recipes).
// Split into two batches: weeks 1-4, then weeks 5-8, and merge the results.
const MEAL_PLAN_BATCH_PROMPT = (config: {
  goal: string
  dietaryPref: string
  weeklyBudget: number
  mealsPerDay: string
  notes: string
}, batch: 1 | 2, dailyTargets?: { calories: number; protein_g: number; carbs_g: number; fat_g: number }) => {
  const mealTypes = config.mealsPerDay.split(',').map(m => m.trim())
  const mealCount = mealTypes.length
  const mealLabel = mealTypes.join(', ')
  const startWeek = batch === 1 ? 1 : 5
  const endWeek = batch === 1 ? 4 : 8

  const profileBlock = `User profile:
- Goal: ${config.goal}
- Dietary preference: ${config.dietaryPref === 'none' ? 'No restrictions' : config.dietaryPref}
- Weekly grocery budget: $${config.weeklyBudget}
- Meals per day: ${mealLabel}
- Notes/allergies: ${config.notes || 'None'}`

  if (batch === 1) {
    return `Generate weeks 1-4 of an 8-week meal plan for an active outdoor athlete.

${profileBlock}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "goal_summary": "One sentence describing the nutrition goal and budget",
  "daily_targets": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
  "weeks": [
    {
      "week_number": 1,
      "theme": "Foundation & Habit Building",
      "sessions": [
        {
          "session_number": 1,
          "type": "meal",
          "title": "Monday Breakfast - Overnight Oats",
          "meal_type": "breakfast",
          "day_name": "Monday",
          "day_number": 1,
          "calories": 450,
          "protein_g": 25,
          "description": "Quick prep the night before",
          "ingredients": ["1 cup oats", "1 cup milk", "honey"],
          "instructions": "Mix oats and milk in a jar, refrigerate overnight.",
          "estimated_cost_usd": 2.50
        }
      ]
    }
  ],
  "grocery_list": [
    { "item": "oats 2lbs", "estimated_cost_usd": 4.00 }
  ],
  "weekly_cost_usd": 0
}

Generate weeks ${startWeek}-${endWeek}. Each week has exactly ${mealCount * 7} sessions (${mealCount} meals × 7 days).
Number sessions 1 through ${mealCount * 7} within each week.
Use day_number 1-7 (1=Monday, 7=Sunday) and day_name for each meal.
Meal types per day: ${mealLabel}. Use these as the meal_type values.

Vary meals across weeks — each week should have a different theme.
The weekly_cost_usd MUST stay within the $${config.weeklyBudget} budget.
Calculate appropriate daily calorie and macro targets based on the user's goal (${config.goal}).
Focus on practical, easy-to-prepare meals. Reuse ingredients within each week to minimize waste.
Include a grocery_list for week 1 with estimated costs.
Start with simple, foundational meals in weeks 1-2, introduce more variety in weeks 3-4.

Keep recipes practical and concise:
- Include simple quantities for main ingredients (e.g. "2 chicken breasts", "1 cup rice") but skip fussy measurements like teaspoons of salt or pinches of spices.
- Instructions should be 1-3 sentences max — enough to know the method, not a step-by-step cookbook recipe.`
  }

  // Batch 2: weeks 5-8, referencing daily_targets from batch 1
  const targetsLine = dailyTargets
    ? `Use these daily targets: ${dailyTargets.calories} cal, ${dailyTargets.protein_g}g protein, ${dailyTargets.carbs_g}g carbs, ${dailyTargets.fat_g}g fat.`
    : `Calculate appropriate daily calorie and macro targets based on the user's goal (${config.goal}).`

  return `Generate weeks 5-8 of an 8-week meal plan for an active outdoor athlete.
This is the second half — weeks 1-4 are already done. Continue the progression.

${profileBlock}

${targetsLine}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "weeks": [
    {
      "week_number": 5,
      "theme": "Building Momentum",
      "sessions": [
        {
          "session_number": 1,
          "type": "meal",
          "title": "Monday Breakfast - Protein Smoothie Bowl",
          "meal_type": "breakfast",
          "day_name": "Monday",
          "day_number": 1,
          "calories": 450,
          "protein_g": 30,
          "description": "Blend and top with granola",
          "ingredients": ["1 banana", "1 scoop protein powder", "granola"],
          "instructions": "Blend banana and protein with ice, top with granola.",
          "estimated_cost_usd": 3.00
        }
      ]
    }
  ]
}

Generate weeks ${startWeek}-${endWeek}. Each week has exactly ${mealCount * 7} sessions (${mealCount} meals × 7 days).
Number sessions 1 through ${mealCount * 7} within each week.
Use day_number 1-7 (1=Monday, 7=Sunday) and day_name for each meal.
Meal types per day: ${mealLabel}. Use these as the meal_type values.

Vary meals across weeks — each week should have a different theme.
The weekly_cost_usd MUST stay within the $${config.weeklyBudget} budget.
Focus on practical meals. Reuse ingredients within each week.
Progress the complexity: weeks 5-6 introduce more variety, weeks 7-8 consolidate favorites with advanced prep.

Keep recipes practical and concise:
- Include simple quantities for main ingredients (e.g. "2 chicken breasts", "1 cup rice") but skip fussy measurements like teaspoons of salt or pinches of spices.
- Instructions should be 1-3 sentences max — enough to know the method, not a step-by-step cookbook recipe.`
}

const VALID_PLAN_TYPES = ['run', 'strength', 'meal'] as const
type PlanType = typeof VALID_PLAN_TYPES[number]

export const GET = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const planType = req.nextUrl.searchParams.get('type')
  if (!planType || !VALID_PLAN_TYPES.includes(planType as PlanType)) {
    return badRequest('Invalid plan type')
  }

  const { data: plan } = await supabase
    .from('fitness_training_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_type', planType as PlanType)
    .eq('status', 'active')
    .maybeSingle()

  if (!plan) return apiOk({ plan: null, logs: [] })

  const { data: logs } = await supabase
    .from('fitness_plan_workout_logs')
    .select('*')
    .eq('plan_id', plan.id)
    .order('completed_at', { ascending: true })

  return apiOk({ plan, logs: logs ?? [] })
})


export const POST = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const rawBody = await parseBody(req)
  if (isErrorResponse(rawBody)) return rawBody
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { plan_type, config } = rawBody as { plan_type: string; config: any }

  if (!plan_type || !VALID_PLAN_TYPES.includes(plan_type as PlanType)) {
    return badRequest('Invalid plan type')
  }

  // Check module-specific quota
  const subInfo = await getUserModuleSubscriptionInfo(supabase, user.id, 'fitness')
  if (!hasModuleAIQuota(subInfo.tier, subInfo.aiQueriesThisMonth)) {
    return apiError('quota_exceeded', 403, { message: 'Monthly AI query limit reached for Fitness. Upgrade your plan for more.' })
  }

  if (plan_type === 'meal') {
    if (!config || !config.goal) {
      return badRequest('Missing required config fields')
    }
  } else if (!config || !config.goal || !config.fitnessLevel || !config.daysPerWeek) {
    return badRequest('Missing required config fields')
  }

  // Abandon any existing active plan of this type
  await supabase
    .from('fitness_training_plans')
    .update({ status: 'abandoned' as const })
    .eq('user_id', user.id)
    .eq('plan_type', plan_type as 'run' | 'strength' | 'meal')
    .eq('status', 'active')

  // Fetch profile context (age, baseline scores, etc.)
  const profileContext = await getFitnessProfileContext(supabase, user.id)

  const feature = plan_type === 'run'
    ? 'fitness_run_coach'
    : plan_type === 'strength'
    ? 'fitness_strength_coach'
    : 'fitness_meal_prep' as const

  let parsed: Record<string, unknown>

  if (plan_type === 'meal') {
    // Meal plans are split into two batches (weeks 1-4, then 5-8)
    // because 168+ sessions with full recipes exceeds single-call token limits
    const batch1Prompt = MEAL_PLAN_BATCH_PROMPT(config, 1) + profileContext
    const result1 = await aiCall({
      module: 'fitness',
      feature,
      userMessage: batch1Prompt,
      userId: user.id,
      maxTokens: 16384,
    })

    if (!result1.success) {
      return serverError(result1.error ?? 'AI generation failed')
    }

    let parsed1: Record<string, unknown>
    try {
      parsed1 = extractJSON(result1.response)
    } catch (err) {
      console.error('[AI PARSE ERROR] meal batch 1', {
        tokensUsed: result1.tokensUsed,
        responseLength: result1.response.length,
        responseTail: result1.response.slice(-200),
        flags: result1.flags,
        error: String(err),
      })
      const truncated = result1.flags.includes('truncated')
      return serverError(truncated
        ? 'AI response was too long and got cut off. Please try again — it usually works on retry.'
        : 'Failed to parse AI response. Please try again.')
    }

    // Only call batch 2 if batch 1 didn't already return all 8 weeks
    const weeks1 = (parsed1.weeks as unknown[]) ?? []
    const hasAllWeeks = weeks1.length >= 8

    if (hasAllWeeks) {
      // AI fit everything in one call — no need for a second request
      parsed = parsed1
    } else {
      // Need batch 2 for remaining weeks
      const dailyTargets = parsed1.daily_targets as { calories: number; protein_g: number; carbs_g: number; fat_g: number } | undefined

      const batch2Prompt = MEAL_PLAN_BATCH_PROMPT(config, 2, dailyTargets) + profileContext
      const result2 = await aiCall({
        module: 'fitness',
        feature,
        userMessage: batch2Prompt,
        userId: user.id,
        maxTokens: 16384,
      })

      if (!result2.success) {
        return serverError(result2.error ?? 'AI generation failed')
      }

      let parsed2: Record<string, unknown>
      try {
        parsed2 = extractJSON(result2.response)
      } catch (err) {
        console.error('[AI PARSE ERROR] meal batch 2', {
          tokensUsed: result2.tokensUsed,
          responseLength: result2.response.length,
          responseTail: result2.response.slice(-200),
          flags: result2.flags,
          error: String(err),
        })
        const truncated = result2.flags.includes('truncated')
        return serverError(truncated
          ? 'AI response was too long and got cut off. Please try again — it usually works on retry.'
          : 'Failed to parse AI response. Please try again.')
      }

      const weeks2 = (parsed2.weeks as unknown[]) ?? []
      parsed = {
        ...parsed1,
        weeks: [...weeks1, ...weeks2],
      }
    }
  } else {
    // Run and strength plans: single AI call
    const prompt = (plan_type === 'run'
      ? RUN_PLAN_PROMPT(config)
      : STRENGTH_PLAN_PROMPT(config)) + profileContext

    const tokenLimit = plan_type === 'strength' ? 16384 : 8192

    const result = await aiCall({
      module: 'fitness',
      feature,
      userMessage: prompt,
      userId: user.id,
      maxTokens: tokenLimit,
    })

    if (!result.success) {
      return serverError(result.error ?? 'AI generation failed')
    }

    try {
      parsed = extractJSON(result.response)
    } catch (err) {
      console.error('[AI PARSE ERROR]', {
        plan_type,
        tokensUsed: result.tokensUsed,
        responseLength: result.response.length,
        responseTail: result.response.slice(-200),
        flags: result.flags,
        error: String(err),
      })
      const truncated = result.flags.includes('truncated')
      return serverError(truncated
        ? 'AI response was too long and got cut off. Please try again — it usually works on retry.'
        : 'Failed to parse AI response. Please try again.')
    }
  }

  const goalSummary = parsed.goal_summary as string | undefined
  const weeksTotal = (parsed.weeks as unknown[])?.length ?? 8

  // Insert plan
  const { data: plan, error } = await supabase
    .from('fitness_training_plans')
    .insert({
      user_id: user.id,
      plan_type: plan_type as PlanType,
      config: config as Json,
      plan_data: parsed as unknown as Json,
      goal: goalSummary ?? null,
      weeks_total: weeksTotal,
    })
    .select()
    .single()

  if (error) {
    console.error('[fitness/plans POST] insert error:', error.message)
    return serverError()
  }

  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: user.id,
    module_slug_param: 'fitness',
  })

  return apiOk({ plan }, 201)
})


export const DELETE = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const planType = req.nextUrl.searchParams.get('type')
  if (!planType || !VALID_PLAN_TYPES.includes(planType as PlanType)) {
    return badRequest('Invalid plan type')
  }

  await supabase
    .from('fitness_training_plans')
    .update({ status: 'abandoned' as const })
    .eq('user_id', user.id)
    .eq('plan_type', planType as PlanType)
    .eq('status', 'active')

  return apiDone()
})

