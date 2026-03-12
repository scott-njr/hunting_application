'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trophy, Calendar, Users, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type MatchStatus } from '@/components/firearms/shot-timer/shot-timer-types'
import { MatchSetupForm } from './match-setup-form'

type CourseOption = {
  id: string
  name: string
  strings_count: number
  shots_per_string: number
}

type MatchRow = {
  id: string
  name: string
  match_date: string | null
  status: MatchStatus
  created_on: string
  course: { name: string; strings_count: number; shots_per_string: number } | null
}

interface MatchesClientProps {
  userId: string
  initialMatches: MatchRow[]
  courses: CourseOption[]
}

const STATUS_COLORS: Record<MatchStatus, string> = {
  setup: 'text-amber-400 bg-amber-900/20 border-amber-800/50',
  active: 'text-accent bg-accent/10 border-accent/30',
  complete: 'text-secondary bg-elevated border-subtle',
}

export function MatchesClient({ userId, initialMatches, courses }: MatchesClientProps) {
  const router = useRouter()
  const [matches, setMatches] = useState(initialMatches)
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleCreate(name: string, courseId: string, matchDate: string | null) {
    try {
      const res = await fetch('/api/firearms/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, course_of_fire_id: courseId, match_date: matchDate }),
      })
      if (!res.ok) return
      const data = await res.json()
      router.push(`/firearms/matches/${data.match.id}`)
    } catch {
      // Silent fail
    }
  }

  async function handleDelete(matchId: string) {
    if (deleting) return
    setDeleting(matchId)
    try {
      const res = await fetch(`/api/firearms/matches/${matchId}`, { method: 'DELETE' })
      if (res.ok) {
        setMatches(prev => prev.filter(m => m.id !== matchId))
      }
    } catch {
      // Silent fail
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Create match button */}
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-base font-bold rounded-xl transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Match
        </button>
      )}

      {/* Create form */}
      {showCreate && (
        <MatchSetupForm
          courses={courses}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Match list */}
      {matches.length === 0 && !showCreate && (
        <div className="bg-surface border border-subtle rounded-xl p-8 text-center">
          <Trophy className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-secondary text-sm font-medium">No matches yet</p>
          <p className="text-muted text-xs mt-1">Create a match to start tracking USPSA courses with multiple shooters</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.map(match => (
            <div
              key={match.id}
              className="bg-surface border border-subtle rounded-xl p-4 hover:border-accent/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/firearms/matches/${match.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-primary font-bold text-sm truncate">{match.name}</h3>
                    <span className={cn(
                      'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border',
                      STATUS_COLORS[match.status]
                    )}>
                      {match.status}
                    </span>
                  </div>
                  {match.course && (
                    <p className="text-muted text-xs">
                      {match.course.name} · {match.course.strings_count} strings × {match.course.shots_per_string} shots
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {match.match_date && (
                      <span className="flex items-center gap-1 text-muted text-[10px]">
                        <Calendar className="h-3 w-3" />
                        {new Date(match.match_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className="text-muted text-[10px]">
                      Created {new Date(match.created_on).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(match.id) }}
                  disabled={deleting === match.id}
                  className="text-muted hover:text-red-400 transition-colors p-1 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
