import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, serverError, withHandler } from '@/lib/api-response'

function computeAgeGroup(dob: string | null): string | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  if (age >= 56) return '56+'
  if (age >= 46) return '46-55'
  if (age >= 36) return '36-45'
  if (age >= 26) return '26-35'
  if (age >= 18) return '18-25'
  return null
}

export const GET = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const range = req.nextUrl.searchParams.get('range') ?? 'all'
  const scaling = req.nextUrl.searchParams.get('scaling') ?? 'all'
  const ageGroup = req.nextUrl.searchParams.get('age_group') ?? 'all'
  const fitnessLevel = req.nextUrl.searchParams.get('fitness_level') ?? 'all'

  // Calculate date range filter
  let rangeDate: string | null = null
  if (range === '4w') {
    const d = new Date()
    d.setDate(d.getDate() - 28)
    rangeDate = d.toISOString().slice(0, 10)
  } else if (range === '12w') {
    const d = new Date()
    d.setDate(d.getDate() - 84)
    rangeDate = d.toISOString().slice(0, 10)
  }

  // Build query for leaderboard_points
  let query = supabase
    .from('fitness_leaderboard_points')
    .select('user_id, points, week_start, scaling')

  if (rangeDate) {
    query = query.gte('week_start', rangeDate)
  }
  if (scaling !== 'all') {
    query = query.eq('scaling', scaling as 'rx' | 'scaled' | 'beginner')
  }

  const { data: pointsData, error } = await query

  if (error) {
    console.error('[Fitness Leaderboard] error:', error)
    return serverError()
  }
  if (!pointsData || pointsData.length === 0) {
    return apiOk({ standings: [], my_rank: null, total_participants: 0 })
  }

  // Aggregate points per user
  const userAgg: Record<string, { total_points: number; weeks: Set<string> }> = {}
  for (const row of pointsData) {
    if (!userAgg[row.user_id]) {
      userAgg[row.user_id] = { total_points: 0, weeks: new Set() }
    }
    userAgg[row.user_id].total_points += row.points
    userAgg[row.user_id].weeks.add(row.week_start)
  }

  const userIds = Object.keys(userAgg)

  // Fetch profiles and fitness data for filtering
  const [{ data: profiles }, { data: fitnessProfiles }] = await Promise.all([
    supabase
      .from('user_profile')
      .select('id, display_name, user_name, avatar_url, date_of_birth, gender')
      .in('id', userIds),
    supabase
      .from('fitness_profile')
      .select('id, fitness_level')
      .in('id', userIds),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const fitnessMap = new Map((fitnessProfiles ?? []).map(f => [f.id, f]))

  // Build standings with profile data, apply age/fitness filters
  const standings = userIds
    .map(userId => {
      const profile = profileMap.get(userId)
      const fitProfile = fitnessMap.get(userId)
      return {
        user_id: userId,
        display_name: profile?.display_name ?? 'Anonymous',
        user_name: profile?.user_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        age_group: computeAgeGroup(profile?.date_of_birth ?? null),
        gender: profile?.gender ?? null,
        fitness_level: fitProfile?.fitness_level ?? null,
        total_points: userAgg[userId].total_points,
        weeks_participated: userAgg[userId].weeks.size,
        is_mine: userId === user.id,
      }
    })
    .filter(s => {
      if (ageGroup !== 'all' && s.age_group !== ageGroup) return false
      if (fitnessLevel !== 'all' && s.fitness_level !== fitnessLevel) return false
      return true
    })
    .sort((a, b) => b.total_points - a.total_points)

  // Assign ranks
  const rankedStandings = standings.map((s, i) => ({ ...s, rank: i + 1 }))

  const myRank = rankedStandings.find(s => s.is_mine)?.rank ?? null

  return apiOk({
    standings: rankedStandings,
    my_rank: myRank,
    total_participants: rankedStandings.length,
  })
})

