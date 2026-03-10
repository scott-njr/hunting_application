'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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
          <XAxis dataKey="week" stroke="#8a8577" fontSize={12} />
          <YAxis stroke="#8a8577" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a17', border: '1px solid #2a2a25', borderRadius: '8px' }}
            labelStyle={{ color: '#f0ece4' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#8a8577' }}
          />
          <Bar dataKey="expected" fill="#2a2a25" radius={[4, 4, 0, 0]} name="Expected" />
          <Bar dataKey={sourceName} fill="#7c9a6e" radius={[4, 4, 0, 0]} />
          <Bar dataKey={targetName} fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
