import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

/** GET /api/firearms/shot-timer — List user's sessions */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: sessions, error } = await supabase
    .from('firearms_shot_session')
    .select('*')
    .eq('user_id', user.id)
    .order('created_on', { ascending: false })
    .limit(50)

  if (error) return serverError()

  return apiOk({ sessions: sessions ?? [] })
}

/** POST /api/firearms/shot-timer — Create new session */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body

  const mode = body.mode ?? 'timer'
  if (!['timer', 'stopwatch', 'spy'].includes(mode)) {
    return badRequest('Invalid mode')
  }

  const sensitivity = body.sensitivity ?? 4
  if (sensitivity < 1 || sensitivity > 8) {
    return badRequest('Sensitivity must be 1-8')
  }

  const delayMode = body.delay_mode ?? 'random'
  if (!['fixed', 'random', 'instant'].includes(delayMode)) {
    return badRequest('Invalid delay_mode')
  }

  const baseData: Record<string, unknown> = {
    user_id: user.id,
    name: body.name ?? null,
    mode,
    sensitivity,
    delay_mode: delayMode,
    delay_min_ms: body.delay_min_ms ?? 2000,
    delay_max_ms: body.delay_max_ms ?? 5000,
    par_times_ms: body.par_times_ms ?? [],
    started_at: body.started_at ?? null,
  }

  // Try full insert with optional columns first, fall back to base if columns don't exist
  const fullData = {
    ...baseData,
    ...(body.band_thresholds ? { band_thresholds: body.band_thresholds } : {}),
    ...(body.match_id ? { match_id: body.match_id } : {}),
    ...(body.match_member_id ? { match_member_id: body.match_member_id } : {}),
  }

  let { data: session, error } = await supabase
    .from('firearms_shot_session')
    .insert(fullData as never)
    .select()
    .single()

  // Retry with base columns only if insert failed (e.g. missing columns from unapplied migrations)
  if (error) {
    console.error('[shot-timer-create] full insert failed, retrying base:', error.message)
    const retry = await supabase
      .from('firearms_shot_session')
      .insert(baseData as never)
      .select()
      .single()
    session = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[shot-timer-create]', error.message, error.code)
    return serverError()
  }

  return apiOk({ session }, 201)
}
