import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { aiCall, extractJSON } from '@/lib/ai'
import { apiOk, unauthorized, serverError, withHandler } from '@/lib/api-response'

function getCurrentMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const date = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

const WOW_PROMPT = `Generate a Workout of the Week (WOW) for a fitness community of all skill levels.

Requirements:
- 30-45 minutes to complete
- Standard weight room equipment only: barbell, dumbbells, pull-up bar, bench, and bodyweight (no specialty machines, no rucks)
- Must include some combination of: running (treadmill or outdoor), barbell/dumbbell lifting, and/or bodyweight movements
- Clear scoring method: either "time" (complete for time) or "amrap" (max rounds/reps in a time cap)
- Three scaling levels: RX (as prescribed), Scaled, and Beginner
- Safe for general fitness population — no max-effort Olympic lifts

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "title": "Creative workout name",
  "description": "1-2 sentence overview of the workout and what it targets",
  "workout_details": {
    "duration": "30-40 min",
    "equipment": ["list", "of", "equipment"],
    "scoring": "time" or "amrap",
    "time_cap_minutes": null or number (for AMRAP workouts),
    "warmup": "Brief warmup description",
    "cooldown": "Brief cooldown description",
    "scaling": {
      "rx": {
        "label": "RX",
        "description": "As prescribed — full intensity",
        "movements": [
          { "name": "Exercise name", "reps": "15", "notes": "Form cue or weight suggestion" }
        ]
      },
      "scaled": {
        "label": "Scaled",
        "description": "Modified for intermediate athletes",
        "movements": [
          { "name": "Exercise name", "reps": "12", "notes": "Modification notes" }
        ]
      },
      "beginner": {
        "label": "Beginner",
        "description": "Entry-level version",
        "movements": [
          { "name": "Exercise name", "reps": "8", "notes": "Beginner modification" }
        ]
      }
    }
  }
}`

export const GET = withHandler(async (req: NextRequest) => {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return unauthorized()
  }

  const weekStart = getCurrentMonday()

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if workout already exists for this week
  const { data: existing } = await admin
    .from('fitness_weekly_workouts')
    .select('id')
    .eq('week_start', weekStart)
    .maybeSingle()

  if (existing) {
    return apiOk({ message: 'Workout already exists for this week', weekStart })
  }

  // Generate workout via AI (use a system user ID for cron)
  const result = await aiCall({
    module: 'fitness',
    feature: 'fitness_wow_generator',
    userMessage: WOW_PROMPT,
    userId: 'cron-system',
    maxTokens: 2048,
  })

  if (!result.success) {
    return serverError(result.error ?? 'AI generation failed')
  }

  // Parse the AI response
  let parsed: { title: string; description: string; workout_details: Record<string, unknown> }
  try {
    parsed = extractJSON(result.response) as typeof parsed
  } catch {
    return serverError('Failed to parse AI response')
  }

  // Insert into DB
  const { data: workout, error } = await admin
    .from('fitness_weekly_workouts')
    .insert({
      week_start: weekStart,
      title: parsed.title,
      description: parsed.description,
      workout_details: parsed.workout_details,
    })
    .select()
    .single()

  if (error) {
    return serverError()
  }

  return apiOk({ workout })
})
