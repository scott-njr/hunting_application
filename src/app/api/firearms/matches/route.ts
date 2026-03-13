import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

/** GET /api/firearms/matches — List organizer's matches */
export const GET = withHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: matches, error } = await supabase
    .from('firearms_match')
    .select('*, course:firearms_course_of_fire(name, strings_count, shots_per_string)')
    .eq('organizer_id', user.id)
    .order('created_on', { ascending: false })

  if (error) return serverError()

  // Get member counts for each match
  const matchIds = (matches ?? []).map(m => m.id)
  let memberCounts: Record<string, number> = {}

  if (matchIds.length > 0) {
    const { data: counts } = await supabase
      .from('firearms_match_member')
      .select('match_id')
      .in('match_id', matchIds)

    memberCounts = (counts ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.match_id] = (acc[row.match_id] ?? 0) + 1
      return acc
    }, {})
  }

  const enriched = (matches ?? []).map(m => ({
    ...m,
    member_count: memberCounts[m.id] ?? 0,
  }))

  return apiOk({ matches: enriched })
})


/** POST /api/firearms/matches — Create match */
export const POST = withHandler(async (req: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { name, course_of_fire_id, match_date } = body

  if (!name?.trim()) return badRequest('Name is required')
  if (!course_of_fire_id) return badRequest('Course of fire is required')

  const { data: match, error } = await supabase
    .from('firearms_match')
    .insert({
      organizer_id: user.id,
      name: name.trim(),
      course_of_fire_id,
      match_date: match_date ?? null,
    })
    .select()
    .single()

  if (error) return serverError()

  return apiOk({ match }, 201)
})

