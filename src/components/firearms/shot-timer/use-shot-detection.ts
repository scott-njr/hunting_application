'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import {
  type AmplitudeSample,
  SENSITIVITY_THRESHOLDS,
  SHOT_DEBOUNCE_MS,
  BEEP_IGNORE_MS,
  AMPLITUDE_SAMPLE_INTERVAL_MS,
  FREQUENCY_BANDS,
  BEEP_REJECT_MIN_HZ,
  BEEP_REJECT_MAX_HZ,
  MIN_ACTIVE_BANDS,
  DEFAULT_BAND_THRESHOLDS,
  bandBinRange,
  bandEnergy,
  isBeepLike,
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
  startTimestamp: number
  active: boolean
}

/**
 * Hook for shot detection via Web Audio API — hybrid approach:
 *
 * 1. AMPLITUDE (time-domain) = primary detector — catches all transient spikes
 *    regardless of mic frequency response. Works on any consumer device.
 *
 * 2. FREQUENCY analysis = beep rejection filter — when an amplitude spike is
 *    detected, checks if energy is concentrated at the beep frequency (1000Hz).
 *    If so, rejects it as a beep, not a shot.
 *
 * Uses Schmitt trigger hysteresis on amplitude to prevent double-triggers.
 * No audio is recorded — only amplitude values analyzed in real-time.
 * Stream is stopped immediately when detection stops or component unmounts.
 */
export function useShotDetection({
  sensitivity,
  bandThresholds,
  onShotDetected,
  onAmplitudeSample,
  onFrequencyUpdate,
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
  /** Precomputed bin range for beep rejection frequency check */
  const beepBinsRef = useRef<[number, number]>([0, 0])
  /** Full frequency range bins for total energy comparison */
  const allBinsRef = useRef<[number, number]>([0, 0])

  // Refs for values that change frequently — avoids stale closures in RAF loop
  const sensitivityRef = useRef(sensitivity)
  const bandThresholdsRef = useRef(bandThresholds)
  const startTimestampRef = useRef(startTimestamp)
  const onShotDetectedRef = useRef(onShotDetected)
  const onAmplitudeSampleRef = useRef(onAmplitudeSample)
  const onFrequencyUpdateRef = useRef(onFrequencyUpdate)

  useEffect(() => { sensitivityRef.current = sensitivity }, [sensitivity])
  useEffect(() => { bandThresholdsRef.current = bandThresholds }, [bandThresholds])
  useEffect(() => { startTimestampRef.current = startTimestamp }, [startTimestamp])
  useEffect(() => { onShotDetectedRef.current = onShotDetected }, [onShotDetected])
  useEffect(() => { onAmplitudeSampleRef.current = onAmplitudeSample }, [onAmplitudeSample])
  useEffect(() => { onFrequencyUpdateRef.current = onFrequencyUpdate }, [onFrequencyUpdate])

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
      analyser.fftSize = 2048
      // Lower smoothing for faster transient response on consumer mics
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

      // Precompute beep rejection bin range (800-1200Hz)
      beepBinsRef.current = bandBinRange(BEEP_REJECT_MIN_HZ, BEEP_REJECT_MAX_HZ, sampleRate, analyser.fftSize)
      // Full audible range for total energy comparison (100Hz - 8000Hz, consumer mic range)
      allBinsRef.current = bandBinRange(100, 8000, sampleRate, analyser.fftSize)

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

      // Amplitude sampling for waveform (every ~50ms, skip beep grace period)
      if (elapsed >= BEEP_IGNORE_MS && elapsed - lastSampleTimeRef.current >= AMPLITUDE_SAMPLE_INTERVAL_MS) {
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

      // ── Hybrid detection: amplitude primary + beep rejection + band gating ──
      if (elapsed >= BEEP_IGNORE_MS) {
        const threshold = SENSITIVITY_THRESHOLDS[sensitivityRef.current] ?? SENSITIVITY_THRESHOLDS[4]
        const rearmLevel = getRearmThreshold(threshold)

        if (peak >= threshold) {
          if (!aboveThresholdRef.current && elapsed - lastShotTimeRef.current >= SHOT_DEBOUNCE_MS) {
            // Amplitude spike detected — check if it's a beep (narrowband at 1000Hz)
            const beepDetected = isBeepLike(freqData, beepBinsRef.current, allBinsRef.current)

            if (!beepDetected) {
              lastShotTimeRef.current = elapsed
              onShotDetectedRef.current(Math.round(elapsed), peak)
            }
          }
          aboveThresholdRef.current = true
        } else if (peak <= rearmLevel) {
          // Re-arm when amplitude drops sufficiently below threshold
          aboveThresholdRef.current = false
        }
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
