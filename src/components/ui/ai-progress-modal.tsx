'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface AIProgressModalProps {
  open: boolean
  featureLabel: string
  steps: string[]
}

export function AIProgressModal({ open, featureLabel, steps }: AIProgressModalProps) {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Open → start progress
  useEffect(() => {
    if (open) {
      setProgress(0)
      setStepIndex(0)
      setVisible(true)

      // Progress: fast at first, slows as it approaches 90%
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          // Slow down as we approach 90
          const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.5
          return Math.min(prev + increment, 90)
        })
      }, 300)

      // Rotate steps
      stepIntervalRef.current = setInterval(() => {
        setStepIndex(prev => (prev + 1) % steps.length)
      }, 3000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current)
    }
  }, [open, steps.length])

  // Close → snap to 100% then hide
  useEffect(() => {
    if (!open && visible) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current)
      setProgress(100)
      const timeout = setTimeout(() => setVisible(false), 600)
      return () => clearTimeout(timeout)
    }
  }, [open, visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface border border-subtle rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
          <h3 className="text-primary font-bold text-lg">{featureLabel}</h3>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-elevated rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-secondary text-sm transition-opacity duration-300">
            {steps[stepIndex]}
          </p>
          <span className="text-muted text-xs font-mono">{Math.round(progress)}%</span>
        </div>

        {/* Subtle helper text */}
        {progress < 100 && (
          <p className="text-muted text-xs mt-2">
            This may take a few seconds...
          </p>
        )}

        {progress >= 100 && (
          <p className="text-accent text-xs font-medium mt-2">
            Done!
          </p>
        )}
      </div>
    </div>
  )
}
