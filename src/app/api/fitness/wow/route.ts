import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getCurrentMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const date = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

export async function GET() {
  const supabase = await createClient()
  const weekStart = getCurrentMonday()

  // Try current week first
  const { data, error } = await supabase
    .from('fitness_weekly_workouts')
    .select('*')
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Fall back to the most recent workout if none generated yet this week
  if (!data) {
    const { data: latest, error: latestError } = await supabase
      .from('fitness_weekly_workouts')
      .select('*')
      .lte('week_start', weekStart)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      console.error(latestError)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json({ workout: latest })
  }

  return NextResponse.json({ workout: data })
}
