'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { LeaderboardRow, type LeaderboardRowData } from './leaderboard-row'

type Submission = {
  id: string
  workout_id: string
  user_id: string
  scaling: 'rx' | 'scaled' | 'beginner'
  score_value: number
  score_display: string
  notes: string | null
  community_post_id: string | null
  rank: number
  display_name: string
  avatar_url: string | null
  date_of_birth: string | null
  fitness_level: string | null
  is_mine: boolean
}

type OverallStanding = {
  user_id: string
  display_name: string
  avatar_url: string | null
  date_of_birth: string | null
  fitness_level: string | null
  total_points: number
  weeks_participated: number
  is_mine: boolean
  rank: number
}

type AgeGroup = 'all' | '18-25' | '26-35' | '36-45' | '46-55' | '56+'
type Tab = 'weekly' | 'overall' | 'age-group'
type TimeRange = '4w' | '12w' | 'all'

const AGE_GROUP_OPTIONS = [
  { value: 'all', label: 'All Ages' },
  { value: '18-25', label: '18–25' },
  { value: '26-35', label: '26–35' },
  { value: '36-45', label: '36–45' },
  { value: '46-55', label: '46–55' },
  { value: '56+', label: '56+' },
]

const FITNESS_LEVEL_OPTIONS = [
  { value: 'all', label: 'All Levels' },
  { value: 'just_starting', label: 'Starting Out' },
  { value: 'moderately_active', label: 'Moderate' },
  { value: 'very_active', label: 'Very Active' },
  { value: 'competitive', label: 'Competitive' },
]

function getAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function matchesAgeGroup(dob: string | null, group: AgeGroup): boolean {
  if (group === 'all') return true
  if (!dob) return false
  const age = getAge(dob)
  switch (group) {
    case '18-25': return age >= 18 && age <= 25
    case '26-35': return age >= 26 && age <= 35
    case '36-45': return age >= 36 && age <= 45
    case '46-55': return age >= 46 && age <= 55
    case '56+': return age >= 56
    default: return true
  }
}

function detectUserAgeGroup(dob: string | null): AgeGroup {
  if (!dob) return 'all'
  const age = getAge(dob)
  if (age >= 56) return '56+'
  if (age >= 46) return '46-55'
  if (age >= 36) return '36-45'
  if (age >= 26) return '26-35'
  if (age >= 18) return '18-25'
  return 'all'
}

interface WowLeaderboardProps {
  workoutId: string | null
}

export function WowLeaderboard({ workoutId }: WowLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('weekly')
  const [scalingFilter, setScalingFilter] = useState<'all' | 'rx' | 'scaled' | 'beginner'>('all')
  const [ageFilter, setAgeFilter] = useState<AgeGroup>('all')
  const [fitnessFilter, setFitnessFilter] = useState('all')

  // Weekly state
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [weeklyLoading, setWeeklyLoading] = useState(true)

  // Overall state
  const [overallStandings, setOverallStandings] = useState<OverallStanding[]>([])
  const [overallLoading, setOverallLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('12w')

  // Fetch weekly submissions
  useEffect(() => {
    if (!workoutId) {
      setWeeklyLoading(false)
      return
    }
    setWeeklyLoading(true)
    fetch(`/api/fitness/wow/submissions?workout_id=${workoutId}`)
      .then(res => res.json())
      .then(data => {
        setSubmissions(data.submissions ?? [])
        setWeeklyLoading(false)
      })
      .catch(() => setWeeklyLoading(false))
  }, [workoutId])

  // Fetch overall standings
  const fetchOverall = useCallback(() => {
    setOverallLoading(true)
    const params = new URLSearchParams({
      range: timeRange,
      scaling: scalingFilter,
      age_group: ageFilter,
      fitness_level: fitnessFilter,
    })
    fetch(`/api/fitness/leaderboard/overall?${params}`)
      .then(res => res.json())
      .then(data => {
        setOverallStandings(data.standings ?? [])
        setOverallLoading(false)
      })
      .catch(() => setOverallLoading(false))
  }, [timeRange, scalingFilter, ageFilter, fitnessFilter])

  useEffect(() => {
    if (activeTab === 'overall' || activeTab === 'age-group') {
      fetchOverall()
    }
  }, [activeTab, fetchOverall])

  // Filter weekly submissions client-side
  const filteredWeekly = submissions.filter(s => {
    if (scalingFilter !== 'all' && s.scaling !== scalingFilter) return false
    if (!matchesAgeGroup(s.date_of_birth, ageFilter)) return false
    if (fitnessFilter !== 'all' && s.fitness_level !== fitnessFilter) return false
    return true
  })
  const rankedWeekly = filteredWeekly.map((s, i) => ({ ...s, rank: i + 1 }))

  // For age group tab: detect user's age group and filter
  const userDob = submissions.find(s => s.is_mine)?.date_of_birth ?? null
  const userAgeGroup = detectUserAgeGroup(userDob)
  const ageGroupLabel = userAgeGroup === 'all' ? 'All Ages' : userAgeGroup

  // Age group view uses overall standings filtered to user's age group
  const ageGroupStandings = overallStandings // already filtered server-side when age_group is set

  const tabs: { key: Tab; label: string }[] = [
    { key: 'weekly', label: 'This Week' },
    { key: 'overall', label: 'Overall' },
    { key: 'age-group', label: 'Age Group' },
  ]

  // When switching to age-group tab, auto-set the age filter
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'age-group' && userAgeGroup !== 'all') {
      setAgeFilter(userAgeGroup)
    } else if (tab !== 'age-group') {
      // Reset age filter when leaving age group tab
      setAgeFilter('all')
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-subtle space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-primary font-semibold text-sm">Leaderboard</h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                activeTab === t.key
                  ? 'bg-accent text-black'
                  : 'bg-elevated text-secondary hover:text-primary'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          {/* Scaling pills */}
          <div className="flex gap-1">
            {(['all', 'rx', 'scaled', 'beginner'] as const).map(f => (
              <button
                key={f}
                onClick={() => setScalingFilter(f)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize',
                  scalingFilter === f
                    ? 'bg-accent text-black'
                    : 'bg-elevated text-secondary hover:text-primary'
                )}
              >
                {f === 'all' ? 'All' : f === 'rx' ? 'RX' : f === 'scaled' ? 'Scaled' : 'Beginner'}
              </button>
            ))}
          </div>

          {/* TacticalSelect filters */}
          <div className="flex flex-wrap gap-2">
            {activeTab !== 'age-group' && (
              <TacticalSelect
                value={ageFilter}
                onChange={(v) => setAgeFilter(v as AgeGroup)}
                options={AGE_GROUP_OPTIONS}
                className="w-28"
              />
            )}
            <TacticalSelect
              value={fitnessFilter}
              onChange={setFitnessFilter}
              options={FITNESS_LEVEL_OPTIONS}
              className="w-32"
            />
          </div>

          {/* Time range sub-pills (overall + age group tabs only) */}
          {(activeTab === 'overall' || activeTab === 'age-group') && (
            <div className="flex gap-1">
              {([
                { value: '4w', label: '4 Weeks' },
                { value: '12w', label: '12 Weeks' },
                { value: 'all', label: 'All Time' },
              ] as const).map(r => (
                <button
                  key={r.value}
                  onClick={() => setTimeRange(r.value)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                    timeRange === r.value
                      ? 'bg-accent/20 text-accent'
                      : 'text-muted hover:text-secondary'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-subtle">
        {activeTab === 'weekly' && (
          <WeeklyView submissions={rankedWeekly} loading={weeklyLoading} />
        )}
        {activeTab === 'overall' && (
          <OverallView standings={overallStandings} loading={overallLoading} />
        )}
        {activeTab === 'age-group' && (
          <AgeGroupView
            standings={ageGroupStandings}
            loading={overallLoading}
            ageGroupLabel={ageGroupLabel}
            userDob={userDob}
          />
        )}
      </div>
    </div>
  )
}

// --- Weekly View ---
function WeeklyView({ submissions, loading }: { submissions: Submission[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="h-4 w-32 bg-elevated rounded animate-pulse mx-auto" />
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="p-8 text-center text-muted text-sm">
        No submissions yet. Be the first!
      </div>
    )
  }

  return (
    <>
      {submissions.map(s => (
        <LeaderboardRow
          key={s.id}
          data={{
            rank: s.rank,
            displayName: s.display_name,
            avatarUrl: s.avatar_url,
            isMine: s.is_mine,
            scaling: s.scaling,
            scoreDisplay: s.score_display,
            communityPostId: s.community_post_id,
          }}
        />
      ))}
    </>
  )
}

// --- Overall View ---
function OverallView({ standings, loading }: { standings: OverallStanding[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="h-4 w-32 bg-elevated rounded animate-pulse mx-auto" />
      </div>
    )
  }

  if (standings.length === 0) {
    return (
      <div className="p-8 text-center text-muted text-sm">
        No points earned yet. Submit a WOW challenge to get started!
      </div>
    )
  }

  return (
    <>
      {standings.map(s => (
        <LeaderboardRow
          key={s.user_id}
          data={{
            rank: s.rank,
            displayName: s.display_name,
            avatarUrl: s.avatar_url,
            isMine: s.is_mine,
            totalPoints: s.total_points,
            weeksParticipated: s.weeks_participated,
          }}
        />
      ))}
    </>
  )
}

// --- Age Group View ---
function AgeGroupView({
  standings,
  loading,
  ageGroupLabel,
  userDob,
}: {
  standings: OverallStanding[]
  loading: boolean
  ageGroupLabel: string
  userDob: string | null
}) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="h-4 w-32 bg-elevated rounded animate-pulse mx-auto" />
      </div>
    )
  }

  const myStanding = standings.find(s => s.is_mine)

  return (
    <>
      {/* Summary card */}
      {myStanding && (
        <div className="px-4 py-3 bg-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary">Your rank in {ageGroupLabel}</p>
              <p className="text-primary font-semibold text-lg">
                #{myStanding.rank} <span className="text-sm text-secondary font-normal">of {standings.length}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary">Total Points</p>
              <div className="flex items-center gap-1 justify-end">
                <span className="text-primary font-mono font-semibold">{myStanding.total_points}</span>
                {myStanding.weeks_participated >= 4 && (
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!userDob && (
        <div className="px-4 py-3 text-xs text-amber-400 bg-amber-500/5">
          Set your date of birth in your profile to see age group rankings.
        </div>
      )}

      {standings.length === 0 ? (
        <div className="p-8 text-center text-muted text-sm">
          No participants in this age group yet.
        </div>
      ) : (
        standings.map(s => (
          <LeaderboardRow
            key={s.user_id}
            data={{
              rank: s.rank,
              displayName: s.display_name,
              avatarUrl: s.avatar_url,
              isMine: s.is_mine,
              totalPoints: s.total_points,
              weeksParticipated: s.weeks_participated,
            }}
          />
        ))
      )}
    </>
  )
}
