/* ── Scaling Level Badges (WOW / Leaderboard) ── */
export const SCALING_BADGE = {
  rx:       { label: 'RX',       className: 'bg-green-500/20 text-green-400' },
  scaled:   { label: 'Scaled',   className: 'bg-amber-500/20 text-amber-400' },
  beginner: { label: 'Beginner', className: 'bg-blue-500/20 text-blue-400' },
} as const

export const SCALING_ACTIVE_RING = {
  rx:       'ring-1 ring-green-500/40',
  scaled:   'ring-1 ring-amber-500/40',
  beginner: 'ring-1 ring-blue-500/40',
} as const

export type ScalingLevel = keyof typeof SCALING_BADGE

/* ── Run / Workout Type Colors ── */
export const TYPE_COLORS: Record<string, { border: string; badge: string; bg: string }> = {
  easy_run:     { border: 'border-l-green-500',  badge: 'bg-green-950/30 text-green-300 border-green-500/30',   bg: '' },
  tempo_run:    { border: 'border-l-amber-500',  badge: 'bg-amber-950/30 text-amber-300 border-amber-500/30',   bg: '' },
  intervals:    { border: 'border-l-red-400',    badge: 'bg-red-950/30 text-red-300 border-red-400/30',         bg: '' },
  long_run:     { border: 'border-l-blue-400',   badge: 'bg-blue-950/30 text-blue-300 border-blue-400/30',      bg: '' },
  recovery_run: { border: 'border-l-violet-400', badge: 'bg-violet-950/30 text-violet-300 border-violet-400/30', bg: '' },
  cross_train:  { border: 'border-l-cyan-400',   badge: 'bg-cyan-950/30 text-cyan-300 border-cyan-400/30',      bg: '' },
  strength:     { border: 'border-l-orange-400', badge: 'bg-orange-950/30 text-orange-300 border-orange-400/30', bg: '' },
  meal:         { border: 'border-l-accent',     badge: 'bg-accent/10 text-accent border-accent/30',            bg: '' },
  default:      { border: 'border-l-stone-500',  badge: 'bg-stone-950/30 text-stone-300 border-stone-500/30',   bg: '' },
}

/* ── Fitness Disclaimers ── */
export const EXERCISE_DISCLAIMER =
  'AI-generated plans are general guidance. Consult a physician before starting any new exercise or diet program.'

export const WOW_DISCLAIMER =
  'This workout is AI-generated general guidance. Consult a physician before starting any new exercise program. You assume all risk of injury.'

export const MEAL_DISCLAIMER =
  'AI-generated meal plan is general guidance. Consult a healthcare provider for specific dietary needs.'

export const CHAT_DISCLAIMER =
  'AI guidance only. Consult a physician before changing your exercise program.'
