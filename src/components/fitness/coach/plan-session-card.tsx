'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { ShareItemButton } from '@/components/fitness/coach/share-item-button'

interface RunSession {
  session_number: number
  type: string
  title: string
  distance_miles?: number
  duration_min?: number
  effort_level?: string
  description: string
}

interface StrengthSession {
  session_number: number
  type: string
  title: string
  duration_min?: number
  description: string
  warmup?: string
  exercises?: Array<{ name: string; sets: number; reps: string; notes?: string }>
  cooldown?: string
}

type Session = RunSession | StrengthSession

interface PlanSessionCardProps {
  session: Session
  planId: string
  weekNumber: number
  isLogged: boolean
}

function isStrengthSession(s: Session): s is StrengthSession {
  return 'exercises' in s
}

export function PlanSessionCard({ session, planId, weekNumber, isLogged }: PlanSessionCardProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [logging, setLogging] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [logged, setLogged] = useState(isLogged)

  async function handleLog() {
    setLogging(true)
    const res = await fetch(`/api/fitness/plans/${planId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_number: weekNumber,
        session_number: session.session_number,
        notes: notes.trim() || null,
      }),
    })

    if (res.ok) {
      setLogged(true)
      setShowNotes(false)
      setNotes('')
      router.refresh()
    }
    setLogging(false)
  }

  const runSession = !isStrengthSession(session) ? session as RunSession : null

  return (
    <div className={`rounded border ${logged ? 'border-green-500/30 bg-green-950/10' : 'border-subtle bg-elevated'} p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {logged ? (
            <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="h-3 w-3 text-green-400" />
            </div>
          ) : (
            <button
              onClick={handleLog}
              disabled={logging}
              className="mt-0.5 h-5 w-5 rounded-full border border-subtle hover:border-accent flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
              title="Mark complete"
            >
              {logging && <span className="h-3 w-3 border border-accent/30 border-t-accent rounded-full animate-spin" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium text-sm ${logged ? 'text-muted line-through' : 'text-primary'}`}>{session.title}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-surface border border-subtle text-muted capitalize">
                {session.type.replace(/_/g, ' ')}
              </span>
            </div>
            {runSession && (
              <div className="flex gap-3 mt-1 text-xs text-muted">
                {runSession.distance_miles && <span>{runSession.distance_miles} mi</span>}
                {runSession.duration_min && <span>{runSession.duration_min} min</span>}
                {runSession.effort_level && <span>{runSession.effort_level}</span>}
              </div>
            )}
            {isStrengthSession(session) && session.duration_min && (
              <div className="mt-1 text-xs text-muted">{session.duration_min} min</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <ShareItemButton
            itemType={isStrengthSession(session) ? 'strength_session' : 'run_session'}
            itemSnapshot={session as unknown as Record<string, unknown>}
            sourcePlanId={planId}
          />
          {!logged && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-muted hover:text-secondary p-1"
              title="Add notes"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted hover:text-secondary p-1"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Notes input (optional, shown on demand) */}
      {showNotes && !logged && (
        <div className="mt-3 pt-3 border-t border-subtle space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full input-field resize-none text-sm"
            rows={2}
            placeholder="How did it go? (optional)"
            autoFocus
          />
          <button
            onClick={handleLog}
            disabled={logging}
            className="btn-primary px-4 py-1.5 text-sm disabled:opacity-40 rounded"
          >
            {logging ? 'Saving...' : 'Complete with Notes'}
          </button>
        </div>
      )}

      {/* Expanded session details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-subtle space-y-3 text-sm">
          <p className="text-secondary">{session.description}</p>

          {isStrengthSession(session) && (
            <>
              {session.warmup && (
                <div>
                  <span className="text-muted text-xs font-medium uppercase">Warmup</span>
                  <p className="text-secondary">{session.warmup}</p>
                </div>
              )}
              {session.exercises && session.exercises.length > 0 && (
                <div className="space-y-1">
                  <span className="text-muted text-xs font-medium uppercase">Exercises</span>
                  {session.exercises.map((ex, i) => (
                    <div key={i} className="flex items-baseline gap-2 text-secondary">
                      <span className="text-primary font-medium">{ex.name}</span>
                      <span className="text-muted">—</span>
                      <span>{ex.sets} × {ex.reps}</span>
                      {ex.notes && <span className="text-muted text-xs">({ex.notes})</span>}
                    </div>
                  ))}
                </div>
              )}
              {session.cooldown && (
                <div>
                  <span className="text-muted text-xs font-medium uppercase">Cooldown</span>
                  <p className="text-secondary">{session.cooldown}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
