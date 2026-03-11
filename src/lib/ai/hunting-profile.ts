import { SupabaseClient } from '@supabase/supabase-js'
import type { WizardInputs } from '@/components/hunting/draw-research/types'

/**
 * Build rich context for the Unit Scout AI from the user's profile,
 * preference points, fitness baseline, application history, and wizard inputs.
 * Returns a compact text block (~600-800 tokens) for system prompt injection.
 */
export async function getScoutContext(
  supabase: SupabaseClient,
  userId: string,
  wizard: WizardInputs,
): Promise<string> {
  const [userProfileResult, huntingProfileResult, pointsResult, baselineResult, applicationsResult, drawResult] =
    await Promise.all([
      supabase
        .from('user_profile')
        .select('physical_condition, state')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('hunting_profile')
        .select(
          'experience_level, years_hunting, weapon_types, target_species, hunt_styles, hunt_access_types, annual_budget, max_drive_hours',
        )
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('hunting_points')
        .select('state, species, points, point_type')
        .eq('user_id', userId)
        .eq('state', wizard.state),
      supabase
        .from('fitness_baseline_tests')
        .select('run_time_seconds, pushups, situps, pullups, tested_at')
        .eq('user_id', userId)
        .order('tested_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('hunting_applications')
        .select('state, species, season, year, unit, status')
        .eq('user_id', userId)
        .eq('state', wizard.state)
        .eq('species', wizard.species)
        .order('year', { ascending: false })
        .limit(5),
      supabase
        .from('hunting_draw_species')
        .select('species, seasons, deadline, results_date, status, note')
        .eq('state_code', wizard.state)
        .eq('species', wizard.species)
        .limit(5),
    ])

  const lines: string[] = []
  const userProfile = userProfileResult.data
  const huntingData = huntingProfileResult.data

  // Hunter profile
  lines.push('[HUNTER PROFILE]')
  if (userProfile || huntingData) {
    const parts: string[] = []
    if (huntingData?.experience_level) parts.push(`Experience: ${huntingData.experience_level}`)
    if (huntingData?.years_hunting) parts.push(`${huntingData.years_hunting} years`)
    if (userProfile?.physical_condition) parts.push(`Physical condition: ${userProfile.physical_condition}`)
    if (parts.length) lines.push(parts.join(', '))
    if (userProfile?.state) lines.push(`Residency: ${userProfile.state}`)
    if (huntingData?.weapon_types?.length) lines.push(`Weapons: ${(huntingData.weapon_types as string[]).join(', ')}`)
    if (huntingData?.hunt_styles?.length) lines.push(`Hunt styles: ${(huntingData.hunt_styles as string[]).join(', ')}`)
    if (huntingData?.annual_budget) lines.push(`Budget: ${huntingData.annual_budget}`)
    if (huntingData?.max_drive_hours) lines.push(`Max drive: ${huntingData.max_drive_hours} hours`)
  } else {
    lines.push('No profile data available')
  }

  // Preference/bonus points
  const points = pointsResult.data ?? []
  lines.push('')
  lines.push('[PREFERENCE POINTS]')
  if (points.length > 0) {
    for (const p of points) {
      lines.push(`${p.state} ${p.species}: ${p.points} ${p.point_type} points`)
    }
  } else {
    lines.push(`No points recorded for ${wizard.state} ${wizard.species}`)
  }

  // Fitness baseline
  const baseline = baselineResult.data
  lines.push('')
  lines.push('[FITNESS BASELINE]')
  if (baseline) {
    const runMin = Math.floor(baseline.run_time_seconds / 60)
    const runSec = baseline.run_time_seconds % 60
    lines.push(`2-mile run: ${runMin}:${String(runSec).padStart(2, '0')}, ${baseline.pushups} pushups, ${baseline.situps} situps, ${baseline.pullups} pullups`)
    lines.push(`Tested: ${baseline.tested_at}`)
  } else {
    lines.push('No baseline test recorded')
  }

  // Application history
  const apps = applicationsResult.data ?? []
  lines.push('')
  lines.push('[APPLICATION HISTORY]')
  if (apps.length > 0) {
    for (const a of apps) {
      lines.push(`${a.year} ${a.state} ${a.species}: Unit ${a.unit ?? 'unknown'}, ${a.status}`)
    }
  } else {
    lines.push(`No prior applications for ${wizard.state} ${wizard.species}`)
  }

  // Draw deadlines
  const draws = drawResult.data ?? []
  lines.push('')
  lines.push('[DRAW DEADLINES]')
  if (draws.length > 0) {
    for (const d of draws) {
      const parts = [`${wizard.state} ${d.species}`]
      if (d.deadline) parts.push(`Deadline: ${d.deadline}`)
      if (d.results_date) parts.push(`Results: ${d.results_date}`)
      if (d.status) parts.push(`Status: ${d.status}`)
      lines.push(parts.join(' | '))
      if (d.note) lines.push(`  Note: ${d.note}`)
    }
  } else {
    lines.push('No draw deadline data available')
  }

  // Wizard inputs
  lines.push('')
  lines.push('[WIZARD INPUTS]')
  lines.push(`State: ${wizard.state}, Species: ${wizard.species}, Season: ${wizard.season}`)
  lines.push(`Residency: ${wizard.residency}`)
  lines.push(`Transportation: ${wizard.transportation.join(', ')}`)
  lines.push(`Trip style: ${Array.isArray(wizard.tripStyle) ? wizard.tripStyle.join(', ') : wizard.tripStyle}`)
  lines.push(`Priorities: ${wizard.priorities.join(', ')}`)
  if (wizard.notes) lines.push(`Notes: ${wizard.notes}`)

  return lines.join('\n')
}
