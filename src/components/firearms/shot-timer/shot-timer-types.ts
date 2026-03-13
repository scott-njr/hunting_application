// ─── Shot Timer Types ────────────────────────────────────────────────────────

export type TimerMode = 'timer' | 'stopwatch' | 'spy'
export type TimerPhase = 'idle' | 'waiting_delay' | 'running' | 'stopped' | 'review'
export type DelayMode = 'fixed' | 'random' | 'instant'

/** A single amplitude sample for waveform rendering */
export type AmplitudeSample = {
  /** Milliseconds from string start */
  t: number
  /** Peak amplitude 0-255 (128 = silence) */
  a: number
}

/** A sound spike detected during the grace period (muted, not counted as a shot) */
export type RejectedDetection = {
  /** Milliseconds from string start */
  t: number
  /** Peak amplitude at rejection */
  amplitude: number
  /** Always grace_period — sound was muted during the start beep window */
  reason: 'grace_period'
}

/** A completed shot string with all recorded data */
export type CompletedString = {
  stringNumber: number
  /** Absolute shot times in ms from string start */
  shotsMsArray: number[]
  /** Peak amplitude at each shot detection (0-255) */
  shotAmplitudes: number[]
  /** Split times between consecutive shots in ms */
  splitTimesMs: number[]
  /** Total string time in ms */
  totalTimeMs: number
  shotCount: number
  /** Points snapshot at time of this string */
  points: number | null
  /** Hit factor = points / (totalTimeMs / 1000) */
  hitFactor: number | null
  /** Did string finish within par time? */
  parHit: boolean | null
  /** Amplitude time-series for waveform visualization */
  amplitudeSamples: AmplitudeSample[]
}

/** Course-level scoring — overall hit zone counts entered after all strings complete */
export type CourseScoring = {
  alpha: number
  bravo: number
  charlie: number
  delta: number
  miss: number
  procedurals: number
  additionalPenalty: number
  status: CourseStatus
  totalPoints: number
  totalTime: number
  hitFactor: number | null
}

export type CourseStatus = 'review' | 'dq' | 'dnf'

// ─── Match System Types ──────────────────────────────────────────────────────

export type MatchStatus = 'setup' | 'active' | 'complete'
export type USPSADivision = 'open' | 'limited' | 'production' | 'carry_optics' | 'single_stack' | 'revolver' | 'pcc' | 'limited_10'
export type PowerFactor = 'major' | 'minor'
export type USPSAClass = 'gm' | 'm' | 'a' | 'b' | 'c' | 'd' | 'u'

export const USPSA_DIVISIONS: { value: USPSADivision; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'limited', label: 'Limited' },
  { value: 'production', label: 'Production' },
  { value: 'carry_optics', label: 'Carry Optics' },
  { value: 'single_stack', label: 'Single Stack' },
  { value: 'revolver', label: 'Revolver' },
  { value: 'pcc', label: 'PCC' },
  { value: 'limited_10', label: 'Limited 10' },
]

export const USPSA_CLASSES: { value: USPSAClass; label: string }[] = [
  { value: 'gm', label: 'Grand Master' },
  { value: 'm', label: 'Master' },
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
  { value: 'd', label: 'D' },
  { value: 'u', label: 'Unclassified' },
]

/** Point values per hit zone */
export const HIT_ZONE_POINTS: Record<string, number> = {
  alpha: 5,
  bravo: 4,
  charlie: 3,
  delta: 1,
  miss: 0,
}

/** Penalty per miss */
export const MISS_PENALTY = 10

/** Penalty per procedural */
export const PROCEDURAL_PENALTY = 10

/** Default per-band energy thresholds (0-255 scale) — one per FREQUENCY_BANDS entry */
export const DEFAULT_BAND_THRESHOLDS: number[] = [100, 100, 100, 100, 100]

/** Session-level settings that persist across strings */
export type SessionSettings = {
  mode: TimerMode
  sensitivity: number
  /** Per-band energy thresholds [bass, low-mid, mid, high-mid, high] (0-255 scale) */
  bandThresholds: number[]
  delayMode: DelayMode
  delayMinMs: number
  delayMaxMs: number
  parTimesMs: number[]
  /** If set, auto-stop string after this many shots are detected */
  shotsPerString: number | null
  /** Total strings in the course of fire (null = unlimited/manual) */
  totalStringsInCourse: number | null
}

/** A saved Course of Fire template — reusable test definition */
export type CourseOfFire = {
  id: string
  userId: string
  name: string
  description: string | null
  stringsCount: number
  shotsPerString: number
  delayMode: DelayMode
  delayMinMs: number
  delayMaxMs: number
  parTimesMs: number[]
  createdOn: string
}

/** Full timer state managed by useReducer */
export type TimerState = {
  phase: TimerPhase
  settings: SessionSettings

  // Current string
  currentStringNumber: number
  shots: number[]
  shotAmplitudes: number[]
  splitTimes: number[]
  startTimestamp: number
  elapsedMs: number

  // Scoring (points carry over between strings)
  points: number
  hitFactor: number | null

  // Completed strings (in-memory, up to 10)
  strings: CompletedString[]

  // Review navigation
  reviewIndex: number

  // Amplitude samples for current string (live waveform)
  amplitudeSamples: AmplitudeSample[]
}

export type TimerAction =
  | { type: 'START' }
  | { type: 'DELAY_COMPLETE'; startTimestamp: number }
  | { type: 'SHOT_DETECTED'; timeMs: number; amplitude: number }
  | { type: 'STOP' }
  | { type: 'RESET' }
  | { type: 'NEXT_STRING' }
  | { type: 'SET_POINTS'; points: number }
  | { type: 'REVIEW_FORWARD' }
  | { type: 'REVIEW_BACK' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<SessionSettings> }
  | { type: 'TICK'; elapsedMs: number }
  | { type: 'ADD_AMPLITUDE_SAMPLE'; sample: AmplitudeSample }
  | { type: 'DISCARD_LAST_STRING' }
  | { type: 'RESET_COURSE' }
  | { type: 'LOAD_SESSION'; strings: CompletedString[]; settings: SessionSettings; points: number }

/** Sensitivity level to amplitude threshold mapping (0-255 scale, 128 = silence) — used for waveform display */
export const SENSITIVITY_THRESHOLDS: Record<number, number> = {
  1: 230,
  2: 210,
  3: 195,
  4: 180,
  5: 165,
  6: 150,
  7: 135,
  8: 132,
}

// ─── Detection: Amplitude-based with Grace Period ───────────────────────────
// Simple amplitude threshold detection. The grace period (BEEP_IGNORE_MS) mutes
// the start beep + reverb. After that, every spike above threshold = shot.

/** Frequency bands for calibration display only */
export const FREQUENCY_BANDS = [
  { name: 'bass',     minHz: 100,  maxHz: 400 },
  { name: 'low-mid',  minHz: 400,  maxHz: 1500 },
  { name: 'mid',      minHz: 1500, maxHz: 4000 },
  { name: 'high-mid', minHz: 4000, maxHz: 8000 },
  { name: 'high',     minHz: 8000, maxHz: 16000 },
] as const

/** Per-band energy threshold by sensitivity level (for calibration display only) */
export const BAND_ENERGY_THRESHOLDS: Record<number, number> = {
  1: 160,
  2: 140,
  3: 120,
  4: 100,
  5: 85,
  6: 70,
  7: 55,
  8: 40,
}

/** Compute bin index range for a frequency band given the sample rate and FFT size */
export function bandBinRange(minHz: number, maxHz: number, sampleRate: number, fftSize: number): [number, number] {
  const binWidth = sampleRate / fftSize
  return [Math.floor(minHz / binWidth), Math.min(Math.ceil(maxHz / binWidth), fftSize / 2 - 1)]
}

/** Compute average energy in a bin range from frequency data array */
export function bandEnergy(freqData: Uint8Array<ArrayBuffer>, startBin: number, endBin: number): number {
  if (startBin >= endBin) return 0
  let sum = 0
  for (let i = startBin; i <= endBin; i++) {
    sum += freqData[i]
  }
  return sum / (endBin - startBin + 1)
}

/** Max shots per string */
export const MAX_SHOTS_PER_STRING = 99

/** Max strings per session */
export const MAX_STRINGS_PER_SESSION = 10

/** Minimum time between shot detections in ms */
export const SHOT_DEBOUNCE_MS = 80

/** Schmitt trigger hysteresis — re-arm when amplitude drops to 20% of the spike
 * height above silence (128). Must be above 128 (silence) so re-arm is achievable.
 * Low factor = faster re-arm = better rapid shot detection. */
export function getRearmThreshold(triggerThreshold: number): number {
  return Math.round(128 + (triggerThreshold - 128) * 0.2)
}

/** Grace period after timer start to ignore the start beep + room reverb (ms).
 * All sounds during this window are muted and shown as MUTE markers on the waveform.
 * 300ms balances beep rejection vs fast first shots (competitive shooters break ~0.4s). */
export const BEEP_IGNORE_MS = 300

/** Amplitude sampling interval in ms */
export const AMPLITUDE_SAMPLE_INTERVAL_MS = 50

/** Max amplitude samples per string (~100 seconds at 50ms intervals) */
export const MAX_AMPLITUDE_SAMPLES = 2000

/** Mic consent localStorage key */
export const MIC_CONSENT_KEY = 'firearms_mic_consent_accepted'

/** Mic consent expiry in ms (30 days) */
export const MIC_CONSENT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000
