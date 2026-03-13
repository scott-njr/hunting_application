'use client'

import { type TimerPhase } from './shot-timer-types'
import { BandIndicator } from './band-indicator'

interface TimerDisplayProps {
  elapsedMs: number
  shotCount: number
  currentStringNumber: number
  phase: TimerPhase
  hitFactor: number | null
  isListening: boolean
  sensitivity: number
  bandEnergies: number[]
  bandThresholds: number[]
  courseName?: string | null
  totalStrings?: number | null
  shotsPerString?: number | null
}

/** Format milliseconds to XX.XX display (hundredths of a second) */
function formatTime(ms: number): string {
  const seconds = ms / 1000
  return seconds.toFixed(2)
}

/**
 * Large digital readout showing elapsed time, shot count, and string number.
 * Designed for quick-glance identification during training sessions.
 */
export function TimerDisplay({
  elapsedMs,
  shotCount,
  currentStringNumber,
  phase,
  hitFactor,
  isListening,
  sensitivity,
  bandEnergies,
  bandThresholds,
  courseName,
  totalStrings,
  shotsPerString,
}: TimerDisplayProps) {
  const isRunning = phase === 'running'
  const isWaiting = phase === 'waiting_delay'

  return (
    <div className="bg-elevated border border-subtle rounded-xl p-6 text-center">
      {/* Course of Fire banner */}
      {courseName && (
        <div className="mb-3 pb-3 border-b border-subtle">
          <p className="text-accent text-xs font-medium uppercase tracking-wider">{courseName}</p>
          {totalStrings && shotsPerString && (
            <p className="text-muted text-[10px] mt-0.5">
              {totalStrings} strings × {shotsPerString} shots · String {currentStringNumber} of {totalStrings}
            </p>
          )}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs uppercase tracking-wider">String</span>
          <span className="text-primary font-mono font-bold text-lg">
            {currentStringNumber}{totalStrings ? `/${totalStrings}` : ''}
          </span>
        </div>

        {/* Mic indicator */}
        {isListening && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-medium">MIC</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs uppercase tracking-wider">Shots</span>
            <span className="text-primary font-mono font-bold text-lg">
              {shotCount}{shotsPerString ? `/${shotsPerString}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1" title={`Sensitivity: ${sensitivity}/8`}>
            <span className="text-muted text-xs uppercase tracking-wider">Sen</span>
            <span className="text-accent font-mono font-bold text-lg">{sensitivity}</span>
          </div>
        </div>
      </div>

      {/* Frequency band indicator */}
      {isListening && (
        <div className="mb-3">
          <BandIndicator bandEnergies={bandEnergies} thresholds={bandThresholds} />
        </div>
      )}

      {/* Main time display */}
      <div className="relative">
        {isWaiting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-400 text-2xl font-bold animate-pulse">READY...</span>
          </div>
        )}
        <p
          className={`font-mono font-bold tracking-tight transition-colors ${
            isWaiting ? 'opacity-20' : ''
          } ${isRunning ? 'text-accent' : 'text-primary'}`}
          style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}
        >
          {formatTime(elapsedMs)}
        </p>
      </div>

      {/* Hit Factor */}
      {hitFactor !== null && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-muted text-xs uppercase tracking-wider">HF</span>
          <span className="text-accent font-mono font-bold text-xl">
            {hitFactor.toFixed(4)}
          </span>
        </div>
      )}

      {/* Phase indicator */}
      <div className="mt-3">
        <span className={`text-xs font-medium uppercase tracking-wider ${
          phase === 'idle' ? 'text-muted' :
          phase === 'running' ? 'text-accent' :
          phase === 'waiting_delay' ? 'text-amber-400' :
          phase === 'stopped' ? 'text-secondary' :
          'text-secondary'
        }`}>
          {phase === 'idle' ? 'Ready' :
           phase === 'waiting_delay' ? 'Stand By' :
           phase === 'running' ? 'Active' :
           phase === 'stopped' ? 'Stopped' :
           'Review'}
        </span>
      </div>
    </div>
  )
}
