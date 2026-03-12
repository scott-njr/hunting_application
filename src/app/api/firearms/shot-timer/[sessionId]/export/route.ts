import { createClient } from '@/lib/supabase/server'
import { unauthorized, notFound, serverError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/** GET /api/firearms/shot-timer/[sessionId]/export — Export session as Practiscore-compatible CSV */
export async function GET(_req: Request, { params }: RouteParams) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // Verify ownership
  const { data: session, error: sessionErr } = await supabase
    .from('firearms_shot_session')
    .select('id, name')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionErr || !session) return notFound('Session not found')

  // Get strings
  const { data: strings, error: stringsErr } = await supabase
    .from('firearms_shot_string')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('string_number', { ascending: true })

  if (stringsErr) return serverError()

  // Build CSV
  const header = 'String,Shots,TotalTime,SplitTimes,Points,HitFactor'
  const rows = (strings ?? []).map(s => {
    const totalTime = s.total_time_ms ? (s.total_time_ms / 1000).toFixed(2) : '0.00'
    const splits = (s.split_times_ms ?? []).map(ms => (ms / 1000).toFixed(2)).join(',')
    const points = s.points ?? ''
    const hf = s.hit_factor ? s.hit_factor.toFixed(4) : ''
    return `${s.string_number},${s.shot_count},${totalTime},"${splits}",${points},${hf}`
  })

  const csv = [header, ...rows].join('\n')
  const filename = session.name
    ? `shot-timer-${session.name.replace(/[^a-zA-Z0-9]/g, '-')}.csv`
    : `shot-timer-${sessionId.slice(0, 8)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
