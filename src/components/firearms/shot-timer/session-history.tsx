'use client'

import { useState } from 'react'
import { Clock, Trash2, ChevronDown, ChevronRight, Trophy, Target, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExportButton } from './export-button'
import { ShotWaveform } from './shot-waveform'
import type { Database } from '@/types/database.types'

type ShotSession = Database['public']['Tables']['firearms_shot_session']['Row']

type StringDetail = {
  string_number: number
  shots_ms: number[]
  shot_amplitudes: number[]
  split_times_ms: number[]
  total_time_ms: number
  shot_count: number
  amplitude_samples: { t: number; a: number }[]
}

interface SessionHistoryProps {
  sessions: ShotSession[]
  onLoad: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMode(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

export function SessionHistory({ sessions, onLoad, onDelete }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-elevated border border-subtle rounded-lg p-8 text-center">
        <Clock className="h-8 w-8 text-muted mx-auto mb-3" />
        <p className="text-secondary text-sm font-medium mb-1">No Sessions Yet</p>
        <p className="text-muted text-xs">Start your first shot timer session to see history here.</p>
      </div>
    )
  }

  const courseSessions = sessions.filter(s => s.course_name)
  const freeSessions = sessions.filter(s => !s.course_name)

  return (
    <div className="space-y-4">
      {courseSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-primary font-bold text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            Course History
          </h3>
          {courseSessions.map(session => (
            <SessionCard key={session.id} session={session} onLoad={onLoad} onDelete={onDelete} showScoring />
          ))}
        </div>
      )}

      {freeSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-primary font-bold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted" />
            {courseSessions.length > 0 ? 'Free Sessions' : 'Session History'}
          </h3>
          {freeSessions.map(session => (
            <SessionCard key={session.id} session={session} onLoad={onLoad} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionCard({
  session,
  onLoad,
  onDelete,
  showScoring,
}: {
  session: ShotSession
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  showScoring?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [strings, setStrings] = useState<StringDetail[] | null>(null)
  const [loading, setLoading] = useState(false)

  const hasScoring = showScoring && session.status && (session.alpha > 0 || session.bravo > 0 || session.charlie > 0 || session.delta > 0 || session.miss > 0)
  const isMatch = !!session.match_id

  async function toggleExpand() {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (strings !== null) return

    setLoading(true)
    try {
      const res = await fetch(`/api/firearms/shot-timer/${session.id}`)
      if (res.ok) {
        const data = await res.json()
        setStrings(data.strings ?? [])
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      'bg-elevated border rounded-lg transition-colors',
      isMatch ? 'border-accent/30' : 'border-subtle'
    )}>
      {/* Header — clickable to expand */}
      <button
        onClick={toggleExpand}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isMatch && <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />}
              <p className="text-primary font-medium text-sm truncate">
                {session.course_name ?? session.name ?? formatDate(session.created_on)}
              </p>
              {session.status && (
                <span className={cn(
                  'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0',
                  session.status === 'dq' ? 'bg-red-900/30 text-red-400'
                    : session.status === 'dnf' ? 'bg-amber-900/30 text-amber-400'
                    : 'bg-accent/20 text-accent'
                )}>
                  {session.status === 'review' ? 'Complete' : session.status.toUpperCase()}
                </span>
              )}
              {expanded
                ? <ChevronDown className="h-3 w-3 text-muted shrink-0" />
                : <ChevronRight className="h-3 w-3 text-muted shrink-0" />
              }
            </div>

            <div className="flex items-center gap-3 text-muted text-xs">
              <span>{formatMode(session.mode)}</span>
              <span>·</span>
              <span>{session.total_strings} string{session.total_strings !== 1 ? 's' : ''}</span>
              {session.shots_per_string && (
                <>
                  <span>·</span>
                  <span>{session.shots_per_string} shots/str</span>
                </>
              )}
            </div>

            {/* Scoring summary (always visible for course sessions) */}
            {hasScoring && (
              <div className="mt-2 pt-2 border-t border-subtle">
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-accent">A:{session.alpha}</span>
                  <span className="text-blue-400">B:{session.bravo}</span>
                  <span className="text-yellow-400">C:{session.charlie}</span>
                  <span className="text-orange-400">D:{session.delta}</span>
                  <span className="text-red-400">M:{session.miss}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs">
                  <span className="text-primary font-mono font-bold">{session.points} pts</span>
                  {session.hit_factor !== null && (
                    <span className="text-accent font-mono font-bold">HF {session.hit_factor.toFixed(4)}</span>
                  )}
                  {session.procedurals > 0 && (
                    <span className="text-red-400 font-mono">-{session.procedurals * 10} proc</span>
                  )}
                </div>
              </div>
            )}

            <p className="text-muted text-[10px] mt-1">{formatDate(session.created_on)}</p>
          </div>
        </div>
      </button>

      {/* Expanded detail — string breakdown with splits + waveforms */}
      {expanded && (
        <div className="border-t border-subtle px-4 pb-4 pt-3 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 text-muted animate-spin" />
            </div>
          )}

          {strings !== null && strings.length === 0 && !loading && (
            <p className="text-muted text-xs text-center py-2">No string data saved for this session.</p>
          )}

          {strings !== null && strings.length > 0 && (
            <div className="space-y-3">
              {strings.map((str) => (
                <div key={str.string_number} className="bg-surface border border-subtle rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-primary text-xs font-bold">String {str.string_number}</span>
                    <span className="text-primary font-mono text-sm font-bold">
                      {(str.total_time_ms / 1000).toFixed(2)}s
                      <span className="text-muted font-normal text-xs ml-1.5">({str.shot_count} shots)</span>
                    </span>
                  </div>

                  {/* Splits table */}
                  {str.shots_ms.length > 0 && (
                    <div className="overflow-hidden rounded border border-subtle">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-subtle bg-elevated">
                            <th className="px-2 py-1 text-left text-muted font-medium">#</th>
                            <th className="px-2 py-1 text-right text-muted font-medium">Time</th>
                            <th className="px-2 py-1 text-right text-muted font-medium">Split</th>
                            <th className="px-2 py-1 text-right text-muted font-medium">Amp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {str.shots_ms.map((shotMs: number, i: number) => (
                            <tr key={i} className="border-b border-subtle last:border-0">
                              <td className="px-2 py-0.5 text-secondary font-mono">{i + 1}</td>
                              <td className="px-2 py-0.5 text-primary font-mono text-right">{(shotMs / 1000).toFixed(3)}s</td>
                              <td className="px-2 py-0.5 text-accent font-mono text-right">
                                {i > 0 && str.split_times_ms[i - 1] !== undefined
                                  ? (str.split_times_ms[i - 1] / 1000).toFixed(3) + 's'
                                  : '—'}
                              </td>
                              <td className="px-2 py-0.5 text-muted font-mono text-right">
                                {str.shot_amplitudes?.[i] ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Waveform */}
                  {str.amplitude_samples && str.amplitude_samples.length > 0 && (
                    <ShotWaveform
                      amplitudeSamples={str.amplitude_samples}
                      shotTimesMs={str.shots_ms}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onLoad(session.id)}
              className="flex-1 px-3 py-2 text-xs font-medium bg-accent text-base rounded-lg hover:bg-accent/90 transition-colors"
            >
              Load in Timer
            </button>
            <ExportButton sessionId={session.id} />
            <button
              onClick={() => onDelete(session.id)}
              className="p-2 text-muted hover:text-red-400 transition-colors"
              title="Delete session"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
