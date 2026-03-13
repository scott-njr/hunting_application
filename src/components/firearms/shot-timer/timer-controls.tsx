'use client'

import { Play, Square, RotateCcw, SkipForward, Settings, Eye, ClipboardCheck } from 'lucide-react'
import { type TimerPhase, type TimerMode, MAX_STRINGS_PER_SESSION } from './shot-timer-types'
import { cn } from '@/lib/utils'

interface TimerControlsProps {
  phase: TimerPhase
  mode: TimerMode
  currentStringNumber: number
  totalStringsInCourse: number | null
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onNextString: () => void
  onEnterScores?: () => void
  onModeChange: (mode: TimerMode) => void
  onToggleSettings: () => void
}

const MODE_OPTIONS: { value: TimerMode; label: string; icon: typeof Play }[] = [
  { value: 'timer', label: 'Timer', icon: Play },
  { value: 'stopwatch', label: 'Stopwatch', icon: Play },
  { value: 'spy', label: 'Spy', icon: Eye },
]

export function TimerControls({
  phase,
  mode,
  currentStringNumber,
  totalStringsInCourse,
  onStart,
  onStop,
  onReset,
  onNextString,
  onEnterScores,
  onModeChange,
  onToggleSettings,
}: TimerControlsProps) {
  const canStart = phase === 'idle'
  const canStop = phase === 'running' || phase === 'waiting_delay'
  const canReset = phase === 'stopped'
  const courseComplete = totalStringsInCourse !== null && currentStringNumber >= totalStringsInCourse
  const canNextString = phase === 'stopped' && !courseComplete && currentStringNumber < MAX_STRINGS_PER_SESSION

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-1 bg-elevated rounded-lg p-1">
        {MODE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onModeChange(value)}
            disabled={phase !== 'idle'}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              mode === value
                ? 'bg-accent text-base'
                : 'text-muted hover:text-secondary',
              phase !== 'idle' && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main controls */}
      <div className="flex gap-3">
        {canStart && (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-accent/90 text-base font-bold rounded-xl transition-colors text-lg"
          >
            <Play className="h-6 w-6" />
            Start
          </button>
        )}

        {canStop && (
          <button
            onClick={onStop}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-lg"
          >
            <Square className="h-6 w-6" />
            Stop
          </button>
        )}

        {canReset && (
          <>
            <button
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border border-subtle text-secondary hover:text-primary hover:bg-elevated rounded-xl transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              Reset
            </button>
            {canNextString && (
              <button
                onClick={onNextString}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-accent hover:bg-accent/90 text-base font-bold rounded-xl transition-colors"
              >
                <SkipForward className="h-5 w-5" />
                Next String
              </button>
            )}
            {courseComplete && onEnterScores && (
              <button
                onClick={onEnterScores}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-accent hover:bg-accent/90 text-base font-bold rounded-xl transition-colors"
              >
                <ClipboardCheck className="h-5 w-5" />
                Enter Scores
              </button>
            )}
          </>
        )}
      </div>

      {/* Settings toggle */}
      {phase === 'idle' && (
        <button
          onClick={onToggleSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted hover:text-secondary border border-subtle rounded-lg hover:bg-elevated transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      )}
    </div>
  )
}
