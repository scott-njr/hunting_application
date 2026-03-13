import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Timer } from 'lucide-react'
import { ShotTimerClient, type MatchTimerContext } from '@/components/firearms/shot-timer/shot-timer-client'

interface PageProps {
  params: Promise<{ matchId: string; memberId: string }>
}

export default async function MatchTimerPage({ params }: PageProps) {
  const { matchId, memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch match
  const { data: match } = await supabase
    .from('firearms_match')
    .select('id, name, course_of_fire_id, status')
    .eq('id', matchId)
    .single()

  if (!match) notFound()

  // Fetch all members to get total count, specific member, and next unscored shooter
  const { data: allMembers } = await supabase
    .from('firearms_match_member')
    .select('id, user_id, shoot_order, session_id')
    .eq('match_id', matchId)
    .order('shoot_order', { ascending: true })

  const member = allMembers?.find(m => m.id === memberId)
  if (!member) notFound()

  // Fetch member's profile name
  const { data: memberProfile } = await supabase
    .from('user_profile')
    .select('display_name')
    .eq('id', member.user_id)
    .single()

  // Fetch logged-in user's profile name
  const { data: userProfile } = await supabase
    .from('user_profile')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // Fetch course of fire
  const { data: course } = await supabase
    .from('firearms_course_of_fire')
    .select('name, strings_count, shots_per_string, delay_mode, delay_min_ms, delay_max_ms, par_times_ms')
    .eq('id', match.course_of_fire_id)
    .single()

  if (!course) notFound()

  // Fetch sessions for history
  const { data: sessions } = await supabase
    .from('firearms_shot_session')
    .select('*')
    .eq('user_id', user.id)
    .order('created_on', { ascending: false })
    .limit(20)

  const shootOrder = allMembers?.findIndex(m => m.id === memberId) ?? 0

  // Find next unscored shooter (excluding current) for auto-advance
  let nextShooter: { memberId: string; shooterName: string } | null = null
  if (allMembers) {
    const unscoredAfter = allMembers.filter(m => m.id !== memberId && !m.session_id)
    if (unscoredAfter.length > 0) {
      const next = unscoredAfter[0]
      // Fetch the next shooter's display name
      const { data: nextProfile } = await supabase
        .from('user_profile')
        .select('display_name')
        .eq('id', next.user_id)
        .single()
      nextShooter = {
        memberId: next.id,
        shooterName: nextProfile?.display_name ?? 'Next Shooter',
      }
    }
  }

  const matchContext: MatchTimerContext = {
    matchId,
    matchName: match.name,
    memberId,
    shooterName: memberProfile?.display_name ?? 'Shooter',
    shootOrder: shootOrder + 1,
    totalShooters: allMembers?.length ?? 0,
    courseName: course.name,
    courseStrings: course.strings_count,
    courseShotsPerString: course.shots_per_string,
    courseDelayMode: course.delay_mode as 'fixed' | 'random' | 'instant',
    courseDelayMinMs: course.delay_min_ms,
    courseDelayMaxMs: course.delay_max_ms,
    courseParTimesMs: course.par_times_ms,
    nextShooter,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Timer className="h-6 w-6 text-accent" />
        <h1 className="text-primary font-bold text-xl">Shot Timer</h1>
      </div>
      <ShotTimerClient
        userId={user.id}
        userName={userProfile?.display_name ?? 'Shooter'}
        initialSessions={sessions ?? []}
        matchContext={matchContext}
      />
    </div>
  )
}
