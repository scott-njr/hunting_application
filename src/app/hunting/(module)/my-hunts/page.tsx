import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, ClipboardList, Tent, MapPin, Package, GraduationCap, Bot } from 'lucide-react'
import { getUserModuleSubscriptionInfo, MODULE_AI_QUOTA } from '@/lib/modules'
import { SummaryCard } from '@/components/module-overview/summary-card'
import { SectionHeader } from '@/components/module-overview/section-header'
import { UpcomingList } from '@/components/module-overview/upcoming-list'

export default async function MyHuntsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    subInfo,
    huntsResult,
    deadlinesResult,
    profileResult,
    pinsResult,
    gearResult,
    coursesResult,
    progressResult,
  ] = await Promise.all([
    getUserModuleSubscriptionInfo(supabase, user.id, 'hunting'),
    // Active hunts
    supabase
      .from('hunting_plans')
      .select('id, title, status, trip_start_date, state, species')
      .eq('user_id', user.id)
      .in('status', ['planning', 'applied', 'booked'] as const)
      .order('trip_start_date', { ascending: true }),
    // Draw deadlines in next 30 days
    supabase
      .from('hunting_draw_species')
      .select('species, state_code, deadline')
      .gte('deadline', today)
      .lte('deadline', thirtyDaysOut)
      .order('deadline', { ascending: true }),
    // User's states of interest for filtering deadlines
    supabase
      .from('hunting_profile')
      .select('states_of_interest')
      .eq('id', user.id)
      .maybeSingle(),
    // Field map pins
    supabase
      .from('hunting_field_map_pins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    // Gear items
    supabase
      .from('hunting_gear_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    // Hunting courses
    supabase
      .from('courses')
      .select('id')
      .eq('module', 'hunting')
      .eq('published', true),
    // Completed courses
    supabase
      .from('course_progress')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('completed', true),
  ])

  const hunts = huntsResult.data ?? []
  const upcomingHunts = hunts.filter(h => h.trip_start_date && h.trip_start_date >= today)
  const nextHunt = upcomingHunts[0]

  // Filter deadlines by user's states of interest
  const statesOfInterest = (profileResult.data?.states_of_interest ?? []) as string[]
  const allDeadlines = deadlinesResult.data ?? []
  const deadlines = statesOfInterest.length > 0
    ? allDeadlines.filter(d => statesOfInterest.includes(d.state_code))
    : allDeadlines

  const pinCount = pinsResult.count ?? 0
  const gearCount = gearResult.count ?? 0

  const courseIds = new Set((coursesResult.data ?? []).map(c => c.id))
  const completedCourseIds = (progressResult.data ?? []).filter(p => courseIds.has(p.course_id))
  const totalCourses = courseIds.size
  const completedCourses = completedCourseIds.length

  const aiUsed = subInfo.aiQueriesThisMonth
  const aiQuota = MODULE_AI_QUOTA[subInfo.tier]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Hunting</h1>
        <p className="text-secondary text-sm mt-1">Your hunting overview at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Hunts"
          value={hunts.length}
          subtitle={nextHunt ? `Next: ${nextHunt.title ?? 'Untitled'}` : 'No upcoming hunts'}
          icon={Tent}
          href="/hunting/hunts"
          accent={hunts.length > 0}
        />
        <SummaryCard
          title="Draw Deadlines"
          value={deadlines.length}
          subtitle={deadlines.length > 0 ? `Next: ${deadlines[0].deadline}` : 'None in next 30 days'}
          icon={Calendar}
          href="/hunting/deadlines"
          accent={deadlines.length > 0}
        />
        <SummaryCard
          title="Applications"
          value={hunts.filter(h => h.status === 'applied').length}
          subtitle={`${hunts.filter(h => h.status === 'planning').length} planning, ${hunts.filter(h => h.status === 'booked').length} booked`}
          icon={ClipboardList}
          href="/hunting/applications"
        />
        <SummaryCard
          title="Field Map Pins"
          value={pinCount}
          subtitle="Sightings, sign & markers"
          icon={MapPin}
          href="/hunting/field-map"
        />
        <SummaryCard
          title="Gear Items"
          value={gearCount}
          subtitle="Inventory tracked"
          icon={Package}
          href="/hunting/gear"
        />
        <SummaryCard
          title="Courses"
          value={`${completedCourses}/${totalCourses}`}
          subtitle={totalCourses > 0 ? `${Math.round((completedCourses / totalCourses) * 100)}% complete` : 'No courses available'}
          icon={GraduationCap}
          href="/hunting/courses"
        />
        <SummaryCard
          title="AI Queries"
          value={`${aiUsed}/${aiQuota}`}
          subtitle="Used this month"
          icon={Bot}
          href="/hunting/ai-assistant"
        />
      </div>

      {/* Upcoming sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="space-y-3">
          <SectionHeader title="Upcoming Deadlines" viewAllHref="/hunting/deadlines" />
          <UpcomingList
            items={deadlines.filter(d => d.deadline).slice(0, 5).map(d => ({
              date: d.deadline!,
              title: `${d.species}`,
              subtitle: d.state_code,
              href: '/hunting/deadlines',
            }))}
            emptyMessage="No upcoming deadlines in your states"
          />
        </div>

        {/* Upcoming Trips */}
        <div className="space-y-3">
          <SectionHeader title="Upcoming Trips" viewAllHref="/hunting/hunts" />
          <UpcomingList
            items={upcomingHunts.slice(0, 3).map(h => ({
              date: h.trip_start_date!,
              title: h.title ?? 'Untitled Hunt',
              subtitle: [h.state, h.species].filter(Boolean).join(' · ') || undefined,
              href: `/hunting/hunts`,
              badge: h.status,
            }))}
            emptyMessage="No upcoming trips scheduled"
          />
        </div>
      </div>
    </div>
  )
}
