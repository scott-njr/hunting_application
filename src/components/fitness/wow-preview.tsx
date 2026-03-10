'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Target, Dumbbell, ArrowRight } from 'lucide-react'
import type { Workout, WorkoutDetails } from './wow-card'

export function WowPreview() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fitness/wow')
      .then(res => res.json())
      .then(data => {
        if (data.workout) {
          setWorkout({
            ...data.workout,
            workout_details: data.workout.workout_details as WorkoutDetails,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-6 animate-pulse">
        <div className="h-4 w-40 bg-elevated rounded mb-3" />
        <div className="h-6 w-64 bg-elevated rounded mb-2" />
        <div className="h-4 w-full bg-elevated rounded" />
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-6 text-center">
        <Dumbbell className="h-6 w-6 text-muted mx-auto mb-2" />
        <p className="text-primary font-semibold text-sm mb-1">New Challenge Drops Monday</p>
        <p className="text-muted text-xs">Every week, a fresh AI-generated workout with leaderboards.</p>
      </div>
    )
  }

  const details = workout.workout_details

  return (
    <div className="rounded-lg border border-green-500/30 bg-green-950/10 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-400 mb-1">
        This Week&apos;s Challenge
      </p>
      <h3 className="text-lg font-bold text-primary mb-2">{workout.title}</h3>
      <p className="text-secondary text-sm mb-4">{workout.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
          <Clock className="h-3.5 w-3.5" />
          {details.duration}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
          <Target className="h-3.5 w-3.5" />
          {details.scoring === 'time' ? 'For Time' : 'AMRAP'}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 rounded-full px-3 py-1 font-medium">
          3 Scaling Levels
        </span>
      </div>

      <Link
        href="/fitness/weekly-challenge"
        className="inline-flex items-center gap-2 btn-primary rounded px-4 py-2 text-sm font-semibold"
      >
        Join the Challenge
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
