import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MatchDetailClient } from '@/components/firearms/matches/match-detail-client'

interface PageProps {
  params: Promise<{ matchId: string }>
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: match } = await supabase
    .from('firearms_match')
    .select('*')
    .eq('id', matchId)
    .single()

  if (!match) notFound()

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // Fetch members — try with session scoring join, fall back to base columns
  let rawMembers: Record<string, unknown>[] | null = null
  const { data: fullMembers, error: fullErr } = await supabase
    .from('firearms_match_member')
    .select('*, session:firearms_shot_session(points, hit_factor, alpha, bravo, charlie, delta, miss, status, total_strings, ended_at)')
    .eq('match_id', matchId)
    .order('shoot_order', { ascending: true })
  if (!fullErr) {
    rawMembers = fullMembers as Record<string, unknown>[]
  } else {
    // Scoring columns may not exist yet — fetch without session join
    const { data: baseMembers } = await supabase
      .from('firearms_match_member')
      .select('*')
      .eq('match_id', matchId)
      .order('shoot_order', { ascending: true })
    rawMembers = (baseMembers ?? []).map(m => ({ ...m, session: null })) as Record<string, unknown>[]
  }

  // Fetch user profiles separately and merge
  const memberList = rawMembers ?? []
  const memberUserIds = memberList.map(m => m.user_id as string)
  let profileMap: Record<string, { display_name: string | null; user_name: string | null; avatar_url: string | null }> = {}
  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profile')
      .select('id, display_name, user_name, avatar_url')
      .in('id', memberUserIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = { display_name: p.display_name, user_name: p.user_name, avatar_url: p.avatar_url }
    }
  }
  const membersWithProfiles = memberList.map(m => ({
    ...m,
    user: profileMap[m.user_id as string] ?? null,
  }))

  const { data: course } = await supabase
    .from('firearms_course_of_fire')
    .select('*')
    .eq('id', match.course_of_fire_id)
    .single()

  return (
    <MatchDetailClient
      userId={user.id}
      userName={profile?.display_name ?? 'Shooter'}
      match={match}
      initialMembers={membersWithProfiles as never[]}
      course={course}
      isOrganizer={match.organizer_id === user.id}
    />
  )
}
