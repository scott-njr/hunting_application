'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import {
  type AmplitudeSample,
  type RejectedDetection,
  SENSITIVITY_THRESHOLDS,
  SHOT_DEBOUNCE_MS,
  BEEP_IGNORE_MS,
  AMPLITUDE_SAMPLE_INTERVAL_MS,
  FREQUENCY_BANDS,
  DEFAULT_BAND_THRESHOLDS,
  bandBinRange,
  bandEnergy,
  getRearmThreshold,
} from './shot-timer-types'

type ShotCallback = (timeMs: number, amplitude: number) => void

interface UseShotDetectionOptions {
  sensitivity: number
  /** Per-band energy thresholds (0-255 scale), one per FREQUENCY_BANDS entry */
  bandThresholds: number[]
  onShotDetected: ShotCallback
  onAmplitudeSample?: (sample: AmplitudeSample) => void
  /** Called each frame with current per-band energy values */
  onFrequencyUpdate?: (bandEnergies: number[]) => void
  /** Called when a spike is detected but rejected (for debug visualization) */
  onRejected?: (rejection: RejectedDetection) => void
  startTimestamp: number
  active: boolean
}

/**
 * Hook for shot detection via Web Audio API.
 *
 * Amplitude (time-domain) spike detection with Schmitt trigger hysteresis.
 * First 500ms after timer start = grace period (mutes the start beep).
 * After that, every spike above the sensitivity threshold = shot.
 *
 * No audio is recorded — only amplitude values analyzed in real-time.
 * Stream is stopped immediately when detection stops or component unmounts.
 */
export function useShotDetection({
  sensitivity,
  bandThresholds,
  onShotDetected,
  onAmplitudeSample,
  onFrequencyUpdate,
  onRejected,
  startTimestamp,
  active,
}: UseShotDetectionOptions) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt')
  const [isListening, setIsListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastShotTimeRef = useRef<number>(0)
  const lastSampleTimeRef = useRef<number>(0)
  /** Schmitt trigger gate for amplitude detection */
  const aboveThresholdRef = useRef(false)
  const timeDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  /** Precomputed bin ranges for each frequency band (for display) */
  const binRangesRef = useRef<[number, number][]>([])

  // Refs for values that change frequently — avoids stale closures in RAF loop
  const sensitivityRef = useRef(sensitivity)
  const bandThresholdsRef = useRef(bandThresholds)
  const startTimestampRef = useRef(startTimestamp)
  const onShotDetectedRef = useRef(onShotDetected)
  const onAmplitudeSampleRef = useRef(onAmplitudeSample)
  const onFrequencyUpdateRef = useRef(onFrequencyUpdate)
  const onRejectedRef = useRef(onRejected)

  useEffect(() => { sensitivityRef.current = sensitivity }, [sensitivity])
  useEffect(() => { bandThresholdsRef.current = bandThresholds }, [bandThresholds])
  useEffect(() => { startTimestampRef.current = startTimestamp }, [startTimestamp])
  useEffect(() => { onShotDetectedRef.current = onShotDetected }, [onShotDetected])
  useEffect(() => { onAmplitudeSampleRef.current = onAmplitudeSample }, [onAmplitudeSample])
  useEffect(() => { onFrequencyUpdateRef.current = onFrequencyUpdate }, [onFrequencyUpdate])
  useEffect(() => { onRejectedRef.current = onRejected }, [onRejected])

  /** Request microphone permission and set up audio pipeline */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setMicError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      // Smaller FFT = shorter buffer (~23ms at 44.1kHz) = faster re-arm between rapid shots
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.1
      source.connect(analyser)
      analyserRef.current = analyser

      const bufferLength = analyser.fftSize
      timeDataRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>

      // Precompute frequency bin ranges for display bands
      const sampleRate = audioContext.sampleRate
      binRangesRef.current = FREQUENCY_BANDS.map(band =>
        bandBinRange(band.minHz, band.maxHz, sampleRate, analyser.fftSize)
      )

      setPermissionState('granted')
      return true
    } catch (err) {
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        setPermissionState('denied')
        setMicError('Microphone access was denied. Please enable it in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        setPermissionState('error')
        setMicError('No microphone found. Please connect a microphone and try again.')
      } else {
        setPermissionState('error')
        setMicError(`Microphone error: ${error.message}`)
      }
      return false
    }
  }, [])

  /** Start the detection analysis loop */
  const startListening = useCallback(() => {
    if (!analyserRef.current || !timeDataRef.current || !freqDataRef.current) return

    const analyser = analyserRef.current
    const timeData = timeDataRef.current
    const freqData = freqDataRef.current

    lastShotTimeRef.current = 0
    lastSampleTimeRef.current = 0
    // Start below threshold — the BEEP_IGNORE_MS grace period handles beep residual
    aboveThresholdRef.current = false
    setIsListening(true)

    function analyze() {
      // Get both time-domain (for amplitude detection) and frequency-domain (for beep rejection)
      analyser.getByteTimeDomainData(timeData)
      analyser.getByteFrequencyData(freqData)

      const ts = startTimestampRef.current
      // Don't process until timer has actually started (DELAY_COMPLETE sets timestamp)
      if (ts <= 0) {
        rafRef.current = requestAnimationFrame(analyze)
        return
      }

      const now = performance.now()
      const elapsed = now - ts

      // ── Time-domain: peak amplitude ──
      let peak = 128
      for (let i = 0; i < timeData.length; i++) {
        const val = timeData[i]
        if (val > peak) peak = val
        const mirror = 256 - val
        if (mirror > peak) peak = mirror
      }

      // Amplitude sampling for waveform (every ~50ms — includes grace period for visibility)
      if (elapsed - lastSampleTimeRef.current >= AMPLITUDE_SAMPLE_INTERVAL_MS) {
        lastSampleTimeRef.current = elapsed
        onAmplitudeSampleRef.current?.({
          t: Math.round(elapsed),
          a: peak,
        })
      }

      // ── Per-band energy computation ──
      const thresholds = bandThresholdsRef.current ?? DEFAULT_BAND_THRESHOLDS
      const energies: number[] = []
      let activeBands = 0
      for (let i = 0; i < binRangesRef.current.length; i++) {
        const [s, e] = binRangesRef.current[i]
        const energy = bandEnergy(freqData, s, e)
        energies.push(Math.round(energy))
        if (energy >= thresholds[i]) activeBands++
      }
      onFrequencyUpdateRef.current?.(energies)

      // ── Hybrid detection: amplitude primary + beep rejection ──
      const threshold = SENSITIVITY_THRESHOLDS[sensitivityRef.current] ?? SENSITIVITY_THRESHOLDS[4]
      const rearmLevel = getRearmThreshold(threshold)

      if (peak >= threshold) {
        if (!aboveThresholdRef.current) {
          const roundedElapsed = Math.round(elapsed)

          if (elapsed < BEEP_IGNORE_MS) {
            // Grace period — mute start beep, show as MUTE marker on waveform
            onRejectedRef.current?.({ t: roundedElapsed, amplitude: peak, reason: 'grace_period' })
          } else if (elapsed - lastShotTimeRef.current >= SHOT_DEBOUNCE_MS) {
            // Past grace period + debounce — accept as shot
            lastShotTimeRef.current = elapsed
            onShotDetectedRef.current(roundedElapsed, peak)
          }
        }
        aboveThresholdRef.current = true
      } else if (peak <= rearmLevel) {
        // Re-arm when amplitude drops sufficiently below threshold
        aboveThresholdRef.current = false
      }

      rafRef.current = requestAnimationFrame(analyze)
    }

    rafRef.current = requestAnimationFrame(analyze)
  }, []) // Stable — all changing values accessed via refs

  /** Stop the detection loop */
  const stopListening = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setIsListening(false)
  }, [])

  /** Fully clean up: stop stream tracks + close audio context */
  const cleanup = useCallback(() => {
    stopListening()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    timeDataRef.current = null
    freqDataRef.current = null
  }, [stopListening])

  // Start/stop based on active flag — stable deps so no thrashing
  useEffect(() => {
    if (active && permissionState === 'granted') {
      startListening()
    } else {
      stopListening()
    }
  }, [active, permissionState, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    isListening,
    permissionState,
    micError,
    requestPermission,
    startListening,
    stopListening,
    cleanup,
  }
}
