'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type CompletedString } from './shot-timer-types'
import { ShotStringDetail } from './shot-string-detail'

interface ShotStringListProps {
  strings: CompletedString[]
  reviewIndex: number
  parTimesMs: number[]
  onReviewForward: () => void
  onReviewBack: () => void
}

/**
 * Forward/reverse navigation through completed shot strings.
 * Shows the currently selected string's details.
 */
export function ShotStringList({
  strings,
  reviewIndex,
  parTimesMs,
  onReviewForward,
  onReviewBack,
}: ShotStringListProps) {
  if (strings.length === 0) {
    return (
      <div className="bg-elevated border border-subtle rounded-lg p-6 text-center">
        <p className="text-muted text-sm">No strings recorded yet.</p>
      </div>
    )
  }

  const currentString = strings[reviewIndex]
  if (!currentString) return null

  return (
    <div className="space-y-3">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReviewBack}
          disabled={reviewIndex <= 0}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-secondary hover:text-primary border border-subtle rounded-lg hover:bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        <span className="text-primary font-medium text-sm">
          String {currentString.stringNumber} of {strings.length}
        </span>

        <button
          onClick={onReviewForward}
          disabled={reviewIndex >= strings.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-secondary hover:text-primary border border-subtle rounded-lg hover:bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* String detail */}
      <ShotStringDetail string={currentString} parTimesMs={parTimesMs} />
    </div>
  )
}
