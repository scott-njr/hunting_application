import { Clock, Dumbbell, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCALING_BADGE, WOW_DISCLAIMER } from '@/lib/fitness/constants'

type Movement = {
  name: string
  reps: string
  notes?: string
}

type ScalingLevel = {
  label: string
  description: string
  movements: Movement[]
}

export type WorkoutDetails = {
  duration: string
  equipment: string[]
  scoring: 'time' | 'amrap'
  time_cap_minutes?: number | null
  warmup: string
  cooldown: string
  scaling: {
    rx: ScalingLevel
    scaled: ScalingLevel
    beginner: ScalingLevel
  }
}

export type Workout = {
  id: string
  week_start: string
  title: string
  description: string
  workout_details: WorkoutDetails
  created_on: string
}

interface WowCardProps {
  workout: Workout
  compact?: boolean
  className?: string
}

export function WowCard({ workout, compact = false, className }: WowCardProps) {
  const details = workout.workout_details

  return (
    <div className={cn('rounded-lg border border-subtle bg-surface', className)}>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-400 mb-1">
          Workout of the Week
        </p>
        <h3 className="text-xl font-bold text-primary mb-2">{workout.title}</h3>
        <p className="text-secondary text-sm mb-4">{workout.description}</p>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
            <Clock className="h-3.5 w-3.5" />
            {details.duration}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
            <Target className="h-3.5 w-3.5" />
            {details.scoring === 'time' ? 'For Time' : `AMRAP ${details.time_cap_minutes ?? ''}min`}
          </span>
          {details.equipment.map(eq => (
            <span key={eq} className="inline-flex items-center gap-1.5 text-xs bg-elevated rounded-full px-3 py-1 text-secondary">
              <Dumbbell className="h-3.5 w-3.5" />
              {eq}
            </span>
          ))}
        </div>

        {/* Scaling levels — only show in full mode */}
        {!compact && (
          <div className="space-y-4">
            {(['rx', 'scaled', 'beginner'] as const).map(level => {
              const scale = details.scaling[level]
              return (
                <div key={level} className="rounded-lg border border-subtle bg-elevated/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'text-xs font-bold uppercase px-2 py-0.5 rounded',
                      SCALING_BADGE[level].className
                    )}>
                      {scale.label}
                    </span>
                    <span className="text-muted text-xs">{scale.description}</span>
                  </div>
                  <div className="space-y-1.5">
                    {scale.movements.map((mv, i) => (
                      <div key={i} className="flex items-baseline gap-2 text-sm">
                        <span className="text-primary font-medium">{mv.reps}</span>
                        <span className="text-secondary">{mv.name}</span>
                        {mv.notes && <span className="text-muted text-xs">— {mv.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Warmup / Cooldown */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-subtle">
              <div>
                <p className="text-xs font-semibold text-muted uppercase mb-1">Warm-up</p>
                <p className="text-secondary text-xs">{details.warmup}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted uppercase mb-1">Cool-down</p>
                <p className="text-secondary text-xs">{details.cooldown}</p>
              </div>
            </div>

            <p className="text-muted text-xs italic">
              {WOW_DISCLAIMER}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
