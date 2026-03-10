'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp } from 'lucide-react'

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
          <XAxis dataKey="week" stroke="#8a8577" fontSize={12} />
          <YAxis stroke="#8a8577" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a17', border: '1px solid #2a2a25', borderRadius: '8px' }}
            labelStyle={{ color: '#f0ece4' }}
            formatter={(value, name) => [value, name === 'completed' ? 'Completed' : 'Expected']}
          />
          <Bar dataKey="expected" fill="#2a2a25" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.completed >= entry.expected ? '#7c9a6e' : '#c4880c'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 text-xs text-muted justify-center">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#2a2a25]" /> Expected</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent" /> Completed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#c4880c]" /> Partial</span>
      </div>
    </div>
  )
}
