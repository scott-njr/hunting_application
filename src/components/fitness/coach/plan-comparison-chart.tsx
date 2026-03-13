'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CHART_THEME, PLAN_BAR_COLORS } from '@/lib/chart-theme'

interface WeekComparison {
  week_number: number
  theme: string
  total_sessions: number
  source_completed: number
  target_completed: number
}

interface PlanComparisonChartProps {
  weeks: WeekComparison[]
  sourceName: string
  targetName: string
}

export function PlanComparisonChart({ weeks, sourceName, targetName }: PlanComparisonChartProps) {
  const chartData = weeks.map(w => ({
    week: `W${w.week_number}`,
    expected: w.total_sessions,
    [sourceName]: w.source_completed,
    [targetName]: w.target_completed,
  }))

  return (
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="week" stroke={CHART_THEME.axisStroke} fontSize={12} />
          <YAxis stroke={CHART_THEME.axisStroke} fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: '8px' }}
            labelStyle={{ color: CHART_THEME.labelColor }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: CHART_THEME.axisStroke }}
          />
          <Bar dataKey="expected" fill={PLAN_BAR_COLORS.expected} radius={[4, 4, 0, 0]} name="Expected" />
          <Bar dataKey={sourceName} fill={PLAN_BAR_COLORS.completed} radius={[4, 4, 0, 0]} />
          <Bar dataKey={targetName} fill={PLAN_BAR_COLORS.target} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
