import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/** POST /api/firearms/shot-timer/[sessionId]/strings — Save a completed string */
export const POST = withHandler(async (req: Request, { params }: RouteParams) => {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body

  const stringNumber = body.string_number
  if (!stringNumber || stringNumber < 1 || stringNumber > 10) {
    return badRequest('string_number must be 1-10')
  }

  const { data: string, error } = await supabase
    .from('firearms_shot_string')
    .upsert({
      session_id: sessionId,
      user_id: user.id,
      string_number: stringNumber,
      shots_ms: body.shots_ms ?? [],
      shot_amplitudes: body.shot_amplitudes ?? [],
      amplitude_samples: body.amplitude_samples ?? null,
      split_times_ms: body.split_times_ms ?? [],
      total_time_ms: body.total_time_ms ?? null,
      shot_count: body.shot_count ?? 0,
      points: body.points ?? null,
      hit_factor: body.hit_factor ?? null,
      par_hit: body.par_hit ?? null,
    }, {
      onConflict: 'session_id,string_number',
    })
    .select()
    .single()

  if (error) return serverError()

  return apiOk({ string }, 201)
})

