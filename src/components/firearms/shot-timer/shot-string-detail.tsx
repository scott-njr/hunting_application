'use client'

import { type CompletedString } from './shot-timer-types'
import { ShotWaveform } from './shot-waveform'

interface ShotStringDetailProps {
  string: CompletedString
  parTimesMs: number[]
}

/** Format milliseconds to seconds display */
function fmtMs(ms: number): string {
  return (ms / 1000).toFixed(2)
}

/**
 * Detailed view of a single completed shot string.
 * Shows shot times, splits, total, hit factor, and waveform visualization.
 */
export function ShotStringDetail({ string: str, parTimesMs }: ShotStringDetailProps) {
  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-elevated border border-subtle rounded-lg p-3 text-center">
          <p className="text-muted text-xs mb-1">Shots</p>
          <p className="text-primary font-mono font-bold text-lg">{str.shotCount}</p>
        </div>
        <div className="bg-elevated border border-subtle rounded-lg p-3 text-center">
          <p className="text-muted text-xs mb-1">Total</p>
          <p className="text-primary font-mono font-bold text-lg">{fmtMs(str.totalTimeMs)}s</p>
        </div>
        <div className="bg-elevated border border-subtle rounded-lg p-3 text-center">
          <p className="text-muted text-xs mb-1">HF</p>
          <p className="text-accent font-mono font-bold text-lg">
            {str.hitFactor !== null ? str.hitFactor.toFixed(2) : '—'}
          </p>
        </div>
        <div className="bg-elevated border border-subtle rounded-lg p-3 text-center">
          <p className="text-muted text-xs mb-1">Par</p>
          <p className={`font-mono font-bold text-lg ${
            str.parHit === null ? 'text-muted' : str.parHit ? 'text-accent' : 'text-red-400'
          }`}>
            {str.parHit === null ? '—' : str.parHit ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      {/* Waveform */}
      {str.amplitudeSamples.length > 0 && (
        <ShotWaveform
          amplitudeSamples={str.amplitudeSamples}
          shotTimesMs={str.shotsMsArray}
          parTimesMs={parTimesMs}
        />
      )}

      {/* Shot table */}
      {str.shotCount > 0 && (
        <div className="bg-elevated border border-subtle rounded-lg overflow-x-auto overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-3 py-2 text-left text-muted text-xs font-medium">#</th>
                <th className="px-3 py-2 text-right text-muted text-xs font-medium">Time</th>
                <th className="px-3 py-2 text-right text-muted text-xs font-medium">Split</th>
                <th className="px-3 py-2 text-right text-muted text-xs font-medium">Amp</th>
              </tr>
            </thead>
            <tbody>
              {str.shotsMsArray.map((shotMs, i) => (
                <tr key={i} className="border-b border-subtle last:border-0">
                  <td className="px-3 py-1.5 text-secondary font-mono">{i + 1}</td>
                  <td className="px-3 py-1.5 text-primary font-mono text-right">{fmtMs(shotMs)}s</td>
                  <td className="px-3 py-1.5 text-accent font-mono text-right">
                    {i > 0 ? fmtMs(str.splitTimesMs[i - 1]) + 's' : '—'}
                  </td>
                  <td className="px-3 py-1.5 text-muted font-mono text-right">
                    {str.shotAmplitudes[i] ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
