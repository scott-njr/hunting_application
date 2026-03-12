import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleSubscriptions, ALL_MODULES, MODULE_AI_QUOTA, type ModuleSlug } from '@/lib/modules'
import { ModuleCard } from '@/components/home/module-card'
import { UpcomingTrips } from '@/components/home/upcoming-trips'
import { FitnessDashboard } from '@/components/home/fitness-dashboard'
import { CourseProgressRow } from '@/components/home/course-progress-row'
import { TopPosts } from '@/components/home/top-posts'
import { SidebarFeed } from '@/components/home/sidebar-feed'
import { AiUsageCard } from '@/components/home/ai-usage-card'
import { Scorecards } from '@/components/home/scorecards'
import { QuickAccessCards } from '@/components/home/quick-access-cards'
import { WeeklyPreview, type DayItem, type FlexItem, type WeekDay } from '@/components/home/weekly-preview'

/** Maps session count → which days of the week (0=Sun, 1=Mon, ..., 6=Sat) */
const TRAINING_DAYS: Record<number, number[]> = {
  1: [1],
  2: [2, 4],             // Tue, Thu
  3: [1, 3, 5],          // Mon, Wed, Fri
  4: [1, 2, 4, 5],       // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5],    // Mon–Fri
  6: [1, 2, 3, 4, 5, 6], // Mon–Sat
}

type PlanData = {
  goal_summary?: string
  weeks?: Array<{
    week_number: number
    theme: string
    sessions: Array<Record<string, unknown>>
  }>
}

function getCurrentWeek(startedAt: string, weeksTotal: number): number {
  const start = new Date(startedAt).getTime()
  const now = Date.now()
  const week = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(week, weeksTotal))
}

function getTodayDayNumber(): number {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

// Quick-link config per module
const MODULE_QUICK_LINKS: Record<ModuleSlug, { label: string; href: string }[]> = {
  hunting: [
    { label: 'Deadlines', href: '/hunting/deadlines' },
    { label: 'Field Map', href: '/hunting/field-map' },
    { label: 'Draw Research', href: '/hunting/ai-assistant' },
  ],
  archery: [
    { label: 'Courses', href: '/archery/courses' },
    { label: 'Community', href: '/archery/community' },
  ],
  firearms: [
    { label: 'Courses', href: '/firearms/courses' },
    { label: 'Community', href: '/firearms/community' },
  ],
  medical: [
    { label: 'Courses', href: '/medical/courses' },
    { label: 'Community', href: '/medical/community' },
  ],
  fishing: [
    { label: 'Courses', href: '/fishing/courses' },
    { label: 'Community', href: '/fishing/community' },
  ],
  fitness: [
    { label: 'My Fitness', href: '/fitness/my-plan' },
    { label: 'Run Coach', href: '/fitness/run-coach' },
    { label: 'Meal Prep', href: '/fitness/meal-prep' },
  ],
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Round 1: independent queries
  const [subscriptions, profileResult] = await Promise.all([
    getUserModuleSubscriptions(supabase, user.id),
    supabase
      .from('user_profile')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const subscribedSlugs = (Object.keys(subscriptions) as ModuleSlug[]).filter(slug => subscriptions[slug]!.tier !== 'free')
  const hasHunting = !!subscriptions.hunting && subscriptions.hunting.tier !== 'free'
  const hasFitness = !!subscriptions.fitness && subscriptions.fitness.tier !== 'free'
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(new Date(today).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Round 2: depends on subscriptions
  const [
    tripsResult,
    fitnessPlansResult,
    baselineResult,
    workoutCountResult,
    coursesResult,
    courseProgressResult,
    feedPostsResult,
    userPostsResult,
    wowResult,
    deadlinesResult,
    hunterProfileResult,
  ] = await Promise.all([
    // Upcoming hunts
    hasHunting
      ? supabase
          .from('hunting_plans')
          .select('id, title, state, species, unit, status, trip_start_date, trip_end_date, trip_days')
          .eq('user_id', user.id)
          .in('status', ['planning', 'applied', 'booked'] as const)
          .gte('trip_start_date', today)
          .order('trip_start_date', { ascending: true })
          .limit(5)
      : Promise.resolve({ data: null }),
    // Fitness plans
    hasFitness
      ? supabase.from('fitness_training_plans').select('*').eq('user_id', user.id).eq('status', 'active')
      : Promise.resolve({ data: null }),
    // Baseline tests
    hasFitness
      ? supabase.from('fitness_baseline_tests').select('*').eq('user_id', user.id).order('tested_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: null }),
    // Total workouts logged
    hasFitness
      ? supabase.from('fitness_plan_workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true)
      : Promise.resolve({ count: 0 }),
    // All published courses
    supabase.from('courses').select('id, module').eq('published', true),
    // User's course progress
    supabase.from('course_progress').select('course_id').eq('user_id', user.id).eq('completed', true),
    // Community feed (sidebar)
    supabase
      .from('social_posts')
      .select('id, user_id, content, module, created_on')
      .order('created_on', { ascending: false })
      .limit(10),
    // User's own posts for "top posts"
    supabase
      .from('social_posts')
      .select('id, post_type, content, module, created_on')
      .eq('user_id', user.id)
      .order('created_on', { ascending: false })
      .limit(20),
    // Weekly challenge (WOW)
    hasFitness
      ? supabase.from('fitness_weekly_workouts').select('title, description').eq('week_start', getMondayOfWeek(new Date())).maybeSingle()
      : Promise.resolve({ data: null }),
    // Draw deadlines within next 7 days
    hasHunting
      ? supabase.from('hunting_draw_species').select('species, state_code, deadline').gte('deadline', today).lte('deadline', nextWeek)
      : Promise.resolve({ data: null }),
    // User's states of interest (for filtering deadlines)
    hasHunting
      ? supabase.from('hunting_profile').select('states_of_interest').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // ── Process fitness data ──
  const fitnessPlans = fitnessPlansResult.data ?? []
  const runPlan = fitnessPlans.find((p: { plan_type: string }) => p.plan_type === 'run')
  const strengthPlan = fitnessPlans.find((p: { plan_type: string }) => p.plan_type === 'strength')
  const mealPlan = fitnessPlans.find((p: { plan_type: string }) => p.plan_type === 'meal')

  // Fetch workout logs if fitness plans exist
  const planIds = [runPlan?.id, strengthPlan?.id].filter(Boolean) as string[]
  let allLogs: Array<{ plan_id: string; week_number: number; session_number: number; completed: boolean; completed_at: string }> = []
  if (planIds.length > 0) {
    const { data } = await supabase
      .from('fitness_plan_workout_logs')
      .select('plan_id, week_number, session_number, completed, completed_at')
      .in('plan_id', planIds)
    allLogs = data ?? []
  }

  function buildLogsByWeek(planId: string) {
    const map = new Map<number, Set<number>>()
    for (const log of allLogs.filter((l: { plan_id: string; completed: boolean }) => l.plan_id === planId && l.completed)) {
      if (!map.has(log.week_number)) map.set(log.week_number, new Set())
      map.get(log.week_number)!.add(log.session_number)
    }
    return map
  }

  function buildChartData(planData: PlanData | null, logsByWeek: Map<number, Set<number>>) {
    const sessionsPerWeek: number[] = []
    const completedPerWeek: number[] = []
    if (planData?.weeks) {
      for (const week of planData.weeks) {
        sessionsPerWeek.push(week.sessions.length)
        completedPerWeek.push(logsByWeek.get(week.week_number)?.size ?? 0)
      }
    }
    return { sessionsPerWeek, completedPerWeek }
  }

  const runData = runPlan?.plan_data as PlanData | null
  const strengthData = strengthPlan?.plan_data as PlanData | null
  const runLogs = runPlan ? buildLogsByWeek(runPlan.id) : new Map<number, Set<number>>()
  const strengthLogs = strengthPlan ? buildLogsByWeek(strengthPlan.id) : new Map<number, Set<number>>()
  const runChart = runPlan ? { ...buildChartData(runData, runLogs), weeksTotal: runPlan.weeks_total, goal: runData?.goal_summary ?? 'Run Plan' } : null
  const strengthChart = strengthPlan ? { ...buildChartData(strengthData, strengthLogs), weeksTotal: strengthPlan.weeks_total, goal: strengthData?.goal_summary ?? 'Strength Plan' } : null

  // ── Process course progress ──
  const allCourses = coursesResult.data ?? []
  const completedIds = new Set((courseProgressResult.data ?? []).map((c: { course_id: string }) => c.course_id))
  const coursesByModule: Record<string, { total: number; completed: number }> = {}
  for (const course of allCourses) {
    if (!coursesByModule[course.module]) coursesByModule[course.module] = { total: 0, completed: 0 }
    coursesByModule[course.module].total++
    if (completedIds.has(course.id)) coursesByModule[course.module].completed++
  }
  const courseProgressModules = subscribedSlugs
    .filter(slug => coursesByModule[slug]?.total > 0)
    .map(slug => ({
      slug,
      name: ALL_MODULES.find(m => m.slug === slug)!.name,
      completed: coursesByModule[slug]?.completed ?? 0,
      total: coursesByModule[slug]?.total ?? 0,
    }))

  // ── Process community feed (sidebar) ──
  const feedPosts = feedPostsResult.data ?? []
  const feedUserIds = [...new Set(feedPosts.map((p: { user_id: string }) => p.user_id))]
  const feedProfilesResult = feedUserIds.length > 0
    ? await supabase.from('user_profile').select('id, display_name').in('id', feedUserIds)
    : { data: [] }
  const feedProfileMap = new Map(
    (feedProfilesResult.data ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name ?? 'Unknown'])
  )
  const sidebarPosts = feedPosts.map((p: { id: string; user_id: string; content: string; module: string; created_on: string }) => ({
    id: p.id,
    module: p.module,
    displayName: feedProfileMap.get(p.user_id) ?? 'Unknown',
    content: p.content,
    created_on: p.created_on,
  }))

  // ── Process top posts ──
  const userPosts = userPostsResult.data ?? []
  const userPostIds = userPosts.map((p: { id: string }) => p.id)
  let topPosts: Array<{ id: string; post_type: string; content: string; module: string; created_on: string; reactionCount: number; commentCount: number }> = []

  if (userPostIds.length > 0) {
    const [reactionsResult, commentsResult] = await Promise.all([
      supabase.from('social_reactions').select('post_id').in('post_id', userPostIds),
      supabase.from('social_comments').select('post_id').in('post_id', userPostIds),
    ])

    const reactionCounts: Record<string, number> = {}
    for (const r of reactionsResult.data ?? []) {
      reactionCounts[r.post_id] = (reactionCounts[r.post_id] ?? 0) + 1
    }
    const commentCounts: Record<string, number> = {}
    for (const c of commentsResult.data ?? []) {
      commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1
    }

    topPosts = userPosts
      .map((p: { id: string; post_type: string; content: string; module: string; created_on: string }) => ({
        ...p,
        reactionCount: reactionCounts[p.id] ?? 0,
        commentCount: commentCounts[p.id] ?? 0,
      }))
      .filter(p => p.reactionCount + p.commentCount > 0)
      .sort((a, b) => (b.reactionCount + b.commentCount) - (a.reactionCount + a.commentCount))
      .slice(0, 3)
  }

  // ── Streak calculation ──
  const logDates = [...new Set(allLogs.map(l => l.completed_at.split('T')[0]))].sort().reverse()
  let streak = 0
  const streakToday = new Date()
  for (let i = 0; i < logDates.length; i++) {
    const checkDate = new Date(streakToday)
    checkDate.setDate(streakToday.getDate() - i)
    const checkStr = checkDate.toISOString().split('T')[0]
    if (logDates.includes(checkStr)) {
      streak++
    } else {
      break
    }
  }

  // ── Quick access data ──
  const tripsList = (tripsResult.data ?? []) as Array<{ id: string; title: string; state: string; species: string; trip_start_date: string | null }>
  const nextTrip = tripsList[0]
  const nextTripDate = nextTrip?.trip_start_date ?? null

  // Deadlines this week (filtered by user states)
  const rawDeadlines = (deadlinesResult.data ?? []) as Array<{ species: string; state_code: string; deadline: string }>
  const userStatesForFilter = (hunterProfileResult?.data as { states_of_interest: string[] } | null)?.states_of_interest ?? []
  const deadlinesThisWeek = rawDeadlines.filter(dl =>
    userStatesForFilter.length === 0 || userStatesForFilter.includes(dl.state_code)
  ).length

  // Today's fitness session counts
  const todayDayNum = getTodayDayNumber()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function countTodaySessions(planData: PlanData | null, plan: typeof runPlan, _logsByWeek: Map<number, Set<number>>): number {
    if (!plan || !planData?.weeks) return 0
    const currentWeek = getCurrentWeek(plan.started_at, plan.weeks_total)
    const weekData = planData.weeks.find(w => w.week_number === currentWeek)
    if (!weekData) return 0
    const sessionCount = weekData.sessions.length
    const trainingDays = TRAINING_DAYS[sessionCount] ?? TRAINING_DAYS[3]
    // trainingDays uses JS day format (0=Sun,1=Mon...6=Sat), todayDayNum uses 1=Mon...7=Sun
    const jsTodayDay = todayDayNum === 7 ? 0 : todayDayNum
    const todayIdx = trainingDays.indexOf(jsTodayDay)
    if (todayIdx === -1) return 0
    return 1
  }
  const todayRunCount = countTodaySessions(runData, runPlan, runLogs)
  const todayStrengthCount = countTodaySessions(strengthData, strengthPlan, strengthLogs)
  const mealData2 = mealPlan?.plan_data as PlanData | null
  const mealCurrentWeek2 = mealPlan ? getCurrentWeek(mealPlan.started_at, mealPlan.weeks_total) : 0
  const mealThisWeek2 = mealData2?.weeks?.find(w => w.week_number === mealCurrentWeek2)
  const todayMealCount = mealThisWeek2?.sessions?.filter(s => (s.day_number as number) === todayDayNum)?.length ?? 0
  const hasFitnessPlans = !!(runPlan || strengthPlan || mealPlan)
  const todayFitness = hasFitnessPlans ? {
    runCount: todayRunCount,
    strengthCount: todayStrengthCount,
    mealCount: todayMealCount,
    isRestDay: todayRunCount === 0 && todayStrengthCount === 0 && todayMealCount === 0,
  } : undefined

  // Course progress for quick access
  const totalCoursesCompleted = completedIds.size
  const firstModuleWithCourses = courseProgressModules[0]

  // ── Build weekly preview (day-by-day + flexible items) ──

  // Build 7 days starting from Monday of this week
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const monday = new Date(getMondayOfWeek(now))
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const weekDays: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr2 = d.toISOString().split('T')[0]
    return {
      date: dateStr2,
      dayName: DAY_NAMES[i],
      dayNum: d.getDate(),
      isToday: dateStr2 === todayStr,
      items: [] as DayItem[],
    }
  })

  // Add meals to each day from the current week
  if (mealPlan && mealThisWeek2) {
    // Group sessions by day_number (1=Mon..7=Sun)
    const sessionsByDay = new Map<number, Array<Record<string, unknown>>>()
    for (const session of mealThisWeek2.sessions) {
      const dayNum = session.day_number as number
      if (!sessionsByDay.has(dayNum)) sessionsByDay.set(dayNum, [])
      sessionsByDay.get(dayNum)!.push(session)
    }
    for (const [dayNum, sessions] of sessionsByDay) {
      const weekDay = weekDays[dayNum - 1]
      if (weekDay && sessions.length > 0) {
        const mealNames = sessions.map(s => (s.title as string) || (s.meal_type as string) || 'Meal').join(' · ')
        weekDay.items.push({
          type: 'meals',
          label: mealNames,
          href: '/fitness/my-plan',
        })
      }
    }
  }

  // Add hunt trips to their start date
  const trips = (tripsResult.data ?? []) as Array<{ id: string; title: string; state: string; species: string; trip_start_date: string | null }>
  for (const trip of trips) {
    if (trip.trip_start_date) {
      const matchDay = weekDays.find(d => d.date === trip.trip_start_date)
      if (matchDay) {
        matchDay.items.push({
          type: 'trip',
          label: `${trip.state} ${trip.species} — ${trip.title}`,
          href: '/hunting/hunts',
        })
      }
    }
  }

  // Add draw deadlines to their date
  const userStates = (hunterProfileResult?.data as { states_of_interest: string[] } | null)?.states_of_interest ?? []
  const upcomingDeadlines = (deadlinesResult.data ?? []) as Array<{ species: string; state_code: string; deadline: string }>
  for (const dl of upcomingDeadlines) {
    if (userStates.length === 0 || userStates.includes(dl.state_code)) {
      const matchDay = weekDays.find(d => d.date === dl.deadline)
      if (matchDay) {
        matchDay.items.push({
          type: 'deadline',
          label: `${dl.state_code} ${dl.species} deadline`,
          href: '/hunting/deadlines',
        })
      }
    }
  }

  // Add run sessions to specific days
  function addPlanSessionsToDays(
    plan: typeof runPlan,
    planData: PlanData | null,
    logsByWeek: Map<number, Set<number>>,
    itemType: 'run' | 'strength',
  ) {
    if (!plan || !planData?.weeks) return
    const currentWeek = getCurrentWeek(plan.started_at, plan.weeks_total)
    const weekData = planData.weeks.find(w => w.week_number === currentWeek)
    if (!weekData) return

    const sessionCount = weekData.sessions.length
    const trainingDays = TRAINING_DAYS[sessionCount] ?? TRAINING_DAYS[3]
    const completedSessions = logsByWeek.get(currentWeek) ?? new Set()

    weekData.sessions.forEach((session, i) => {
      const sessionNum = i + 1
      const isCompleted = completedSessions.has(sessionNum)
      if (isCompleted) return

      // trainingDays uses 0=Sun,1=Mon..6=Sat; weekDays array is 0=Mon..6=Sun
      const jsDayOfWeek = trainingDays[i % trainingDays.length]
      const weekDayIdx = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1 // convert to Mon=0 index
      const weekDay = weekDays[weekDayIdx]
      if (!weekDay) return

      const title = (session.title as string) || `Session ${sessionNum}`

      weekDay.items.push({
        type: itemType,
        label: title,
        href: '/fitness/my-plan',
        sessionType: itemType === 'strength' ? 'strength' : (session.type as string) ?? itemType,
        title,
        distanceMiles: session.distance_miles as number | undefined,
        durationMin: session.duration_min as number | undefined,
        effortLevel: session.effort_level as string | undefined,
        exerciseCount: Array.isArray(session.exercises) ? (session.exercises as unknown[]).length : undefined,
      })
    })
  }

  addPlanSessionsToDays(runPlan, runData, runLogs, 'run')
  addPlanSessionsToDays(strengthPlan, strengthData, strengthLogs, 'strength')

  // Build flexible items (only WOW — run/strength now on specific days)
  const flexItems: FlexItem[] = []

  if (wowResult.data) {
    flexItems.push({
      type: 'wow',
      title: `Weekly Challenge: "${wowResult.data.title}"`,
      subtitle: wowResult.data.description?.slice(0, 80) ?? '',
      href: '/fitness/weekly-challenge',
    })
  }

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_384px] gap-6">
      {/* ── Main Content ── */}
      <div className="min-w-0 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary">Welcome back, {firstName}</h1>
          <p className="text-secondary text-sm mt-1">{dateStr}</p>
        </div>

        {/* Scorecards */}
        <Scorecards
          activeModules={subscribedSlugs.length}
          totalCourses={allCourses.length}
          completedCourses={completedIds.size}
          workoutsLogged={workoutCountResult.count ?? 0}
          activePlans={(runPlan ? 1 : 0) + (strengthPlan ? 1 : 0) + (mealPlan ? 1 : 0)}
          upcomingTrips={(tripsResult.data ?? []).length}
          communityPosts={userPosts.length}
          baselineCount={(baselineResult.data ?? []).length}
          baselineBest={(() => {
            const tests = baselineResult.data ?? []
            if (tests.length === 0) return null
            return {
              pushups: Math.max(...tests.map((t: { pushups: number }) => t.pushups)),
              situps: Math.max(...tests.map((t: { situps: number }) => t.situps)),
              pullups: Math.max(...tests.map((t: { pullups: number }) => t.pullups)),
              runTimeSeconds: Math.min(...tests.map((t: { run_time_seconds: number }) => t.run_time_seconds)),
            }
          })()}
          streak={streak}
          nextTripDate={nextTripDate}
          deadlinesThisWeek={deadlinesThisWeek}
        />

        {/* Quick Access Cards */}
        <QuickAccessCards
          upcomingTrips={tripsList.length > 0 ? {
            count: tripsList.length,
            nextTitle: nextTrip!.title,
            nextDate: nextTripDate,
          } : undefined}
          deadlinesThisWeek={deadlinesThisWeek}
          todayFitness={todayFitness}
          weeklyChallenge={wowResult.data ? { title: wowResult.data.title } : undefined}
          courseProgress={firstModuleWithCourses ? {
            completed: totalCoursesCompleted,
            total: allCourses.length,
            firstModuleHref: `/${firstModuleWithCourses.slug}/courses`,
          } : undefined}
        />

        {/* Module Cards */}
        <section>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Your Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {ALL_MODULES.map(mod => {
              let planSummary: string | undefined
              if (mod.slug === 'fitness') {
                const parts: string[] = []
                if (runPlan) parts.push(`Run (Wk ${getCurrentWeek(runPlan.started_at, runPlan.weeks_total)}/${runPlan.weeks_total})`)
                if (strengthPlan) parts.push(`Strength (Wk ${getCurrentWeek(strengthPlan.started_at, strengthPlan.weeks_total)}/${strengthPlan.weeks_total})`)
                if (mealPlan) parts.push(`Meal (Wk ${getCurrentWeek(mealPlan.started_at, mealPlan.weeks_total)}/${mealPlan.weeks_total})`)
                if (parts.length) planSummary = parts.join(' · ')
              } else if (mod.slug === 'hunting') {
                const tripCount = (tripsResult.data ?? []).length
                if (tripCount > 0) planSummary = `${tripCount} upcoming trip${tripCount !== 1 ? 's' : ''}`
              }
              return (
                <ModuleCard
                  key={mod.slug}
                  slug={mod.slug}
                  name={mod.name}
                  description={mod.description}
                  icon={mod.icon}
                  subscription={subscriptions[mod.slug] ?? null}
                  quickLinks={MODULE_QUICK_LINKS[mod.slug]}
                  planSummary={planSummary}
                />
              )
            })}
          </div>
        </section>

        {/* Upcoming Hunts & Trips */}
        {hasHunting && (
          <section>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Upcoming Hunts & Trips</h2>
            <UpcomingTrips trips={(tripsResult.data ?? []) as Array<{ id: string; title: string; state: string; species: string; unit: string | null; status: 'planning' | 'applied' | 'booked'; trip_start_date: string | null; trip_end_date: string | null; trip_days: number | null }>} />
          </section>
        )}

        {/* Fitness Progress */}
        {hasFitness && (runPlan || strengthPlan || (baselineResult.data && baselineResult.data.length >= 2)) && (
          <section>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Fitness Progress</h2>
            <FitnessDashboard
              baselineTests={baselineResult.data ?? []}
              runChart={runChart}
              strengthChart={strengthChart}
              hasMealPlan={!!mealPlan}
              totalWorkoutsLogged={workoutCountResult.count ?? 0}
            />
          </section>
        )}

        {/* Course Progress */}
        {courseProgressModules.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Course Progress</h2>
            <CourseProgressRow modules={courseProgressModules} />
          </section>
        )}

        {/* Top Posts */}
        {topPosts.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Your Top Posts</h2>
            <TopPosts posts={topPosts} />
          </section>
        )}

        {/* AI Usage */}
        <section>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">AI Usage</h2>
          <AiUsageCard
            moduleUsage={subscribedSlugs.map(slug => {
              const sub = subscriptions[slug]!
              return {
                slug,
                name: ALL_MODULES.find(m => m.slug === slug)!.name,
                tier: sub.tier,
                used: sub.aiQueriesThisMonth,
                quota: MODULE_AI_QUOTA[sub.tier],
              }
            })}
          />
        </section>
      </div>

      {/* ── Sidebar ── */}
      <div className="space-y-4">
        {(weekDays.some(d => d.items.length > 0) || flexItems.length > 0) && (
          <WeeklyPreview days={weekDays} flexItems={flexItems} />
        )}
        <SidebarFeed posts={sidebarPosts} />
      </div>
    </div>
  )
}
