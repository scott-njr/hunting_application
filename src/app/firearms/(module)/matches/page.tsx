import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { MatchesClient } from '@/components/firearms/matches/matches-client'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: matches } = await supabase
    .from('firearms_match')
    .select('*, course:firearms_course_of_fire(name, strings_count, shots_per_string)')
    .eq('organizer_id', user.id)
    .order('created_on', { ascending: false })

  const { data: courses } = await supabase
    .from('firearms_course_of_fire')
    .select('id, name, strings_count, shots_per_string')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-accent" />
        <h1 className="text-primary font-bold text-xl">Matches</h1>
      </div>
      <MatchesClient
        userId={user.id}
        initialMatches={matches ?? []}
        courses={courses ?? []}
      />
    </div>
  )
}
