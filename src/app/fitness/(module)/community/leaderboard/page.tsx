import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WowLeaderboard } from '@/components/fitness/wow-leaderboard'
import { Trophy } from 'lucide-react'

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

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const weekStart = getCurrentMonday()

  // Fetch current week's workout, fall back to most recent
  let { data: workout } = await supabase
    .from('fitness_weekly_workouts')
    .select('id, title, week_start')
    .eq('week_start', weekStart)
    .maybeSingle()

  if (!workout) {
    const { data: latest } = await supabase
      .from('fitness_weekly_workouts')
      .select('id, title, week_start')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()
    workout = latest
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
        <p className="text-secondary text-sm mt-1">
          {workout ? `Weekly Challenge: ${workout.title}` : 'Weekly challenge rankings'}
        </p>
      </div>

      {workout ? (
        <WowLeaderboard workoutId={workout.id} />
      ) : (
        <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
          <Trophy className="h-8 w-8 text-muted mx-auto mb-3" />
          <h2 className="text-primary font-bold text-lg mb-2">No Challenge Yet</h2>
          <p className="text-secondary text-sm">
            The leaderboard will appear once the first weekly challenge is posted.
          </p>
        </div>
      )}
    </div>
  )
}
