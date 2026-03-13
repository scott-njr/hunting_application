/* ── Shared chart theme for recharts ──
   Recharts props don't accept CSS variables, so we define
   design-system-aligned hex values here as the single source of truth. */

export const CHART_THEME = {
  axisStroke: '#8a8577',
  tooltipBg: '#1a1a17',
  tooltipBorder: '#2a2a25',
  labelColor: '#f0ece4',
  gridStroke: '#2a2a25',
  legendColor: '#c4bfb3',
} as const

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: CHART_THEME.tooltipBg,
    border: `1px solid ${CHART_THEME.tooltipBorder}`,
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
  },
  labelStyle: { color: CHART_THEME.labelColor },
  itemStyle: { color: CHART_THEME.labelColor },
} as const

/* ── Baseline chart line colors ── */
export const BASELINE_LINE_COLORS = {
  pushups: '#7c9a6e',   // accent
  situps: '#c4880c',    // amber/urgency
  pullups: '#6b8cce',   // blue-grey
  runTime: '#ce6b6b',   // muted red
} as const

/* ── Plan progress bar fills ── */
export const PLAN_BAR_COLORS = {
  expected: '#2a2a25',
  completed: '#7c9a6e',  // accent
  partial: '#c4880c',    // amber/urgency
  target: '#60a5fa',     // info
} as const
