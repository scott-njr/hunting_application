import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse, withHandler } from '@/lib/api-response'

export const GET = withHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: tests, error } = await supabase
    .from('fitness_baseline_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('tested_at', { ascending: false })

  if (error) {
    console.error('[fitness/baseline GET] fetch error:', error.message)
    return serverError()
  }

  return apiOk({ tests: tests ?? [] })
})


export const POST = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { run_time_seconds, pushups, situps, pullups, notes } = body

  if (run_time_seconds == null || pushups == null || situps == null || pullups == null) {
    return badRequest('All four test fields are required')
  }

  if (
    typeof run_time_seconds !== 'number' || run_time_seconds < 1 ||
    typeof pushups !== 'number' || pushups < 0 ||
    typeof situps !== 'number' || situps < 0 ||
    typeof pullups !== 'number' || pullups < 0
  ) {
    return badRequest('Invalid field values')
  }

  const { data: test, error } = await supabase
    .from('fitness_baseline_tests')
    .insert({
      user_id: user.id,
      run_time_seconds,
      pushups,
      situps,
      pullups,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[fitness/baseline POST] insert error:', error.message)
    return serverError()
  }

  return apiOk({ test }, 201)
})

