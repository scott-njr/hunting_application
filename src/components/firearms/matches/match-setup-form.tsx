'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'

type CourseOption = {
  id: string
  name: string
  strings_count: number
  shots_per_string: number
}

interface MatchSetupFormProps {
  courses: CourseOption[]
  onSubmit: (name: string, courseId: string, matchDate: string | null) => void
  onCancel: () => void
}

export function MatchSetupForm({ courses, onSubmit, onCancel }: MatchSetupFormProps) {
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [matchDate, setMatchDate] = useState('')

  const selectedCourse = courses.find(c => c.id === courseId)
  const canSubmit = name.trim() && courseId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(name.trim(), courseId, matchDate || null)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-subtle rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-bold text-sm">Create Match</h3>
        <button type="button" onClick={onCancel} className="text-muted hover:text-primary transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Match name */}
      <div>
        <label className="text-secondary text-xs font-medium block mb-1">Match Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='e.g. "Tuesday Night Steel"'
          className="w-full px-3 py-2.5 bg-elevated border border-subtle rounded-lg text-primary text-sm placeholder:text-muted/50 focus:border-accent focus:outline-none"
          autoFocus
        />
      </div>

      {/* Course of Fire */}
      <div>
        <label className="text-secondary text-xs font-medium block mb-1">Course of Fire</label>
        {courses.length === 0 ? (
          <p className="text-muted text-xs bg-elevated border border-subtle rounded-lg p-3">
            No courses saved. Create a Course of Fire in the Shot Timer first.
          </p>
        ) : (
          <TacticalSelect
            value={courseId}
            onChange={setCourseId}
            options={courses.map(c => ({
              value: c.id,
              label: `${c.name} (${c.strings_count}×${c.shots_per_string})`,
            }))}
            placeholder="Select a course..."
          />
        )}
        {selectedCourse && (
          <p className="text-muted text-[10px] mt-1">
            {selectedCourse.strings_count} strings × {selectedCourse.shots_per_string} shots per string
          </p>
        )}
      </div>

      {/* Match date */}
      <div>
        <label className="text-secondary text-xs font-medium block mb-1">Date (optional)</label>
        <input
          type="date"
          value={matchDate}
          onChange={e => setMatchDate(e.target.value)}
          className="w-full px-3 py-2.5 bg-elevated border border-subtle rounded-lg text-primary text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full px-4 py-2.5 text-sm font-medium bg-accent text-base rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Create Match
      </button>
    </form>
  )
}
