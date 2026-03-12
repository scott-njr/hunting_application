'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Play, Square, Volume2, RotateCcw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SENSITIVITY_THRESHOLDS,
  SHOT_DEBOUNCE_MS,
  FREQUENCY_BANDS,
  DEFAULT_BAND_THRESHOLDS,
  bandBinRange,
  bandEnergy,
  getRearmThreshold,
} from './shot-timer-types'
import { BandIndicator } from './band-indicator'
import { hasMicConsent, MicConsentModal } from './mic-consent-modal'

const SENSITIVITY_LABELS: Record<number, string> = {
  1: 'Minimum (loud shots only)',
  2: 'Very Low',
  3: 'Low',
  4: 'Medium (default)',
  5: 'Medium-High',
  6: 'High',
  7: 'Very High',
  8: 'Maximum (finger snap)',
}

const MAX_LOG_ENTRIES = 20
const MAX_WAVEFORM_SAMPLES = 400
const WAVEFORM_SAMPLE_INTERVAL = 50
const PEAK_DECAY_RATE = 2

type DetectionEntry = {
  id: number
  amplitude: number
  activeBands: number
  timestamp: number
}

type WaveformSample = {
  t: number
  a: number
}

// ─── Live Waveform SVG ──────────────────────────────────────────────────────

const WF_HEIGHT = 280
const WF_PADDING_X = 32
const WF_PADDING_Y = 6
const WF_VISIBLE_SECONDS = 10

function CalibrationWaveform({
  samples,
  detections,
  sensitivity,
}: {
  samples: WaveformSample[]
  detections: DetectionEntry[]
  sensitivity: number
}) {
  const width = 360
  const drawHeight = WF_HEIGHT - WF_PADDING_Y * 2
  const drawWidth = width - WF_PADDING_X * 2
  const ampThreshold = SENSITIVITY_THRESHOLDS[sensitivity] ?? SENSITIVITY_THRESHOLDS[4]

  const { path, timeRange, thresholdY } = useMemo(() => {
    if (samples.length < 2) return { path: '', timeRange: [0, WF_VISIBLE_SECONDS * 1000] as [number, number], thresholdY: 0 }

    const latest = samples[samples.length - 1].t
    const tMin = Math.max(0, latest - WF_VISIBLE_SECONDS * 1000)
    const tMax = Math.max(tMin + WF_VISIBLE_SECONDS * 1000, latest)

    function ampToY(a: number): number {
      const normalized = Math.max(0, (a - 128) / 127)
      return WF_PADDING_Y + drawHeight * (1 - normalized)
    }

    function tToX(t: number): number {
      return WF_PADDING_X + ((t - tMin) / (tMax - tMin)) * drawWidth
    }

    const visible = samples.filter(s => s.t >= tMin)
    if (visible.length < 2) return { path: '', timeRange: [tMin, tMax] as [number, number], thresholdY: ampToY(ampThreshold) }

    const points = visible.map(s => `${tToX(s.t).toFixed(1)},${ampToY(s.a).toFixed(1)}`)
    const d = `M${points[0]} ${points.slice(1).map(p => `L${p}`).join(' ')}`

    return {
      path: d,
      timeRange: [tMin, tMax] as [number, number],
      thresholdY: ampToY(ampThreshold),
    }
  }, [samples, ampThreshold, drawHeight, drawWidth])

  const visibleDetections = useMemo(() => {
    const [tMin, tMax] = timeRange
    return detections.filter(d => d.timestamp >= tMin && d.timestamp <= tMax)
  }, [detections, timeRange])

  function tToX(t: number): number {
    const [tMin, tMax] = timeRange
    return WF_PADDING_X + ((t - tMin) / (tMax - tMin)) * drawWidth
  }

  const timeLabels = useMemo(() => {
    const [tMin, tMax] = timeRange
    const labels: { t: number; x: number; label: string }[] = []
    const startSec = Math.ceil(tMin / 1000)
    const endSec = Math.floor(tMax / 1000)
    for (let s = startSec; s <= endSec; s += 2) {
      const ms = s * 1000
      if (ms >= tMin && ms <= tMax) {
        labels.push({
          t: ms,
          x: WF_PADDING_X + ((ms - tMin) / (tMax - tMin)) * drawWidth,
          label: `${s}s`,
        })
      }
    }
    return labels
  }, [timeRange, drawWidth])

  return (
    <div className="bg-elevated border border-subtle rounded-lg overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${WF_HEIGHT}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: WF_HEIGHT }}
      >
        {/* Silence baseline */}
        <line
          x1={WF_PADDING_X} x2={width - WF_PADDING_X}
          y1={WF_PADDING_Y + drawHeight} y2={WF_PADDING_Y + drawHeight}
          stroke="var(--color-border-subtle)" strokeWidth="0.5"
        />

        {/* Amplitude threshold line */}
        <line
          x1={WF_PADDING_X} x2={width - WF_PADDING_X}
          y1={thresholdY} y2={thresholdY}
          stroke="#c4880c" strokeWidth="1" strokeDasharray="4,3"
        />
        <text x={WF_PADDING_X - 2} y={thresholdY + 3} fontSize="8" fill="#c4880c" textAnchor="end">
          AMP
        </text>

        {/* Waveform line */}
        {path && (
          <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
        )}

        {/* Shot detection markers */}
        {visibleDetections.map(d => {
          const x = tToX(d.timestamp)
          return (
            <g key={d.id}>
              <line
                x1={x} x2={x}
                y1={WF_PADDING_Y} y2={WF_PADDING_Y + drawHeight}
                stroke="#ef4444" strokeWidth="1" opacity="0.7"
              />
              <circle cx={x} cy={WF_PADDING_Y + 6} r="3" fill="#ef4444" />
              <text x={x} y={WF_PADDING_Y + 18} fontSize="7" fill="#ef4444" textAnchor="middle">
                {d.activeBands}b
              </text>
            </g>
          )
        })}

        {/* Time labels */}
        {timeLabels.map(({ t, x, label }) => (
          <text key={t} x={x} y={WF_HEIGHT - 2} fontSize="8" fill="var(--color-text-muted)" textAnchor="middle">
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ─── Main Calibration Component ─────────────────────────────────────────────

interface CalibrationModeProps {
  /** Called when user clicks "Use as Timer Configuration" — applies calibration settings to main timer */
  onApplySettings?: (settings: { sensitivity: number; bandThresholds: number[] }) => void
}

export function CalibrationMode({ onApplySettings }: CalibrationModeProps = {}) {
  const [sensitivity, setSensitivity] = useState(4)
  const [bandThresholds, setBandThresholds] = useState<number[]>([...DEFAULT_BAND_THRESHOLDS])
  const [running, setRunning] = useState(false)
  const [displayAmplitude, setDisplayAmplitude] = useState(128)
  const [bandEnergies, setBandEnergies] = useState<number[]>([0, 0, 0, 0, 0])
  const [activeBandCount, setActiveBandCount] = useState(0)
  const [detections, setDetections] = useState<DetectionEntry[]>([])
  const [waveformSamples, setWaveformSamples] = useState<WaveformSample[]>([])
  const [showConsent, setShowConsent] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const timeDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const binRangesRef = useRef<[number, number][]>([])
  const lastShotTimeRef = useRef(0)
  const lastSampleTimeRef = useRef(0)
  const sensitivityRef = useRef(sensitivity)
  const bandThresholdsRef = useRef(bandThresholds)
  const detectionIdRef = useRef(0)
  const startTimeRef = useRef(0)
  const aboveThresholdRef = useRef(false)
  const heldPeakRef = useRef(128)

  useEffect(() => { sensitivityRef.current = sensitivity }, [sensitivity])
  useEffect(() => { bandThresholdsRef.current = bandThresholds }, [bandThresholds])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setMicError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      if (audioContext.state === 'suspended') await audioContext.resume()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.1
      source.connect(analyser)
      analyserRef.current = analyser

      timeDataRef.current = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>

      // Precompute bin ranges
      const sampleRate = audioContext.sampleRate
      binRangesRef.current = FREQUENCY_BANDS.map(band =>
        bandBinRange(band.minHz, band.maxHz, sampleRate, analyser.fftSize)
      )
      setPermissionGranted(true)
      return true
    } catch (err) {
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        setMicError('Microphone access was denied. Please enable it in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone and try again.')
      } else {
        setMicError(`Microphone error: ${error.message}`)
      }
      return false
    }
  }, [])

  const startCalibration = useCallback(() => {
    if (!analyserRef.current || !timeDataRef.current || !freqDataRef.current) return

    const analyser = analyserRef.current
    const timeData = timeDataRef.current
    const freqData = freqDataRef.current

    lastShotTimeRef.current = 0
    lastSampleTimeRef.current = 0
    aboveThresholdRef.current = false
    heldPeakRef.current = 128
    startTimeRef.current = performance.now()
    setRunning(true)
    setDetections([])
    setWaveformSamples([])

    function analyze() {
      analyser.getByteTimeDomainData(timeData)
      analyser.getByteFrequencyData(freqData)

      const perBandThresholds = bandThresholdsRef.current
      const now = performance.now()
      const elapsed = now - startTimeRef.current

      // ── Time-domain: peak amplitude for waveform/meter ──
      let peak = 128
      for (let i = 0; i < timeData.length; i++) {
        const val = timeData[i]
        if (val > peak) peak = val
        const mirror = 256 - val
        if (mirror > peak) peak = mirror
      }

      // Peak-hold with decay for meter
      if (peak > heldPeakRef.current) {
        heldPeakRef.current = peak
      } else {
        heldPeakRef.current = Math.max(128, heldPeakRef.current - PEAK_DECAY_RATE)
      }
      setDisplayAmplitude(heldPeakRef.current)

      // Waveform sampling
      if (elapsed - lastSampleTimeRef.current >= WAVEFORM_SAMPLE_INTERVAL) {
        lastSampleTimeRef.current = elapsed
        setWaveformSamples(prev => {
          const next = [...prev, { t: Math.round(elapsed), a: peak }]
          return next.length > MAX_WAVEFORM_SAMPLES ? next.slice(-MAX_WAVEFORM_SAMPLES) : next
        })
      }

      // ── Frequency-domain: band display + beep rejection ──
      const energies: number[] = []
      let active = 0
      for (let bi = 0; bi < binRangesRef.current.length; bi++) {
        const [startBin, endBin] = binRangesRef.current[bi]
        const e = bandEnergy(freqData, startBin, endBin)
        energies.push(Math.round(e))
        if (e >= perBandThresholds[bi]) active++
      }
      setBandEnergies(energies)
      setActiveBandCount(active)

      // ── Amplitude detection with Schmitt trigger ──
      const ampThreshold = SENSITIVITY_THRESHOLDS[sensitivityRef.current] ?? SENSITIVITY_THRESHOLDS[4]
      const rearmLevel = getRearmThreshold(ampThreshold)

      if (peak >= ampThreshold) {
        if (!aboveThresholdRef.current && elapsed - lastShotTimeRef.current >= SHOT_DEBOUNCE_MS) {
          lastShotTimeRef.current = elapsed
          const id = ++detectionIdRef.current
          setDetections(prev => [{ id, amplitude: peak, activeBands: active, timestamp: elapsed }, ...prev].slice(0, MAX_LOG_ENTRIES))
        }
        aboveThresholdRef.current = true
      } else if (peak <= rearmLevel) {
        aboveThresholdRef.current = false
      }

      rafRef.current = requestAnimationFrame(analyze)
    }

    rafRef.current = requestAnimationFrame(analyze)
  }, [])

  const stopCalibration = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setRunning(false)
    setDisplayAmplitude(128)
    setBandEnergies([0, 0, 0, 0, 0])
    setActiveBandCount(0)
    heldPeakRef.current = 128
  }, [])

  function handleReset() {
    stopCalibration()
    setDetections([])
    setWaveformSamples([])
    detectionIdRef.current = 0
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  async function handleStart() {
    if (!hasMicConsent()) {
      setShowConsent(true)
      return
    }
    if (!permissionGranted) {
      const granted = await requestPermission()
      if (!granted) return
    }
    startCalibration()
  }

  async function handleConsentAccepted() {
    setShowConsent(false)
    const granted = await requestPermission()
    if (!granted) return
    startCalibration()
  }

  const ampThreshold = SENSITIVITY_THRESHOLDS[sensitivity] ?? SENSITIVITY_THRESHOLDS[4]
  const amplitudePercent = Math.min(100, Math.max(0, ((displayAmplitude - 128) / 127) * 100))
  const thresholdPercent = Math.min(100, Math.max(0, ((ampThreshold - 128) / 127) * 100))
  const isAboveThreshold = running && displayAmplitude >= ampThreshold

  return (
    <>
      <div className="bg-surface border border-subtle rounded-xl p-4 space-y-5">
        <div>
          <h3 className="text-primary font-bold text-sm">Calibration Mode</h3>
          <p className="text-muted text-xs mt-1">
            Amplitude-based detection.
            Adjust sensitivity until nearby bay shots don&apos;t trigger.
          </p>
        </div>

        {micError && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{micError}</p>
          </div>
        )}

        {/* Live waveform */}
        {(running || waveformSamples.length > 0) && (
          <CalibrationWaveform
            samples={waveformSamples}
            detections={detections}
            sensitivity={sensitivity}
          />
        )}

        {/* Band activity indicator */}
        {running && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-secondary text-xs font-medium">Frequency Bands</span>
              <span className={cn(
                'text-xs font-mono font-bold',
                isAboveThreshold ? 'text-red-400' : 'text-muted'
              )}>
                {activeBandCount}/{FREQUENCY_BANDS.length} active
                {isAboveThreshold && ' — SHOT'}
              </span>
            </div>
            <BandIndicator
              bandEnergies={bandEnergies}
              thresholds={bandThresholds}
            />
          </div>
        )}

        {/* Live amplitude meter */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-secondary text-xs font-medium">Amplitude</span>
            <span className={cn(
              'text-xs font-mono font-bold',
              isAboveThreshold ? 'text-red-400' : 'text-muted'
            )}>
              {running ? displayAmplitude : '—'}
            </span>
          </div>
          <div className="relative h-6 bg-elevated rounded-lg overflow-hidden border border-subtle">
            <div
              className={cn('absolute inset-y-0 left-0 rounded-lg', isAboveThreshold ? 'bg-red-500' : 'bg-accent')}
              style={{ width: `${running ? amplitudePercent : 0}%` }}
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-amber-400 z-10"
              style={{ left: `${thresholdPercent}%` }}
            />
          </div>
        </div>

        {/* Amplitude sensitivity slider */}
        <div>
          <label className="text-secondary text-xs font-medium block mb-2">
            Amplitude Sensitivity: {sensitivity} — {SENSITIVITY_LABELS[sensitivity]}
          </label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={sensitivity}
            onChange={e => setSensitivity(parseInt(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-muted text-[10px] mt-1">
            <span>1 (Loud only)</span>
            <span>Threshold: {SENSITIVITY_THRESHOLDS[sensitivity]}</span>
            <span>8 (Sensitive)</span>
          </div>
        </div>

        {/* Per-band threshold sliders */}
        <div>
          <label className="text-secondary text-xs font-medium block mb-2">Band Thresholds</label>
          <div className="space-y-2.5 bg-elevated rounded-lg p-3 border border-subtle">
            {FREQUENCY_BANDS.map((band, i) => {
              const threshold = bandThresholds[i] ?? DEFAULT_BAND_THRESHOLDS[i]
              return (
                <div key={band.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-muted text-[10px] uppercase tracking-wider">{band.name}</span>
                    <span className="text-muted text-[10px] font-mono">{band.minHz}–{band.maxHz}Hz · {threshold}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    step={5}
                    value={threshold}
                    onChange={e => {
                      const updated = [...bandThresholds]
                      updated[i] = parseInt(e.target.value)
                      setBandThresholds(updated)
                    }}
                    className="w-full accent-accent h-1.5"
                  />
                </div>
              )
            })}
            <button
              onClick={() => setBandThresholds([...DEFAULT_BAND_THRESHOLDS])}
              className="flex items-center gap-1.5 text-muted text-[10px] hover:text-secondary transition-colors mt-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Start / Stop / Reset */}
        <div className="flex gap-3">
          {!running ? (
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent/90 text-base font-bold rounded-xl transition-colors"
            >
              <Play className="h-5 w-5" />
              Start Calibration
            </button>
          ) : (
            <button
              onClick={stopCalibration}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              <Square className="h-5 w-5" />
              Stop
            </button>
          )}
          {(detections.length > 0 || running) && (
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3.5 border border-subtle text-secondary hover:text-primary hover:bg-elevated rounded-xl transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              Reset
            </button>
          )}
        </div>

        {/* Apply to Timer button */}
        {onApplySettings && (
          <button
            onClick={() => onApplySettings({ sensitivity, bandThresholds })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors"
          >
            <Check className="h-5 w-5" />
            Use as Timer Configuration
          </button>
        )}

        {/* Detection log */}
        {detections.length > 0 && (
          <div>
            <span className="text-secondary text-xs font-medium block mb-2">
              Detections ({detections.length})
            </span>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {detections.map(d => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-elevated border border-subtle rounded-md"
                >
                  <Volume2 className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span className="text-primary text-xs font-mono flex-1">
                    {(d.timestamp / 1000).toFixed(2)}s
                  </span>
                  <span className="text-muted text-xs font-mono">
                    {d.activeBands}b · amp:{d.amplitude}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MicConsentModal
        open={showConsent}
        onAccept={handleConsentAccepted}
        onDecline={() => setShowConsent(false)}
      />
    </>
  )
}
