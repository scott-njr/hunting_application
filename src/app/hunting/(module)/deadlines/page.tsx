import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { Database } from '@/types/database.types'
import { DeadlinesClient } from '@/components/dashboard/deadlines-client'

type DrawSpeciesRow = Database['public']['Tables']['hunting_draw_species']['Row']
type DrawStatesRow = Database['public']['Tables']['hunting_draw_states']['Row']

export type DrawSpeciesWithState = DrawSpeciesRow & {
  hunting_draw_states: DrawStatesRow
}

export default async function DeadlinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch user's species + state interests from their profile
  const { data: profile } = await supabase
    .from('hunting_profile')
    .select('target_species, states_of_interest')
    .eq('id', user.id)
    .maybeSingle()

  const speciesFilter: string[] = profile?.target_species ?? []
  const statesFilter: string[] = profile?.states_of_interest ?? []
  const hasInterests = speciesFilter.length > 0 || statesFilter.length > 0

  // Fetch hunting_draw_species rows with nested hunting_draw_states
  let query = supabase
    .from('hunting_draw_species')
    .select('*, hunting_draw_states(*)')
    .order('state_code')
    .order('species')

  if (speciesFilter.length > 0) query = query.in('species', speciesFilter)
  if (statesFilter.length > 0) query = query.in('state_code', statesFilter)

  // Fetch draws, existing applications, and user's points in parallel
  const [{ data: draws }, { data: applications }, { data: pointRows }] = await Promise.all([
    query,
    supabase
      .from('hunting_applications')
      .select('state, species, year')
      .eq('user_id', user.id)
      .eq('status', 'applied'),
    supabase
      .from('hunting_points')
      .select('state, species, points, point_type')
      .eq('user_id', user.id),
  ])

  const appliedKeys = (applications ?? []).map(a => `${a.state}-${a.species}-${a.year}`)

  // Build a map: "STATE_CODE-species" -> { preference?: number, bonus?: number }
  type PointsEntry = { preference?: number; bonus?: number }
  const pointsMap: Record<string, PointsEntry> = {}
  for (const row of pointRows ?? []) {
    const key = `${row.state}-${row.species}`
    if (!pointsMap[key]) pointsMap[key] = {}
    pointsMap[key][row.point_type] = row.points
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Calendar className="h-5 w-5 text-accent-hover" />
        <h1 className="text-2xl font-bold text-primary">Deadline Tracker</h1>
      </div>
      <p className="text-secondary text-sm mb-6">
        Draw application windows, requirements, and dates.
        Click &quot;I Applied&quot; after you apply to move it to{' '}
        <a href="/hunting/applications" className="text-secondary hover:text-primary underline">Applications</a>.
      </p>

      <DeadlinesClient
        draws={(draws ?? []) as unknown as DrawSpeciesWithState[]}
        hasInterests={hasInterests}
        appliedKeys={appliedKeys}
        pointsMap={pointsMap}
      />

      <p className="text-muted text-xs mt-6">
        New Mexico coming soon.
        Always verify dates and requirements directly with the state agency before applying.
      </p>
    </div>
  )
}
