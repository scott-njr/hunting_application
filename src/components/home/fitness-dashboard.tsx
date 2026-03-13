'use client'

import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from 'recharts'
import { Activity, Dumbbell, TrendingUp, UtensilsCrossed, Flame } from 'lucide-react'
import { CHART_THEME, PLAN_BAR_COLORS, BASELINE_LINE_COLORS } from '@/lib/chart-theme'

interface BaselineTest {
  tested_at: string
  run_time_seconds: number
  pushups: number
  situps: number
  pullups: number
}

interface ChartData {
  sessionsPerWeek: number[]
  completedPerWeek: number[]
  weeksTotal: number
  goal: string
}

interface FitnessDashboardProps {
  baselineTests: BaselineTest[]
  runChart: ChartData | null
  strengthChart: ChartData | null
  hasMealPlan: boolean
  totalWorkoutsLogged: number
}

function formatRunTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MiniPlanChart({ data, label, icon: Icon }: { data: ChartData; label: string; icon: React.ElementType }) {
  const chartData = Array.from({ length: data.weeksTotal }, (_, i) => ({
    week: `W${i + 1}`,
    expected: data.sessionsPerWeek[i] ?? 0,
    completed: data.completedPerWeek[i] ?? 0,
  }))

  const hasAnyData = data.completedPerWeek.some(c => c > 0)
  if (!hasAnyData) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-accent" />
        <span className="text-primary text-xs font-semibold">{label}</span>
        <span className="text-muted text-[10px] ml-auto">{data.goal}</span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={chartData} margin={{ top: 2, right: 2, left: -20, bottom: 2 }}>
          <XAxis dataKey="week" stroke={CHART_THEME.axisStroke} fontSize={9} />
          <YAxis stroke={CHART_THEME.axisStroke} fontSize={9} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: '8px', fontSize: '11px' }}
            labelStyle={{ color: CHART_THEME.labelColor }}
            formatter={(value, name) => [value, name === 'completed' ? 'Done' : 'Target']}
          />
          <Bar dataKey="expected" fill={PLAN_BAR_COLORS.expected} radius={[2, 2, 0, 0]} />
          <Bar dataKey="completed" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.completed >= entry.expected ? PLAN_BAR_COLORS.completed : PLAN_BAR_COLORS.partial} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FitnessDashboard({ baselineTests, runChart, strengthChart, hasMealPlan, totalWorkoutsLogged }: FitnessDashboardProps) {
  const hasBaseline = baselineTests.length >= 2
  const hasPlans = !!(runChart || strengthChart)
  const activePlanCount = (runChart ? 1 : 0) + (strengthChart ? 1 : 0) + (hasMealPlan ? 1 : 0)

  return (
    <div className="rounded-lg border border-subtle bg-surface p-5 space-y-5">
      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-accent" />
          <span className="text-primary text-sm font-semibold">{totalWorkoutsLogged}</span>
          <span className="text-muted text-xs">workouts logged</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <span className="text-primary text-sm font-semibold">{activePlanCount}</span>
          <span className="text-muted text-xs">active plan{activePlanCount !== 1 ? 's' : ''}</span>
        </div>
        {hasMealPlan && (
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs text-accent font-medium">Meal plan active</span>
          </div>
        )}
      </div>

      {/* Baseline trend */}
      {hasBaseline && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              <span className="text-primary text-xs font-semibold">Baseline Trend</span>
            </div>
            <Link href="/fitness/baseline" className="text-[10px] text-accent hover:text-accent-hover">
              View all &rarr;
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={[...baselineTests].reverse().map(t => ({
                date: new Date(t.tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                runTime: t.run_time_seconds,
                pushups: t.pushups,
                situps: t.situps,
                pullups: t.pullups,
              }))}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <XAxis dataKey="date" stroke={CHART_THEME.axisStroke} fontSize={10} />
              <YAxis yAxisId="reps" stroke={CHART_THEME.axisStroke} fontSize={10} />
              <YAxis yAxisId="time" orientation="right" stroke={CHART_THEME.axisStroke} fontSize={10} reversed tickFormatter={formatRunTime} />
              <Tooltip
                contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, border: `1px solid ${CHART_THEME.tooltipBorder}`, borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: CHART_THEME.labelColor }}
                formatter={(value, name) => {
                  if (name === 'Run Time') return [formatRunTime(value as number), name]
                  return [value, name]
                }}
              />
              <Legend wrapperStyle={{ color: CHART_THEME.legendColor, fontSize: '10px' }} />
              <Line yAxisId="reps" type="monotone" dataKey="pushups" name="Pushups" stroke={BASELINE_LINE_COLORS.pushups} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="reps" type="monotone" dataKey="situps" name="Situps" stroke={BASELINE_LINE_COLORS.situps} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="reps" type="monotone" dataKey="pullups" name="Pullups" stroke={BASELINE_LINE_COLORS.pullups} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="time" type="monotone" dataKey="runTime" name="Run Time" stroke={BASELINE_LINE_COLORS.runTime} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Plan progress charts */}
      {hasPlans && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {runChart && <MiniPlanChart data={runChart} label="Run Plan" icon={Activity} />}
          {strengthChart && <MiniPlanChart data={strengthChart} label="Strength Plan" icon={Dumbbell} />}
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-subtle">
        <Link href="/fitness/baseline" className="text-xs text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded transition-colors">Baseline</Link>
        <Link href="/fitness/run-coach" className="text-xs text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded transition-colors">Run Coach</Link>
        <Link href="/fitness/strength-coach" className="text-xs text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded transition-colors">Strength</Link>
        <Link href="/fitness/meal-prep" className="text-xs text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded transition-colors">Meal Prep</Link>
      </div>
    </div>
  )
}
