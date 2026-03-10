import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch comprehensive fitness context for the AI coach.
 * Runs parallel queries for active plans, recent logs, baseline history, and WOW scores.
 * Returns a compact text block (~500-700 tokens) for injection into the coach system prompt.
 */
export async function getCoachContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const [profileResult, baselines, activePlans, recentLogs, wowScores] = await Promise.all([
    supabase
      .from('hunter_profiles')
      .select('date_of_birth, physical_condition')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('baseline_tests')
      .select('run_time_seconds, pushups, situps, pullups, tested_at')
      .eq('user_id', userId)
      .order('tested_at', { ascending: false })
      .limit(3),
    supabase
      .from('training_plans')
      .select('plan_type, goal, weeks_total, started_at, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('plan_workout_logs')
      .select('week_number, session_number, notes, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('workout_submissions')
      .select('score_display, scaling, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const lines: string[] = ['[USER FITNESS CONTEXT]']

  // Age + condition
  const dob = profileResult.data?.date_of_birth
  if (dob) {
    const age = Math.floor(
      (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    if (age > 0 && age < 120) lines.push(`Age: ${age}`)
  }
  const condition = profileResult.data?.physical_condition
  if (condition) lines.push(`Physical condition: ${condition}`)

  // Active plans (summary only — no plan_data)
  const plans = activePlans.data ?? []
  if (plans.length === 0) {
    lines.push('Active training plans: None')
  } else {
    lines.push('Active training plans:')
    for (const p of plans) {
      const weeksSinceStart = Math.floor(
        (Date.now() - new Date(p.started_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
      ) + 1
      const currentWeek = Math.min(weeksSinceStart, p.weeks_total)
      lines.push(`  - ${p.plan_type}: "${p.goal ?? 'No goal set'}" — Week ${currentWeek} of ${p.weeks_total}`)
    }
  }

  // Recent workout logs (last 14 days)
  const logs = recentLogs.data ?? []
  if (logs.length === 0) {
    lines.push('Recent workouts (14 days): None logged')
  } else {
    lines.push(`Recent workouts (14 days): ${logs.length} sessions logged`)
    const withNotes = logs.filter(l => l.notes?.trim())
    if (withNotes.length > 0) {
      lines.push('Session notes:')
      withNotes.slice(0, 5).forEach(l => {
        lines.push(`  - Week ${l.week_number}, Session ${l.session_number}: "${l.notes}"`)
      })
    }
  }

  // Baseline test history (last 3 for trend)
  const tests = baselines.data ?? []
  if (tests.length > 0) {
    lines.push('Baseline test history (most recent first):')
    tests.forEach(t => {
      const runMin = Math.floor(t.run_time_seconds / 60)
      const runSec = t.run_time_seconds % 60
      lines.push(`  - ${t.tested_at}: 2mi ${runMin}:${String(runSec).padStart(2, '0')}, ${t.pushups} pushups, ${t.situps} situps, ${t.pullups} pullups`)
    })
  } else {
    lines.push('Baseline tests: None recorded')
  }

  // WOW scores
  const wow = wowScores.data ?? []
  if (wow.length > 0) {
    lines.push('Recent WOW submissions:')
    wow.forEach(w => {
      lines.push(`  - ${w.created_at}: ${w.score_display} (${w.scaling})`)
    })
  } else {
    lines.push('WOW participation: No recent submissions')
  }

  return lines.join('\n')
}

/**
 * Fetch user profile data relevant to fitness AI calls.
 * Returns a formatted string block to inject into prompts.
 */
export async function getFitnessProfileContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const [profileResult, baselineResult] = await Promise.all([
    supabase
      .from('hunter_profiles')
      .select('date_of_birth, physical_condition')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('baseline_tests')
      .select('run_time_seconds, pushups, situps, pullups, tested_at')
      .eq('user_id', userId)
      .order('tested_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const lines: string[] = []

  // Age from date_of_birth
  const dob = profileResult.data?.date_of_birth
  if (dob) {
    const age = Math.floor(
      (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    if (age > 0 && age < 120) {
      lines.push(`- Age: ${age}`)
    }
  }

  // Physical condition
  const condition = profileResult.data?.physical_condition
  if (condition) {
    lines.push(`- Physical condition tolerance: ${condition}`)
  }

  // Latest baseline test
  const baseline = baselineResult.data
  if (baseline) {
    const runMin = Math.floor(baseline.run_time_seconds / 60)
    const runSec = baseline.run_time_seconds % 60
    lines.push(`- Latest baseline test (${baseline.tested_at}):`)
    lines.push(`  - 2-mile run: ${runMin}:${String(runSec).padStart(2, '0')}`)
    lines.push(`  - Push-ups: ${baseline.pushups}`)
    lines.push(`  - Sit-ups: ${baseline.situps}`)
    lines.push(`  - Pull-ups: ${baseline.pullups}`)
  }

  if (lines.length === 0) return ''

  return `\nAthlete profile:\n${lines.join('\n')}`
}
