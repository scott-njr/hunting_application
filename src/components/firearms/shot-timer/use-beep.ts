'use client'

import { useRef, useCallback } from 'react'

/**
 * Hook for generating start and par beeps via Web Audio API.
 * Uses OscillatorNode at 1000Hz for audible alerts.
 *
 * IMPORTANT: Call warmUp() during a user gesture (button click) to ensure
 * the AudioContext is resumed before playback is needed in a setTimeout.
 */
export function useBeep() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }, [])

  /**
   * Warm up the audio context during a user gesture.
   * Must be called from a click/tap handler so the browser allows audio.
   */
  const warmUp = useCallback(async () => {
    const ctx = getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  }, [getContext])

  /**
   * Play a beep tone.
   * Context must already be resumed via warmUp() before calling from non-gesture code.
   */
  const playBeep = useCallback((durationMs = 200, frequency = 1000) => {
    const ctx = getContext()
    // Don't await resume here — it should already be warm
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(1.0, ctx.currentTime)

    // Quick fade-out to avoid click
    const endTime = ctx.currentTime + durationMs / 1000
    gain.gain.setValueAtTime(1.0, endTime - 0.01)
    gain.gain.linearRampToValueAtTime(0, endTime)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(endTime)
  }, [getContext])

  const playStartBeep = useCallback(() => playBeep(200, 1000), [playBeep])
  const playParBeep = useCallback(() => playBeep(100, 1200), [playBeep])

  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  return { playStartBeep, playParBeep, playBeep, warmUp, cleanup }
}
