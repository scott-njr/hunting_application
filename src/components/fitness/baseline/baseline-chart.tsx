'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
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
          <XAxis dataKey="date" stroke="#8a8577" fontSize={12} />
          <YAxis
            yAxisId="reps"
            stroke="#8a8577"
            fontSize={12}
            label={{ value: 'Reps', angle: -90, position: 'insideLeft', fill: '#8a8577', fontSize: 12 }}
          />
          <YAxis
            yAxisId="time"
            orientation="right"
            stroke="#8a8577"
            fontSize={12}
            reversed
            tickFormatter={formatRunTime}
            label={{ value: 'Run Time', angle: 90, position: 'insideRight', fill: '#8a8577', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a17', border: '1px solid #2a2a25', borderRadius: '8px' }}
            labelStyle={{ color: '#f0ece4' }}
            formatter={(value, name) => {
              if (name === 'Run Time') return [formatRunTime(value as number), name]
              return [value, name]
            }}
          />
          <Legend wrapperStyle={{ color: '#c4bfb3', fontSize: '12px' }} />
          <Line yAxisId="reps" type="monotone" dataKey="pushups" name="Pushups" stroke="#7c9a6e" strokeWidth={2} dot={{ r: 4 }} />
          <Line yAxisId="reps" type="monotone" dataKey="situps" name="Situps" stroke="#c4880c" strokeWidth={2} dot={{ r: 4 }} />
          <Line yAxisId="reps" type="monotone" dataKey="pullups" name="Pullups" stroke="#6b8cce" strokeWidth={2} dot={{ r: 4 }} />
          <Line yAxisId="time" type="monotone" dataKey="runTime" name="Run Time" stroke="#ce6b6b" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
