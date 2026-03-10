import Link from 'next/link'
import {
  MapPin, ClipboardList, Activity, Flame, GraduationCap,
  ChevronRight, Dumbbell, UtensilsCrossed,
} from 'lucide-react'

interface QuickAccessCard {
  icon: React.ElementType
  title: string
  info: string
  href: string
}

interface QuickAccessCardsProps {
  upcomingTrips?: { count: number; nextTitle: string; nextDate: string | null }
  deadlinesThisWeek?: number
  todayFitness?: { runCount: number; strengthCount: number; mealCount: number; isRestDay: boolean }
  weeklyChallenge?: { title: string }
  courseProgress?: { completed: number; total: number; firstModuleHref: string }
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function QuickAccessCards({
  upcomingTrips,
  deadlinesThisWeek,
  todayFitness,
  weeklyChallenge,
  courseProgress,
}: QuickAccessCardsProps) {
  const cards: QuickAccessCard[] = []

  // Planned Hunts
  if (upcomingTrips && upcomingTrips.count > 0) {
    const dateInfo = upcomingTrips.nextDate ? ` · ${formatShortDate(upcomingTrips.nextDate)}` : ''
    cards.push({
      icon: MapPin,
      title: `${upcomingTrips.count} Planned Hunt${upcomingTrips.count !== 1 ? 's' : ''}`,
      info: `${upcomingTrips.nextTitle}${dateInfo}`,
      href: '/hunting/hunts',
    })
  }

  // Draw Deadlines
  if (deadlinesThisWeek && deadlinesThisWeek > 0) {
    cards.push({
      icon: ClipboardList,
      title: `${deadlinesThisWeek} Deadline${deadlinesThisWeek !== 1 ? 's' : ''} This Week`,
      info: 'Draw applications closing soon',
      href: '/hunting/deadlines',
    })
  }

  // Today's Fitness
  if (todayFitness) {
    if (todayFitness.isRestDay) {
      cards.push({
        icon: Activity,
        title: "Today's Fitness",
        info: 'Rest day — no sessions scheduled',
        href: '/fitness/my-plan',
      })
    } else {
      const parts: string[] = []
      if (todayFitness.runCount > 0) parts.push(`${todayFitness.runCount} run`)
      if (todayFitness.strengthCount > 0) parts.push(`${todayFitness.strengthCount} strength`)
      if (todayFitness.mealCount > 0) parts.push(`${todayFitness.mealCount} meal${todayFitness.mealCount !== 1 ? 's' : ''}`)
      const total = todayFitness.runCount + todayFitness.strengthCount + todayFitness.mealCount

      // Pick the most relevant icon
      let FitnessIcon = Activity
      if (todayFitness.strengthCount > 0 && todayFitness.runCount === 0) FitnessIcon = Dumbbell
      if (todayFitness.mealCount > 0 && todayFitness.runCount === 0 && todayFitness.strengthCount === 0) FitnessIcon = UtensilsCrossed

      cards.push({
        icon: FitnessIcon,
        title: `${total} Item${total !== 1 ? 's' : ''} Today`,
        info: parts.join(' · '),
        href: '/fitness/my-plan',
      })
    }
  }

  // Weekly Challenge
  if (weeklyChallenge) {
    cards.push({
      icon: Flame,
      title: 'Weekly Challenge',
      info: weeklyChallenge.title,
      href: '/fitness/weekly-challenge',
    })
  }

  // Course Progress
  if (courseProgress && courseProgress.total > 0) {
    cards.push({
      icon: GraduationCap,
      title: 'Course Progress',
      info: `${courseProgress.completed}/${courseProgress.total} lessons complete`,
      href: courseProgress.firstModuleHref,
    })
  }

  if (cards.length === 0) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.href + card.title}
            href={card.href}
            className="group flex-shrink-0 w-64 sm:w-auto sm:flex-1 sm:min-w-[200px] rounded-lg border border-subtle bg-surface p-4 hover:border-accent/40 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-accent/10 p-2 shrink-0">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-primary text-sm font-semibold truncate">{card.title}</p>
                  <ChevronRight className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors shrink-0" />
                </div>
                <p className="text-muted text-xs mt-0.5 truncate">{card.info}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
