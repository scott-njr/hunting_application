import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { getFitnessProfileContext } from '@/lib/ai/fitness-profile'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import type { Json } from '@/types/database.types'

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

const MEAL_PLAN_PROMPT = (config: {
  goal: string
  dietaryPref: string
  weeklyBudget: number
  mealsPerDay: string
  notes: string
}) => {
  const mealTypes = config.mealsPerDay.split(',').map(m => m.trim())
  const mealCount = mealTypes.length
  const mealLabel = mealTypes.join(', ')

  return `Generate a 7-day meal plan for an active outdoor athlete.

User profile:
- Goal: ${config.goal}
- Dietary preference: ${config.dietaryPref === 'none' ? 'No restrictions' : config.dietaryPref}
- Weekly grocery budget: $${config.weeklyBudget}
- Meals per day: ${mealLabel}
- Notes/allergies: ${config.notes || 'None'}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "goal_summary": "One sentence describing the nutrition goal and budget",
  "daily_targets": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
  "days": [
    {
      "day_number": 1,
      "day_name": "Monday",
      "meals": [
        {
          "meal_number": 1,
          "meal_type": "breakfast",
          "title": "Meal Title",
          "calories": 450,
          "protein_g": 25,
          "ingredients": ["1 cup oats", "1 cup milk"],
          "instructions": "Step by step preparation instructions",
          "estimated_cost_usd": 3.50
        }
      ],
      "total_calories": 0,
      "total_protein_g": 0,
      "total_cost_usd": 0
    }
  ],
  "grocery_list": [
    { "item": "oats 2lbs", "estimated_cost_usd": 4.00 }
  ],
  "weekly_cost_usd": 0
}

Include exactly ${mealCount} meals per day: ${mealLabel}. Use these as the meal_type values.
The total weekly_cost_usd MUST stay within the $${config.weeklyBudget} budget. Daily cost should be ~$${Math.round(config.weeklyBudget / 7)}.
Calculate appropriate daily calorie and macro targets based on the user's goal (${config.goal}).
Fill in all total_ and cost fields with realistic estimates (US grocery prices).
Focus on practical, easy-to-prepare meals. Reuse ingredients across days to minimize waste and cost.
Include a complete grocery_list with estimated costs and a weekly_cost_usd total.`
}

const VALID_PLAN_TYPES = ['run', 'strength', 'meal'] as const
type PlanType = typeof VALID_PLAN_TYPES[number]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planType = req.nextUrl.searchParams.get('type')
  if (!planType || !VALID_PLAN_TYPES.includes(planType as PlanType)) {
    return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
  }

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_type', planType as PlanType)
    .eq('status', 'active')
    .maybeSingle()

  if (!plan) return NextResponse.json({ plan: null, logs: [] })

  const { data: logs } = await supabase
    .from('plan_workout_logs')
    .select('*')
    .eq('plan_id', plan.id)
    .order('completed_at', { ascending: true })

  return NextResponse.json({ plan, logs: logs ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan_type, config } = await req.json()

  if (!plan_type || !VALID_PLAN_TYPES.includes(plan_type as PlanType)) {
    return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
  }

  // Check module-specific quota
  const subInfo = await getUserModuleSubscriptionInfo(supabase, user.id, 'fitness')
  if (!hasModuleAIQuota(subInfo.tier, subInfo.aiQueriesThisMonth)) {
    return NextResponse.json(
      { error: 'quota_exceeded', message: 'Monthly AI query limit reached for Fitness. Upgrade your plan for more.' },
      { status: 403 }
    )
  }

  if (plan_type === 'meal') {
    if (!config || !config.goal) {
      return NextResponse.json({ error: 'Missing required config fields' }, { status: 400 })
    }
  } else if (!config || !config.goal || !config.fitnessLevel || !config.daysPerWeek) {
    return NextResponse.json({ error: 'Missing required config fields' }, { status: 400 })
  }

  // Abandon any existing active plan of this type
  await supabase
    .from('training_plans')
    .update({ status: 'abandoned' as const })
    .eq('user_id', user.id)
    .eq('plan_type', plan_type)
    .eq('status', 'active')

  // Fetch profile context (age, baseline scores, etc.)
  const profileContext = await getFitnessProfileContext(supabase, user.id)

  // Generate plan via AI
  const prompt = (plan_type === 'run'
    ? RUN_PLAN_PROMPT(config)
    : plan_type === 'strength'
    ? STRENGTH_PLAN_PROMPT(config)
    : MEAL_PLAN_PROMPT(config)) + profileContext

  const feature = plan_type === 'run'
    ? 'run_plan_generator'
    : plan_type === 'strength'
    ? 'strength_plan_generator'
    : 'meal_plan_generator' as const

  // Generous token limits — plans are large structured JSON
  // Strength: 8 weeks × sessions × exercises = very large
  // Meal: 7 days × meals × ingredients + grocery list = large
  // Run: 8 weeks × sessions = moderate
  const tokenLimit = plan_type === 'strength' ? 16384
    : plan_type === 'meal' ? 12288
    : 8192

  const result = await aiCall({
    module: 'fitness',
    feature,
    userMessage: prompt,
    userId: user.id,
    maxTokens: tokenLimit,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'AI generation failed' }, { status: 500 })
  }

  let parsed: Record<string, unknown>
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
    return NextResponse.json({
      error: truncated
        ? 'AI response was too long and got cut off. Please try again — it usually works on retry.'
        : 'Failed to parse AI response. Please try again.',
    }, { status: 500 })
  }

  const goalSummary = parsed.goal_summary as string | undefined
  const weeksTotal = plan_type === 'meal' ? 1 : ((parsed.weeks as unknown[])?.length ?? 8)

  // Insert plan
  const { data: plan, error } = await supabase
    .from('training_plans')
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: user.id,
    module_slug_param: 'fitness',
  })

  return NextResponse.json({ plan })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const planType = req.nextUrl.searchParams.get('type')
  if (!planType || !VALID_PLAN_TYPES.includes(planType as PlanType)) {
    return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
  }

  await supabase
    .from('training_plans')
    .update({ status: 'abandoned' as const })
    .eq('user_id', user.id)
    .eq('plan_type', planType as PlanType)
    .eq('status', 'active')

  return NextResponse.json({ success: true })
}
