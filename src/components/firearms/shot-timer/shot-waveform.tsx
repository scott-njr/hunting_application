'use client'

import { useMemo } from 'react'
import { type AmplitudeSample, type RejectedDetection } from './shot-timer-types'

interface ShotWaveformProps {
  amplitudeSamples: AmplitudeSample[]
  shotTimesMs: number[]
  parTimesMs?: number[]
  /** Rejected detections to show as muted markers on the waveform */
  rejectedDetections?: RejectedDetection[]
  /** Amplitude threshold (0-255) — draws a horizontal line showing detection level */
  amplitudeThreshold?: number
  /** Height in pixels */
  height?: number
  /** Whether to show live (scrolling) mode */
  live?: boolean
}

const WAVEFORM_HEIGHT = 120
const PADDING_X = 40
const PADDING_Y = 8

/**
 * Seismic-style waveform visualization of a shot string.
 *
 * Renders amplitude_samples as a continuous line (like a seismograph/EKG).
 * Baseline sits at ~128 (silence), spikes up/down on loud sounds.
 *
 * Marker types:
 * - SHOT (red solid line + dot at top) — detected and accepted
 * - MUTE (amber dashed line + dot at top) — sound during grace period (start beep)
 * - PAR (amber dashed line) — par time target
 */
export function ShotWaveform({
  amplitudeSamples,
  shotTimesMs,
  parTimesMs = [],
  rejectedDetections = [],
  amplitudeThreshold,
  height = WAVEFORM_HEIGHT,
}: ShotWaveformProps) {
  const { path, viewWidth, timeMax, xScale } = useMemo(() => {
    if (amplitudeSamples.length === 0) {
      return { path: '', viewWidth: 600, timeMax: 0, xScale: (_t: number) => 0 }
    }

    const tMax = amplitudeSamples[amplitudeSamples.length - 1].t
    const contentWidth = Math.max(600, amplitudeSamples.length * 2)
    const drawWidth = contentWidth - PADDING_X * 2
    const drawHeight = height - PADDING_Y * 2

    const xFn = (t: number) => PADDING_X + (t / Math.max(tMax, 1)) * drawWidth

    const points = amplitudeSamples.map(s => {
      const x = xFn(s.t)
      const normalized = (s.a - 128) / 128
      const y = PADDING_Y + drawHeight / 2 - normalized * (drawHeight / 2)
      return `${x},${y}`
    })

    const pathStr = `M ${points.join(' L ')}`

    return { path: pathStr, viewWidth: contentWidth, timeMax: tMax, xScale: xFn }
  }, [amplitudeSamples, height])

  if (amplitudeSamples.length === 0) return null

  const drawHeight = height - PADDING_Y * 2
  const centerY = PADDING_Y + drawHeight / 2

  // Time axis labels (every second)
  const timeLabels: number[] = []
  for (let s = 0; s <= timeMax / 1000; s++) {
    timeLabels.push(s * 1000)
  }

  const visibleRejections = rejectedDetections

  return (
    <div className="bg-elevated border border-subtle rounded-lg p-2 overflow-x-auto">
      <svg
        width={viewWidth}
        height={height + 20}
        viewBox={`0 0 ${viewWidth} ${height + 20}`}
        className="block"
      >
        {/* Background grid lines */}
        <line
          x1={PADDING_X} y1={centerY}
          x2={viewWidth - PADDING_X} y2={centerY}
          stroke="currentColor" className="text-subtle" strokeWidth={0.5}
        />

        {/* Amplitude threshold line */}
        {amplitudeThreshold !== undefined && (() => {
          const normalized = (amplitudeThreshold - 128) / 128
          const thresholdY = PADDING_Y + drawHeight / 2 - normalized * (drawHeight / 2)
          return (
            <>
              <line
                x1={PADDING_X} y1={thresholdY}
                x2={viewWidth - PADDING_X} y2={thresholdY}
                stroke="#c4880c" strokeWidth={1}
                strokeDasharray="4,3"
              />
              <text
                x={PADDING_X - 2} y={thresholdY + 3}
                textAnchor="end"
                fill="#c4880c"
                fontSize={7}
                fontFamily="monospace"
              >
                THR
              </text>
            </>
          )
        })()}

        {/* Time axis labels */}
        {timeLabels.map(t => {
          const x = xScale(t)
          return (
            <g key={t}>
              <line
                x1={x} y1={PADDING_Y} x2={x} y2={height - PADDING_Y}
                stroke="currentColor" className="text-subtle" strokeWidth={0.5}
                strokeDasharray="2,4"
              />
              <text
                x={x} y={height + 14}
                textAnchor="middle"
                className="fill-muted"
                fontSize={9}
                fontFamily="monospace"
              >
                {(t / 1000).toFixed(0)}s
              </text>
            </g>
          )
        })}

        {/* Par time markers */}
        {parTimesMs.map((parMs, i) => {
          const x = xScale(parMs)
          return (
            <g key={`par-${i}`}>
              <line
                x1={x} y1={PADDING_Y} x2={x} y2={height - PADDING_Y}
                stroke="#c4880c" strokeWidth={1.5}
                strokeDasharray="4,3"
              />
              <text
                x={x} y={PADDING_Y - 2}
                textAnchor="middle"
                fill="#c4880c"
                fontSize={8}
                fontFamily="monospace"
              >
                PAR
              </text>
            </g>
          )
        })}

        {/* Waveform line */}
        <path
          d={path}
          fill="none"
          stroke="#7c9a6e"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Muted sounds during grace period — amber dashed line + dot at TOP */}
        {visibleRejections.map((rej, i) => {
          const x = xScale(rej.t)
          return (
            <g key={`rej-${i}`}>
              <line
                x1={x} y1={PADDING_Y + 14} x2={x} y2={height - PADDING_Y}
                stroke="#c4880c" strokeWidth={1.5}
                strokeDasharray="3,3"
                opacity={0.8}
              />
              <circle cx={x} cy={PADDING_Y + 4} r={7} fill="#c4880c" opacity={0.85} />
              <text
                x={x} y={PADDING_Y + 7.5}
                textAnchor="middle"
                fill="#121210"
                fontSize={5.5}
                fontWeight="bold"
                fontFamily="monospace"
              >
                MUTE
              </text>
              <text
                x={x} y={PADDING_Y + 18}
                textAnchor="middle"
                fill="#c4880c"
                fontSize={7}
                fontFamily="monospace"
              >
                {rej.amplitude}
              </text>
            </g>
          )
        })}

        {/* Shot markers — RED solid line + dot at top with shot number */}
        {shotTimesMs.map((shotMs, i) => {
          const x = xScale(shotMs)
          return (
            <g key={`shot-${i}`}>
              <line
                x1={x} y1={PADDING_Y + 14} x2={x} y2={height - PADDING_Y}
                stroke="#ef4444" strokeWidth={2}
                opacity={0.85}
              />
              <circle cx={x} cy={PADDING_Y + 4} r={8} fill="#ef4444" opacity={0.9} />
              <text
                x={x} y={PADDING_Y + 8}
                textAnchor="middle"
                fill="#fff"
                fontSize={9}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {i + 1}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-1.5 px-1 text-[10px] font-mono">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-[#7c9a6e] rounded" />
          <span className="text-[#7c9a6e]">Waveform</span>
        </span>
        {amplitudeThreshold !== undefined && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-[#c4880c] rounded" style={{ borderTop: '1px dashed #c4880c' }} />
            <span className="text-[#c4880c]">Threshold</span>
          </span>
        )}
        {shotTimesMs.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-[#ef4444]">Shot</span>
          </span>
        )}
        {visibleRejections.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#c4880c]" />
            <span className="text-[#c4880c]">Muted (beep)</span>
          </span>
        )}
      </div>
    </div>
  )
}
