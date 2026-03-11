import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function matchesAgeGroup(dob: string | null, group: string): boolean {
  if (group === 'all') return true
  if (!dob) return false
  const age = getAge(dob)
  switch (group) {
    case '18-25': return age >= 18 && age <= 25
    case '26-35': return age >= 26 && age <= 35
    case '36-45': return age >= 36 && age <= 45
    case '46-55': return age >= 46 && age <= 55
    case '56+': return age >= 56
    default: return true
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    .from('leaderboard_points')
    .select('user_id, points, week_start, scaling')

  if (rangeDate) {
    query = query.gte('week_start', rangeDate)
  }
  if (scaling !== 'all') {
    query = query.eq('scaling', scaling as 'rx' | 'scaled' | 'beginner')
  }

  const { data: pointsData, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!pointsData || pointsData.length === 0) {
    return NextResponse.json({ standings: [], my_rank: null, total_participants: 0 })
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

  // Fetch profiles and member data for filtering
  const [{ data: profiles }, { data: members }] = await Promise.all([
    supabase
      .from('hunter_profiles')
      .select('id, display_name, avatar_url, date_of_birth, gender')
      .in('id', userIds),
    supabase
      .from('members')
      .select('id, fitness_level')
      .in('id', userIds),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const memberMap = new Map((members ?? []).map(m => [m.id, m]))

  // Build standings with profile data, apply age/fitness filters
  let standings = userIds
    .map(userId => {
      const profile = profileMap.get(userId)
      const member = memberMap.get(userId)
      return {
        user_id: userId,
        display_name: profile?.display_name ?? 'Anonymous',
        avatar_url: profile?.avatar_url ?? null,
        date_of_birth: profile?.date_of_birth ?? null,
        gender: profile?.gender ?? null,
        fitness_level: member?.fitness_level ?? null,
        total_points: userAgg[userId].total_points,
        weeks_participated: userAgg[userId].weeks.size,
        is_mine: userId === user.id,
      }
    })
    .filter(s => {
      if (!matchesAgeGroup(s.date_of_birth, ageGroup)) return false
      if (fitnessLevel !== 'all' && s.fitness_level !== fitnessLevel) return false
      return true
    })
    .sort((a, b) => b.total_points - a.total_points)

  // Assign ranks
  const rankedStandings = standings.map((s, i) => ({ ...s, rank: i + 1 }))

  const myRank = rankedStandings.find(s => s.is_mine)?.rank ?? null

  return NextResponse.json({
    standings: rankedStandings,
    my_rank: myRank,
    total_participants: rankedStandings.length,
  })
}
