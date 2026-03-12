'use client'

import { useReducer, useCallback, useRef, useEffect } from 'react'
import {
  type TimerState,
  type TimerAction,
  type SessionSettings,
  type CompletedString,
  type AmplitudeSample,
  MAX_SHOTS_PER_STRING,
  MAX_STRINGS_PER_SESSION,
  MAX_AMPLITUDE_SAMPLES,
  DEFAULT_BAND_THRESHOLDS,
} from './shot-timer-types'

const DEFAULT_SETTINGS: SessionSettings = {
  mode: 'timer',
  sensitivity: 5,
  bandThresholds: [...DEFAULT_BAND_THRESHOLDS],
  delayMode: 'random',
  delayMinMs: 2000,
  delayMaxMs: 5000,
  parTimesMs: [],
  shotsPerString: null,
  totalStringsInCourse: null,
}

const INITIAL_STATE: TimerState = {
  phase: 'idle',
  settings: DEFAULT_SETTINGS,
  currentStringNumber: 1,
  shots: [],
  shotAmplitudes: [],
  splitTimes: [],
  startTimestamp: 0,
  elapsedMs: 0,
  points: 0,
  hitFactor: null,
  strings: [],
  reviewIndex: 0,
  amplitudeSamples: [],
}

function computeHitFactor(points: number, totalTimeMs: number): number | null {
  if (totalTimeMs <= 0 || points <= 0) return null
  return points / (totalTimeMs / 1000)
}

function computeSplitTimes(shots: number[]): number[] {
  if (shots.length < 2) return []
  const splits: number[] = []
  for (let i = 1; i < shots.length; i++) {
    splits.push(shots[i] - shots[i - 1])
  }
  return splits
}

function buildCompletedString(state: TimerState): CompletedString {
  const totalTimeMs = state.shots.length > 0
    ? state.shots[state.shots.length - 1]
    : state.elapsedMs
  const hitFactor = state.points > 0 ? computeHitFactor(state.points, totalTimeMs) : null

  return {
    stringNumber: state.currentStringNumber,
    shotsMsArray: [...state.shots],
    shotAmplitudes: [...state.shotAmplitudes],
    splitTimesMs: computeSplitTimes(state.shots),
    totalTimeMs,
    shotCount: state.shots.length,
    points: state.points || null,
    hitFactor,
    parHit: state.settings.parTimesMs.length > 0
      ? totalTimeMs <= state.settings.parTimesMs[state.settings.parTimesMs.length - 1]
      : null,
    amplitudeSamples: [...state.amplitudeSamples],
  }
}

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        phase: 'waiting_delay',
        shots: [],
        shotAmplitudes: [],
        splitTimes: [],
        elapsedMs: 0,
        hitFactor: null,
        amplitudeSamples: [],
      }

    case 'DELAY_COMPLETE':
      return {
        ...state,
        phase: 'running',
        startTimestamp: action.startTimestamp,
      }

    case 'SHOT_DETECTED': {
      if (state.phase !== 'running') return state
      if (state.shots.length >= MAX_SHOTS_PER_STRING) return state

      const newShots = [...state.shots, action.timeMs]
      const newAmplitudes = [...state.shotAmplitudes, action.amplitude]
      const newSplits = computeSplitTimes(newShots)
      const hitFactor = state.points > 0
        ? computeHitFactor(state.points, action.timeMs)
        : null

      // Auto-stop: if shotsPerString is set and we've reached the count
      const { shotsPerString } = state.settings
      if (shotsPerString && newShots.length >= shotsPerString) {
        const completed = buildCompletedString({
          ...state,
          shots: newShots,
          shotAmplitudes: newAmplitudes,
          hitFactor,
        })
        const newStrings = [...state.strings, completed]
        return {
          ...state,
          phase: 'stopped',
          shots: newShots,
          shotAmplitudes: newAmplitudes,
          splitTimes: newSplits,
          hitFactor,
          strings: newStrings,
          reviewIndex: newStrings.length - 1,
        }
      }

      return {
        ...state,
        shots: newShots,
        shotAmplitudes: newAmplitudes,
        splitTimes: newSplits,
        hitFactor,
      }
    }

    case 'STOP': {
      // Allow stop from waiting_delay (cancel before beep) or running
      if (state.phase === 'waiting_delay') {
        return { ...state, phase: 'idle' }
      }
      if (state.phase !== 'running') return state
      const completed = buildCompletedString(state)
      const stoppedStrings = [...state.strings, completed]
      return {
        ...state,
        phase: 'stopped',
        strings: stoppedStrings,
        reviewIndex: stoppedStrings.length - 1,
      }
    }

    case 'RESET':
      return {
        ...state,
        phase: 'idle',
        shots: [],
        shotAmplitudes: [],
        splitTimes: [],
        elapsedMs: 0,
        hitFactor: null,
        amplitudeSamples: [],
      }

    case 'NEXT_STRING': {
      if (state.currentStringNumber >= MAX_STRINGS_PER_SESSION) return state
      return {
        ...state,
        phase: 'idle',
        currentStringNumber: state.currentStringNumber + 1,
        shots: [],
        shotAmplitudes: [],
        splitTimes: [],
        elapsedMs: 0,
        hitFactor: null,
        amplitudeSamples: [],
      }
    }

    case 'SET_POINTS': {
      const hitFactor = state.shots.length > 0
        ? computeHitFactor(action.points, state.shots[state.shots.length - 1])
        : null
      return {
        ...state,
        points: action.points,
        hitFactor,
      }
    }

    case 'REVIEW_FORWARD': {
      // Preserve current phase during active session (stopped/idle) so controls stay visible
      const fwdPhase = (state.phase === 'stopped' || state.phase === 'idle') ? state.phase : 'review'
      return {
        ...state,
        phase: fwdPhase,
        reviewIndex: Math.min(state.reviewIndex + 1, state.strings.length - 1),
      }
    }

    case 'REVIEW_BACK': {
      const backPhase = (state.phase === 'stopped' || state.phase === 'idle') ? state.phase : 'review'
      return {
        ...state,
        phase: backPhase,
        reviewIndex: Math.max(state.reviewIndex - 1, 0),
      }
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      }

    case 'TICK':
      return {
        ...state,
        elapsedMs: action.elapsedMs,
      }

    case 'ADD_AMPLITUDE_SAMPLE': {
      if (state.amplitudeSamples.length >= MAX_AMPLITUDE_SAMPLES) return state
      return {
        ...state,
        amplitudeSamples: [...state.amplitudeSamples, action.sample],
      }
    }

    case 'DISCARD_LAST_STRING': {
      const remaining = state.strings.slice(0, -1)
      return {
        ...state,
        strings: remaining,
        currentStringNumber: Math.max(state.currentStringNumber - 1, 1),
      }
    }

    case 'RESET_COURSE':
      return {
        ...state,
        phase: 'idle',
        currentStringNumber: 1,
        shots: [],
        shotAmplitudes: [],
        splitTimes: [],
        elapsedMs: 0,
        points: 0,
        hitFactor: null,
        strings: [],
        reviewIndex: 0,
        amplitudeSamples: [],
      }

    case 'LOAD_SESSION':
      return {
        ...state,
        phase: 'review',
        strings: action.strings,
        settings: action.settings,
        points: action.points,
        reviewIndex: 0,
        currentStringNumber: action.strings.length,
      }

    default:
      return state
  }
}

/**
 * Core shot timer state machine hook.
 * Manages timer phases, shot recording, string management, and scoring.
 *
 * Uses performance.now() for sub-millisecond timing precision.
 * Display updates to 1/100th second via requestAnimationFrame.
 */
export function useShotTimer() {
  const [state, dispatch] = useReducer(timerReducer, INITIAL_STATE)
  const rafRef = useRef<number | null>(null)
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Animation frame loop for elapsed time display during running phase
  useEffect(() => {
    if (state.phase === 'running' && state.startTimestamp > 0) {
      function tick() {
        const elapsed = performance.now() - state.startTimestamp
        dispatch({ type: 'TICK', elapsedMs: elapsed })
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }
  }, [state.phase, state.startTimestamp])

  // Cleanup delay timeout on unmount
  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current)
    }
  }, [])

  /** Start the timer with configured delay */
  const start = useCallback((onDelayComplete: () => void) => {
    dispatch({ type: 'START' })

    const { delayMode, delayMinMs, delayMaxMs } = state.settings
    let delayMs: number

    switch (delayMode) {
      case 'instant':
        delayMs = 0
        break
      case 'fixed':
        delayMs = delayMinMs
        break
      case 'random':
        delayMs = delayMinMs + Math.random() * (delayMaxMs - delayMinMs)
        break
    }

    delayTimeoutRef.current = setTimeout(() => {
      const startTs = performance.now()
      dispatch({ type: 'DELAY_COMPLETE', startTimestamp: startTs })
      onDelayComplete()
    }, delayMs)
  }, [state.settings])

  /** Stop the current string */
  const stop = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current)
      delayTimeoutRef.current = null
    }
    dispatch({ type: 'STOP' })
  }, [])

  /** Record a detected shot */
  const recordShot = useCallback((timeMs: number, amplitude: number) => {
    dispatch({ type: 'SHOT_DETECTED', timeMs, amplitude })
  }, [])

  /** Add amplitude sample for waveform */
  const addAmplitudeSample = useCallback((sample: AmplitudeSample) => {
    dispatch({ type: 'ADD_AMPLITUDE_SAMPLE', sample })
  }, [])

  /** Reset current string */
  const reset = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current)
      delayTimeoutRef.current = null
    }
    dispatch({ type: 'RESET' })
  }, [])

  /** Advance to next string */
  const nextString = useCallback(() => dispatch({ type: 'NEXT_STRING' }), [])

  /** Update scoring points */
  const setPoints = useCallback((points: number) => dispatch({ type: 'SET_POINTS', points }), [])

  /** Review navigation */
  const reviewForward = useCallback(() => dispatch({ type: 'REVIEW_FORWARD' }), [])
  const reviewBack = useCallback(() => dispatch({ type: 'REVIEW_BACK' }), [])

  /** Update settings */
  const updateSettings = useCallback((settings: Partial<SessionSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings })
  }, [])

  /** Discard the last completed string */
  const discardLastString = useCallback(() => dispatch({ type: 'DISCARD_LAST_STRING' }), [])

  /** Reset the current course — clears all strings, scores, and resets to string 1 */
  const resetCourse = useCallback(() => dispatch({ type: 'RESET_COURSE' }), [])

  /** Load a saved session for review */
  const loadSession = useCallback((strings: CompletedString[], settings: SessionSettings, points: number) => {
    dispatch({ type: 'LOAD_SESSION', strings, settings, points })
  }, [])

  return {
    state,
    start,
    stop,
    reset,
    nextString,
    discardLastString,
    resetCourse,
    recordShot,
    addAmplitudeSample,
    setPoints,
    reviewForward,
    reviewBack,
    updateSettings,
    loadSession,
  }
}
