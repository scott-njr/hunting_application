'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { CHART_THEME, PLAN_BAR_COLORS } from '@/lib/chart-theme'

interface PlanProgressChartProps {
  weeksTotal: number
  sessionsPerWeek: number[]  // expected sessions per week
  completedPerWeek: number[] // completed sessions per week
}

export function PlanProgressChart({ weeksTotal, sessionsPerWeek, completedPerWeek }: PlanProgressChartProps) {
  const chartData = Array.from({ length: weeksTotal }, (_, i) => ({
    week: `W${i + 1}`,
    expected: sessionsPerWeek[i] ?? 0,
    completed: completedPerWeek[i] ?? 0,
  }))

  const hasAnyData = completedPerWeek.some(c => c > 0)
  if (!hasAnyData) return null

  return (
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="text-primary font-bold text-lg">Training Progress</h2>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="week" stroke={CHART_THEME.axisStroke} fontSize={12} />
          <YAxis stroke={CHART_THEME.axisStroke} fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: '8px' }}
            labelStyle={{ color: CHART_THEME.labelColor }}
            formatter={(value, name) => [value, name === 'completed' ? 'Completed' : 'Expected']}
          />
          <Bar dataKey="expected" fill={PLAN_BAR_COLORS.expected} radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.completed >= entry.expected ? PLAN_BAR_COLORS.completed : PLAN_BAR_COLORS.partial} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 text-xs text-muted justify-center">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#2a2a25]" /> Expected</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent" /> Completed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-urgency" /> Partial</span>
      </div>
    </div>
  )
}
