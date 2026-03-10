import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tests, error } = await supabase
    .from('baseline_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('tested_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tests: tests ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { run_time_seconds, pushups, situps, pullups, notes } = await req.json()

  if (run_time_seconds == null || pushups == null || situps == null || pullups == null) {
    return NextResponse.json({ error: 'All four test fields are required' }, { status: 400 })
  }

  if (
    typeof run_time_seconds !== 'number' || run_time_seconds < 1 ||
    typeof pushups !== 'number' || pushups < 0 ||
    typeof situps !== 'number' || situps < 0 ||
    typeof pullups !== 'number' || pullups < 0
  ) {
    return NextResponse.json({ error: 'Invalid field values' }, { status: 400 })
  }

  const { data: test, error } = await supabase
    .from('baseline_tests')
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ test })
}
