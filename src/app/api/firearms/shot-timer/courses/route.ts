import { createClient } from '@/lib/supabase/server'
import { apiOk, apiDone, unauthorized, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

/** GET /api/firearms/shot-timer/courses — List user's courses of fire */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: courses, error } = await supabase
    .from('firearms_course_of_fire')
    .select('*')
    .eq('user_id', user.id)
    .order('created_on', { ascending: false })

  if (error) return serverError()

  return apiOk({ courses: courses ?? [] })
}

/** POST /api/firearms/shot-timer/courses — Create a course of fire */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body

  const name = body.name?.trim()
  if (!name) return badRequest('Name is required')

  const stringsCount = body.strings_count
  if (!stringsCount || stringsCount < 1 || stringsCount > 10) {
    return badRequest('strings_count must be 1-10')
  }

  const shotsPerString = body.shots_per_string
  if (!shotsPerString || shotsPerString < 1 || shotsPerString > 99) {
    return badRequest('shots_per_string must be 1-99')
  }

  const delayMode = body.delay_mode ?? 'random'
  if (!['fixed', 'random', 'instant'].includes(delayMode)) {
    return badRequest('Invalid delay_mode')
  }

  const { data: course, error } = await supabase
    .from('firearms_course_of_fire')
    .insert({
      user_id: user.id,
      name,
      description: body.description ?? null,
      strings_count: stringsCount,
      shots_per_string: shotsPerString,
      delay_mode: delayMode,
      delay_min_ms: body.delay_min_ms ?? 2000,
      delay_max_ms: body.delay_max_ms ?? 5000,
      par_times_ms: body.par_times_ms ?? [],
    })
    .select()
    .single()

  if (error) return serverError()

  return apiOk({ course }, 201)
}

/** PATCH /api/firearms/shot-timer/courses — Update a course of fire */
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const id = body.id
  if (!id) return badRequest('id is required')

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const name = body.name?.trim()
    if (!name) return badRequest('Name cannot be empty')
    updates.name = name
  }
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.strings_count !== undefined) {
    if (body.strings_count < 1 || body.strings_count > 10) return badRequest('strings_count must be 1-10')
    updates.strings_count = body.strings_count
  }
  if (body.shots_per_string !== undefined) {
    if (body.shots_per_string < 1 || body.shots_per_string > 99) return badRequest('shots_per_string must be 1-99')
    updates.shots_per_string = body.shots_per_string
  }
  if (body.delay_mode !== undefined) {
    if (!['fixed', 'random', 'instant'].includes(body.delay_mode)) return badRequest('Invalid delay_mode')
    updates.delay_mode = body.delay_mode
  }
  if (body.delay_min_ms !== undefined) updates.delay_min_ms = body.delay_min_ms
  if (body.delay_max_ms !== undefined) updates.delay_max_ms = body.delay_max_ms
  if (body.par_times_ms !== undefined) updates.par_times_ms = body.par_times_ms

  const { data: course, error } = await supabase
    .from('firearms_course_of_fire')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return serverError()

  return apiOk({ course })
}

/** DELETE /api/firearms/shot-timer/courses — Delete a course of fire by id */
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return badRequest('id is required')

  const { error } = await supabase
    .from('firearms_course_of_fire')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return serverError()

  return apiDone()
}
