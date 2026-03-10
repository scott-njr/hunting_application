'use client'

import { useState, useEffect } from 'react'
import { Trophy, Users, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeaderboardRow } from './leaderboard-row'

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
  gender: 'male' | 'female' | null
  fitness_level: string | null
  is_mine: boolean
}

type AgeGroup = '18-25' | '26-35' | '36-45' | '46-55' | '56+'

const AGE_GROUPS: AgeGroup[] = ['18-25', '26-35', '36-45', '46-55', '56+']

function getAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function getAgeGroup(dob: string | null): AgeGroup | null {
  if (!dob) return null
  const age = getAge(dob)
  if (age >= 56) return '56+'
  if (age >= 46) return '46-55'
  if (age >= 36) return '36-45'
  if (age >= 26) return '26-35'
  if (age >= 18) return '18-25'
  return null
}

interface WowLeaderboardProps {
  workoutId: string | null
}

export function WowLeaderboard({ workoutId }: WowLeaderboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [scalingFilter, setScalingFilter] = useState<'all' | 'rx' | 'scaled' | 'beginner'>('all')

  useEffect(() => {
    if (!workoutId) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/fitness/wow/submissions?workout_id=${workoutId}`)
      .then(res => res.json())
      .then(data => {
        setSubmissions(data.submissions ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [workoutId])

  // Apply scaling filter
  const filtered = submissions.filter(s =>
    scalingFilter === 'all' || s.scaling === scalingFilter
  )

  // Derive all boards from filtered data
  const overall = rank(filtered)
  const men = rank(filtered.filter(s => s.gender === 'male'))
  const women = rank(filtered.filter(s => s.gender === 'female'))

  // Age group boards — only show groups that have participants
  const ageGroupBoards = AGE_GROUPS
    .map(ag => ({
      label: ag,
      entries: rank(filtered.filter(s => getAgeGroup(s.date_of_birth) === ag)),
    }))
    .filter(b => b.entries.length > 0)

  // Stats summary
  const totalParticipants = filtered.length
  const maleCount = filtered.filter(s => s.gender === 'male').length
  const femaleCount = filtered.filter(s => s.gender === 'female').length

  if (loading) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-8 text-center">
        <div className="h-4 w-40 bg-elevated rounded animate-pulse mx-auto" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Scaling filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h3 className="text-primary font-bold text-lg">Weekly Leaderboard</h3>
        </div>
        <div className="flex gap-1">
          {(['all', 'rx', 'scaled', 'beginner'] as const).map(f => (
            <button
              key={f}
              onClick={() => setScalingFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
                scalingFilter === f
                  ? 'bg-accent text-black'
                  : 'bg-elevated text-secondary hover:text-primary'
              )}
            >
              {f === 'all' ? 'All' : f === 'rx' ? 'RX' : f === 'scaled' ? 'Scaled' : 'Beginner'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={totalParticipants} icon={<Users className="h-4 w-4 text-accent" />} />
        <StatCard label="Men" value={maleCount} icon={<span className="text-blue-400 text-sm font-bold">M</span>} />
        <StatCard label="Women" value={femaleCount} icon={<span className="text-pink-400 text-sm font-bold">W</span>} />
      </div>

      {totalParticipants === 0 ? (
        <div className="rounded-lg border border-subtle bg-surface p-8 text-center text-muted text-sm">
          No submissions yet. Be the first!
        </div>
      ) : (
        <>
          {/* Main grid: Overall + Gender boards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <BoardPanel
              title="Overall"
              icon={<Trophy className="h-4 w-4 text-amber-400" />}
              entries={overall}
              accent="border-amber-400/30"
            />
            <BoardPanel
              title="Men"
              icon={<span className="text-blue-400 text-xs font-bold">M</span>}
              entries={men}
              accent="border-blue-400/30"
              emptyText="No male participants yet"
            />
            <BoardPanel
              title="Women"
              icon={<span className="text-pink-400 text-xs font-bold">W</span>}
              entries={women}
              accent="border-pink-400/30"
              emptyText="No female participants yet"
            />
          </div>

          {/* Age group boards */}
          {ageGroupBoards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Medal className="h-4 w-4 text-accent" />
                <h4 className="text-primary font-semibold text-sm">By Age Group</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ageGroupBoards.map(b => (
                  <BoardPanel
                    key={b.label}
                    title={b.label}
                    icon={<span className="text-accent text-xs font-semibold">{b.entries.length}</span>}
                    entries={b.entries}
                    accent="border-accent/20"
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// --- Helpers ---

function rank(subs: Submission[]): Submission[] {
  return subs.map((s, i) => ({ ...s, rank: i + 1 }))
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-subtle bg-surface px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-primary font-mono font-bold text-lg leading-none">{value}</p>
        <p className="text-muted text-xs">{label}</p>
      </div>
    </div>
  )
}

function BoardPanel({
  title,
  icon,
  entries,
  accent,
  emptyText,
  compact,
}: {
  title: string
  icon: React.ReactNode
  entries: Submission[]
  accent: string
  emptyText?: string
  compact?: boolean
}) {
  const maxShow = compact ? 5 : 10
  const shown = entries.slice(0, maxShow)
  const hasMore = entries.length > maxShow

  return (
    <div className={cn('rounded-lg border bg-surface overflow-hidden', accent)}>
      {/* Panel header */}
      <div className="px-4 py-2.5 border-b border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-primary font-semibold text-sm">{title}</span>
        </div>
        <span className="text-muted text-xs">{entries.length} athlete{entries.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Entries */}
      <div className="divide-y divide-subtle">
        {shown.length === 0 ? (
          <div className="px-4 py-6 text-center text-muted text-xs">
            {emptyText ?? 'No participants'}
          </div>
        ) : (
          shown.map(s => (
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
          ))
        )}
      </div>

      {/* Show more indicator */}
      {hasMore && (
        <div className="px-4 py-2 border-t border-subtle text-center">
          <span className="text-muted text-xs">+{entries.length - maxShow} more</span>
        </div>
      )}
    </div>
  )
}
