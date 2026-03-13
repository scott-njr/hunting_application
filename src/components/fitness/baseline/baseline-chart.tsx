'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { CHART_THEME, BASELINE_LINE_COLORS } from '@/lib/chart-theme'
import type { BaselineTest } from './baseline-history'

function formatRunTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function BaselineChart({ tests }: { tests: BaselineTest[] }) {
  if (tests.length < 2) return null

  // Reverse so oldest first for the chart
  const chartData = [...tests].reverse().map((t) => ({
    date: new Date(t.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    runTime: t.run_time_seconds,
    pushups: t.pushups,
    situps: t.situps,
    pullups: t.pullups,
  }))

  return (
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="text-primary font-bold text-lg">Progress</h2>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="date" stroke={CHART_THEME.axisStroke} fontSize={12} />
          <YAxis
            yAxisId="reps"
            stroke={CHART_THEME.axisStroke}
            fontSize={12}
            label={{ value: 'Reps', angle: -90, position: 'insideLeft', fill: CHART_THEME.axisStroke, fontSize: 12 }}
          />
          <YAxis
            yAxisId="time"
            orientation="right"
            stroke={CHART_THEME.axisStroke}
            fontSize={12}
            reversed
            tickFormatter={formatRunTime}
            label={{ value: 'Run Time', angle: 90, position: 'insideRight', fill: CHART_THEME.axisStroke, fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: '8px' }}
            labelStyle={{ color: CHART_THEME.labelColor }}
            formatter={(value, name) => {
              if (name === 'Run Time') return [formatRunTime(value as number), name]
              return [value, name]
            }}
          />
          <Legend wrapperStyle={{ color: CHART_THEME.legendColor, fontSize: '12px' }} />
          <Line yAxisId="reps" type="monotone" dataKey="pushups" name="Pushups" stroke={BASELINE_LINE_COLORS.pushups} strokeWidth={2} dot={{ r: 4 }} />
          <Line yAxisId="reps" type="monotone" dataKey="situps" name="Situps" stroke={BASELINE_LINE_COLORS.situps} strokeWidth={2} dot={{ r: 4 }} />
          <Line yAxisId="reps" type="monotone" dataKey="pullups" name="Pullups" stroke={BASELINE_LINE_COLORS.pullups} strokeWidth={2} dot={{ r: 4 }} />
          <Line yAxisId="time" type="monotone" dataKey="runTime" name="Run Time" stroke={BASELINE_LINE_COLORS.runTime} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
