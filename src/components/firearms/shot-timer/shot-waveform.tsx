'use client'

import { useMemo } from 'react'
import { type AmplitudeSample } from './shot-timer-types'

interface ShotWaveformProps {
  amplitudeSamples: AmplitudeSample[]
  shotTimesMs: number[]
  parTimesMs?: number[]
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
 * Shot detections marked with vertical accent-colored lines + shot number labels.
 * Par times shown as dashed amber vertical lines.
 */
export function ShotWaveform({
  amplitudeSamples,
  shotTimesMs,
  parTimesMs = [],
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

    // Build SVG path from amplitude samples
    // Normalize: 128 = center (silence), 0/255 = extremes
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

        {/* Shot markers */}
        {shotTimesMs.map((shotMs, i) => {
          const x = xScale(shotMs)
          return (
            <g key={`shot-${i}`}>
              <line
                x1={x} y1={PADDING_Y} x2={x} y2={height - PADDING_Y}
                stroke="#7c9a6e" strokeWidth={2}
                opacity={0.8}
              />
              <circle cx={x} cy={PADDING_Y + 4} r={8} fill="#7c9a6e" opacity={0.9} />
              <text
                x={x} y={PADDING_Y + 8}
                textAnchor="middle"
                fill="#121210"
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
    </div>
  )
}
