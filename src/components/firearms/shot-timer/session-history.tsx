'use client'

import { Clock, Trash2, ChevronRight } from 'lucide-react'
import { ExportButton } from './export-button'
import type { Database } from '@/types/database.types'

type ShotSession = Database['public']['Tables']['firearms_shot_session']['Row']

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

  return (
    <div className="space-y-2">
      <h3 className="text-primary font-bold text-sm mb-3">Session History</h3>
      {sessions.map(session => (
        <div
          key={session.id}
          className="bg-elevated border border-subtle rounded-lg p-4 hover:border-default transition-colors"
        >
          <div className="flex items-start justify-between">
            <button
              onClick={() => onLoad(session.id)}
              className="flex-1 text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-primary font-medium text-sm group-hover:text-accent transition-colors">
                  {session.name || formatDate(session.created_on)}
                </p>
                <ChevronRight className="h-3 w-3 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="flex items-center gap-3 text-muted text-xs">
                <span>{formatMode(session.mode)} mode</span>
                <span>·</span>
                <span>{session.total_strings} string{session.total_strings !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>Sensitivity {session.sensitivity}</span>
                {session.points > 0 && (
                  <>
                    <span>·</span>
                    <span>{session.points} pts</span>
                  </>
                )}
              </div>
              {session.name && (
                <p className="text-muted text-xs mt-1">{formatDate(session.created_on)}</p>
              )}
            </button>

            <div className="flex items-center gap-1 ml-2">
              <ExportButton sessionId={session.id} />
              <button
                onClick={() => onDelete(session.id)}
                className="p-1.5 text-muted hover:text-red-400 transition-colors"
                title="Delete session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
