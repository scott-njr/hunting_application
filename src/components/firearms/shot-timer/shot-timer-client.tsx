'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Timer, History, CalculatorIcon, Target, SlidersHorizontal, Trophy, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type TimerMode, type CompletedString, type SessionSettings, type CourseScoring, DEFAULT_BAND_THRESHOLDS } from './shot-timer-types'
import { MicConsentModal, hasMicConsent } from './mic-consent-modal'
import { useBeep } from './use-beep'
import { useShotDetection } from './use-shot-detection'
import { useShotTimer } from './use-shot-timer'
import { TimerDisplay } from './timer-display'
import { TimerControls } from './timer-controls'
import { TimerSettingsPanel } from './timer-settings-panel'
import { ShotStringList } from './shot-string-list'
import { SpyModeOverlay } from './spy-mode-overlay'
import { Calculator } from './calculator'
import { SessionHistory } from './session-history'
import { ShotWaveform } from './shot-waveform'
import { CourseOfFirePanel } from './course-of-fire'
import { ScoringModal } from './scoring-modal'
import { CalibrationMode } from './calibration-mode'
import type { Database } from '@/types/database.types'

type ShotSession = Database['public']['Tables']['firearms_shot_session']['Row']

type View = 'timer' | 'history' | 'courses' | 'calibrate' | 'calculator'

/** Match context passed when running timer for a specific match member */
export type MatchTimerContext = {
  matchId: string
  matchName: string
  memberId: string
  shooterName: string
  shootOrder: number
  totalShooters: number
  courseName: string
  courseStrings: number
  courseShotsPerString: number
  courseDelayMode: 'fixed' | 'random' | 'instant'
  courseDelayMinMs: number
  courseDelayMaxMs: number
  courseParTimesMs: number[]
}

interface ShotTimerClientProps {
  userId: string
  userName: string
  initialSessions: ShotSession[]
  matchContext?: MatchTimerContext | null
}

export function ShotTimerClient({ userId, userName, initialSessions, matchContext }: ShotTimerClientProps) {
  const router = useRouter()
  const [view, setView] = useState<View>('timer')
  const [showSettings, setShowSettings] = useState(false)
  const [showMicConsent, setShowMicConsent] = useState(false)
  const [spyFlash, setSpyFlash] = useState(false)
  const [sessions, setSessions] = useState<ShotSession[]>(initialSessions)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeCourse, setActiveCourse] = useState<string | null>(null)
  const sessionStartedRef = useRef(false)

  const [pendingSave, setPendingSave] = useState(false)
  const [showScoring, setShowScoring] = useState(false)
  const [bandEnergies, setBandEnergies] = useState<number[]>([0, 0, 0, 0, 0])
  const [sessionError, setSessionError] = useState<string | null>(null)

  const {
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
  } = useShotTimer()

  const { playStartBeep, playParBeep, warmUp: warmUpBeep, cleanup: cleanupBeep } = useBeep()

  const { isListening, permissionState, micError, requestPermission, cleanup: cleanupMic } =
    useShotDetection({
      sensitivity: state.settings.sensitivity,
      bandThresholds: state.settings.bandThresholds,
      onShotDetected: recordShot,
      onAmplitudeSample: addAmplitudeSample,
      onFrequencyUpdate: setBandEnergies,
      startTimestamp: state.startTimestamp,
      active: state.phase === 'running' && state.settings.mode !== 'stopwatch',
    })

  // Par time monitoring
  const parTimesHitRef = useRef<Set<number>>(new Set())

  const checkParTimes = useCallback(() => {
    if (state.phase !== 'running') return
    for (const parMs of state.settings.parTimesMs) {
      if (state.elapsedMs >= parMs && !parTimesHitRef.current.has(parMs)) {
        parTimesHitRef.current.add(parMs)
        if (state.settings.mode !== 'spy') {
          playParBeep()
        }
      }
    }
  }, [state.phase, state.elapsedMs, state.settings.parTimesMs, state.settings.mode, playParBeep])

  // Check par times on each tick
  if (state.phase === 'running') {
    checkParTimes()
  }

  // Auto-load match course on mount when in match context
  const matchInitRef = useRef(false)
  useEffect(() => {
    if (matchContext && !matchInitRef.current) {
      matchInitRef.current = true
      updateSettings({
        totalStringsInCourse: matchContext.courseStrings,
        shotsPerString: matchContext.courseShotsPerString,
        delayMode: matchContext.courseDelayMode,
        delayMinMs: matchContext.courseDelayMinMs,
        delayMaxMs: matchContext.courseDelayMaxMs,
        parTimesMs: matchContext.courseParTimesMs,
      })
      setActiveCourse(matchContext.courseName)
    }
  }, [matchContext, updateSettings])

  /** Create a new session in the database */
  async function createSession(): Promise<string | null> {
    setSessionError(null)
    try {
      const res = await fetch('/api/firearms/shot-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: state.settings.mode,
          sensitivity: state.settings.sensitivity,
          band_thresholds: state.settings.bandThresholds,
          delay_mode: state.settings.delayMode,
          delay_min_ms: state.settings.delayMinMs,
          delay_max_ms: state.settings.delayMaxMs,
          par_times_ms: state.settings.parTimesMs,
          started_at: new Date().toISOString(),
          ...(matchContext ? { match_id: matchContext.matchId, match_member_id: matchContext.memberId } : {}),
        }),
      })
      if (!res.ok) {
        setSessionError('Failed to create session — check database connection')
        return null
      }
      const data = await res.json()
      setCurrentSessionId(data.session.id)
      return data.session.id
    } catch {
      setSessionError('Network error — could not create session')
      return null
    }
  }

  /** Save a completed string to the database */
  async function saveString(sessionId: string, str: CompletedString) {
    try {
      await fetch(`/api/firearms/shot-timer/${sessionId}/strings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          string_number: str.stringNumber,
          shots_ms: str.shotsMsArray,
          shot_amplitudes: str.shotAmplitudes,
          amplitude_samples: str.amplitudeSamples,
          split_times_ms: str.splitTimesMs,
          total_time_ms: str.totalTimeMs,
          shot_count: str.shotCount,
          points: str.points,
          hit_factor: str.hitFactor,
          par_hit: str.parHit,
        }),
      })
    } catch {
      // Silent fail — data is still in memory
    }
  }

  /** Core start logic — called after consent + permission + session are confirmed */
  function beginTimer() {
    parTimesHitRef.current.clear()

    // Warm up audio context during this user gesture so beep works in setTimeout
    if (state.settings.mode !== 'spy') {
      warmUpBeep()
    }

    const currentMode = state.settings.mode
    start(() => {
      if (currentMode === 'spy') {
        setSpyFlash(true)
        setTimeout(() => setSpyFlash(false), 350)
      } else {
        playStartBeep()
      }
    })
  }

  /** Handle start button */
  async function handleStart() {
    // Check mic consent for timer/spy modes
    if (state.settings.mode !== 'stopwatch') {
      if (!hasMicConsent()) {
        setShowMicConsent(true)
        return
      }
      if (permissionState !== 'granted') {
        const granted = await requestPermission()
        if (!granted) return
      }
    }

    // Create session on first string
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true
      const sessionId = await createSession()
      if (!sessionId) {
        sessionStartedRef.current = false
        return
      }
    }

    beginTimer()
  }

  // Show save/discard prompt when a new string is completed
  const prevStringCountRef = useRef(0)
  useEffect(() => {
    if (state.strings.length > prevStringCountRef.current) {
      prevStringCountRef.current = state.strings.length
      setPendingSave(true)
    }
  }, [state.strings.length])

  /** Save the last completed string to DB */
  async function handleSaveString() {
    if (!currentSessionId || state.strings.length === 0) return
    const lastString = state.strings[state.strings.length - 1]
    await saveString(currentSessionId, lastString)
    setPendingSave(false)
  }

  /** Discard the last completed string */
  function handleDiscardString() {
    discardLastString()
    prevStringCountRef.current = state.strings.length - 1
    setPendingSave(false)
  }

  /** Handle stop */
  function handleStop() {
    stop()
  }

  /** Handle session end / save */
  async function handleEndSession() {
    if (!currentSessionId) return
    setSaving(true)
    try {
      await fetch(`/api/firearms/shot-timer/${currentSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_strings: state.strings.length,
          points: state.points,
          ended_at: new Date().toISOString(),
          ...(matchContext ? { match_id: matchContext.matchId, match_member_id: matchContext.memberId } : {}),
        }),
      })

      // In match mode, navigate back to match detail
      if (matchContext) {
        router.push(`/firearms/matches/${matchContext.matchId}`)
        return
      }

      // Refresh sessions list
      const res = await fetch('/api/firearms/shot-timer')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false)
      setCurrentSessionId(null)
      sessionStartedRef.current = false
      prevStringCountRef.current = 0
      setActiveCourse(null)
      reset()
    }
  }

  /** Handle mic consent accepted — request permission then auto-start */
  async function handleMicConsentAccepted() {
    setShowMicConsent(false)
    const granted = await requestPermission()
    if (!granted) return

    // Create session then start
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true
      const sessionId = await createSession()
      if (!sessionId) {
        sessionStartedRef.current = false
        return
      }
    }

    beginTimer()
  }

  /** Load a course of fire — apply settings and switch to timer */
  function handleLoadCourse(settings: Partial<SessionSettings> & { totalStringsInCourse: number }, courseName?: string) {
    updateSettings(settings)
    setActiveCourse(courseName ?? null)
    setView('timer')
  }

  /** Open scoring modal when course is complete */
  function handleEnterScores() {
    setShowScoring(true)
  }

  /** Handle scoring submission — saves overall course scoring to session */
  async function handleScoringSubmit(scoring: CourseScoring) {
    setShowScoring(false)
    setPoints(scoring.totalPoints)

    if (!currentSessionId) return

    try {
      await fetch(`/api/firearms/shot-timer/${currentSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: scoring.totalPoints,
          course_name: activeCourse ?? null,
          status: scoring.status,
          procedurals: scoring.procedurals,
          additional_penalty: scoring.additionalPenalty,
          hit_factor: scoring.hitFactor,
          shots_per_string: state.settings.shotsPerString,
          alpha: scoring.alpha,
          bravo: scoring.bravo,
          charlie: scoring.charlie,
          delta: scoring.delta,
          miss: scoring.miss,
          ...(matchContext ? { match_id: matchContext.matchId, match_member_id: matchContext.memberId } : {}),
        }),
      })
    } catch {
      // Silent fail — scoring data is visible in-memory
    }
  }

  /** Reset course — clears all strings/scores but keeps the course loaded */
  function handleResetCourse() {
    resetCourse()
    prevStringCountRef.current = 0
    setPendingSave(false)
    setShowScoring(false)
    // Keep activeCourse and session — just reset the string data
  }

  /** Load a saved session for review */
  async function handleLoadSession(sessionId: string) {
    try {
      const res = await fetch(`/api/firearms/shot-timer/${sessionId}`)
      if (!res.ok) return
      const data = await res.json()
      const session = data.session as ShotSession
      const strings: CompletedString[] = (data.strings || []).map((s: Record<string, unknown>) => ({
        stringNumber: s.string_number as number,
        shotsMsArray: s.shots_ms as number[],
        shotAmplitudes: s.shot_amplitudes as number[],
        splitTimesMs: s.split_times_ms as number[],
        totalTimeMs: s.total_time_ms as number,
        shotCount: s.shot_count as number,
        points: s.points as number | null,
        hitFactor: s.hit_factor as number | null,
        parHit: s.par_hit as boolean | null,
        amplitudeSamples: (s.amplitude_samples || []) as { t: number; a: number }[],
      }))

      const settings: SessionSettings = {
        mode: session.mode,
        sensitivity: session.sensitivity,
        bandThresholds: session.band_thresholds ?? [...DEFAULT_BAND_THRESHOLDS],
        delayMode: session.delay_mode,
        delayMinMs: session.delay_min_ms,
        delayMaxMs: session.delay_max_ms,
        parTimesMs: session.par_times_ms,
        shotsPerString: null,
        totalStringsInCourse: null,
      }

      loadSession(strings, settings, session.points)
      setView('timer')
    } catch {
      // Silent fail
    }
  }

  /** Delete a session */
  async function handleDeleteSession(sessionId: string) {
    try {
      await fetch(`/api/firearms/shot-timer/${sessionId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="space-y-4">
      {/* Shooter banner — match mode shows shooter + match info, solo shows logged-in user */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl border',
        matchContext
          ? 'bg-accent/10 border-accent/30'
          : 'bg-surface border-subtle'
      )}>
        {matchContext ? (
          <>
            <button onClick={() => router.push(`/firearms/matches/${matchContext.matchId}`)} className="text-muted hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Trophy className="h-4 w-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-primary text-sm font-bold truncate">Match — {matchContext.shooterName}</p>
              <p className="text-muted text-[10px]">
                {matchContext.matchName} · Shooter {matchContext.shootOrder}/{matchContext.totalShooters}
                {activeCourse && ` · ${activeCourse}`}
              </p>
            </div>
          </>
        ) : (
          <>
            <Timer className="h-4 w-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-primary text-sm font-bold truncate">Solo — {userName}</p>
              <p className="text-muted text-[10px]">
                {activeCourse ? activeCourse : 'Free Session'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-elevated rounded-lg p-1">
        {[
          { key: 'timer' as View, label: 'Timer', icon: Timer },
          { key: 'courses' as View, label: 'Courses', icon: Target },
          { key: 'calibrate' as View, label: 'Calibrate', icon: SlidersHorizontal },
          { key: 'history' as View, label: 'History', icon: History },
          { key: 'calculator' as View, label: 'Calc', icon: CalculatorIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              view === key ? 'bg-accent text-base' : 'text-muted hover:text-secondary'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Timer view */}
      {view === 'timer' && (
        <div className="space-y-4">
          {/* Errors */}
          {(micError || sessionError) && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{micError || sessionError}</p>
            </div>
          )}

          {/* Main display */}
          <TimerDisplay
            elapsedMs={state.elapsedMs}
            shotCount={state.shots.length}
            currentStringNumber={state.currentStringNumber}
            phase={state.phase}
            hitFactor={state.hitFactor}
            isListening={isListening}
            sensitivity={state.settings.sensitivity}
            bandEnergies={bandEnergies}
            bandThresholds={state.settings.bandThresholds}
            courseName={activeCourse}
            totalStrings={state.settings.totalStringsInCourse}
            shotsPerString={state.settings.shotsPerString}
          />

          {/* Live waveform during running */}
          {state.phase === 'running' && state.amplitudeSamples.length > 0 && (
            <ShotWaveform
              amplitudeSamples={state.amplitudeSamples}
              shotTimesMs={state.shots}
              parTimesMs={state.settings.parTimesMs}
              live
            />
          )}

          {/* Controls */}
          <TimerControls
            phase={state.phase}
            mode={state.settings.mode}
            currentStringNumber={state.currentStringNumber}
            totalStringsInCourse={state.settings.totalStringsInCourse}
            onStart={handleStart}
            onStop={handleStop}
            onReset={reset}
            onNextString={nextString}
            onEnterScores={handleEnterScores}
            onModeChange={(mode: TimerMode) => updateSettings({ mode })}
            onToggleSettings={() => setShowSettings(!showSettings)}
          />

          {/* Settings panel */}
          {showSettings && state.phase === 'idle' && (
            <TimerSettingsPanel
              settings={state.settings}
              onUpdate={updateSettings}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Save / Discard prompt */}
          {pendingSave && state.phase === 'stopped' && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveString}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-accent text-base rounded-lg hover:bg-accent/90 transition-colors"
              >
                Save String
              </button>
              <button
                onClick={handleDiscardString}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary border border-subtle rounded-lg hover:bg-elevated transition-colors"
              >
                Discard
              </button>
            </div>
          )}

          {/* String review (shown after at least one string) */}
          {state.strings.length > 0 && (state.phase === 'stopped' || state.phase === 'review' || state.phase === 'idle') && (
            <div>
              <h3 className="text-primary font-bold text-sm mb-3">String Review</h3>
              <ShotStringList
                strings={state.strings}
                reviewIndex={state.reviewIndex}
                parTimesMs={state.settings.parTimesMs}
                onReviewForward={reviewForward}
                onReviewBack={reviewBack}
              />
            </div>
          )}

          {/* Reset Course / End Session buttons */}
          {currentSessionId && state.strings.length > 0 && state.phase !== 'running' && state.phase !== 'waiting_delay' && (
            <div className="space-y-2">
              {activeCourse && (
                <button
                  onClick={handleResetCourse}
                  className="w-full px-4 py-2.5 text-sm font-medium text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/20 transition-colors"
                >
                  Reset Course
                </button>
              )}
              <button
                onClick={handleEndSession}
                disabled={saving}
                className="w-full px-4 py-2.5 text-sm font-medium text-secondary border border-subtle rounded-lg hover:bg-elevated transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving Session...' : 'End & Save Session'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Courses view */}
      {view === 'courses' && (
        <CourseOfFirePanel onLoadCourse={handleLoadCourse} />
      )}

      {/* Calibration view */}
      {view === 'calibrate' && (
        <CalibrationMode
          onApplySettings={(calibrationSettings) => {
            updateSettings({ sensitivity: calibrationSettings.sensitivity, bandThresholds: calibrationSettings.bandThresholds })
            setView('timer')
          }}
        />
      )}

      {/* History view */}
      {view === 'history' && (
        <SessionHistory
          sessions={sessions}
          onLoad={handleLoadSession}
          onDelete={handleDeleteSession}
        />
      )}

      {/* Calculator */}
      <Calculator open={view === 'calculator'} onClose={() => setView('timer')} />

      {/* Spy mode flash */}
      <SpyModeOverlay flash={spyFlash} />

      {/* Scoring modal */}
      <ScoringModal
        open={showScoring}
        strings={state.strings}
        shotsPerString={state.settings.shotsPerString}
        totalStringsInCourse={state.settings.totalStringsInCourse}
        onSubmit={handleScoringSubmit}
        onClose={() => setShowScoring(false)}
      />

      {/* Mic consent modal */}
      <MicConsentModal
        open={showMicConsent}
        onAccept={handleMicConsentAccepted}
        onDecline={() => setShowMicConsent(false)}
      />
    </div>
  )
}
