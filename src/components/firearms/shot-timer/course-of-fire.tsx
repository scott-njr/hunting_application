'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronUp, PlayCircle, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SessionSettings, type DelayMode } from './shot-timer-types'
import type { Database } from '@/types/database.types'

type CourseRow = Database['public']['Tables']['firearms_course_of_fire']['Row']

interface CourseOfFirePanelProps {
  onLoadCourse: (settings: Partial<SessionSettings> & { totalStringsInCourse: number }, courseName: string) => void
}

const DELAY_MODES: { value: DelayMode; label: string }[] = [
  { value: 'random', label: 'Random' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'instant', label: 'Instant' },
]

export function CourseOfFirePanel({ onLoadCourse }: CourseOfFirePanelProps) {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justSavedId, setJustSavedId] = useState<string | null>(null)

  // Form state — used for both create and edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stringsCount, setStringsCount] = useState('5')
  const [shotsPerString, setShotsPerString] = useState('6')
  const [delayMode, setDelayMode] = useState<DelayMode>('random')
  const [delayMinSec, setDelayMinSec] = useState('2.0')
  const [delayMaxSec, setDelayMaxSec] = useState('5.0')

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    try {
      const res = await fetch('/api/firearms/shot-timer/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses)
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  function parseDelayMs(sec: string): number {
    const val = parseFloat(sec)
    if (isNaN(val) || val < 0) return 0
    return Math.round(val * 1000)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      strings_count: Math.max(1, Math.min(10, parseInt(stringsCount) || 1)),
      shots_per_string: Math.max(1, Math.min(99, parseInt(shotsPerString) || 1)),
      delay_mode: delayMode,
      delay_min_ms: parseDelayMs(delayMinSec),
      delay_max_ms: parseDelayMs(delayMaxSec),
    }

    try {
      if (editingId) {
        // Update existing
        const res = await fetch('/api/firearms/shot-timer/courses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
        if (res.ok) {
          const data = await res.json()
          setCourses(prev => prev.map(c => c.id === editingId ? data.course : c))
          setJustSavedId(editingId)
          setTimeout(() => setJustSavedId(null), 2000)
          closeForm()
        }
      } else {
        // Create new
        const res = await fetch('/api/firearms/shot-timer/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const data = await res.json()
          setCourses(prev => [data.course, ...prev])
          setJustSavedId(data.course.id)
          setTimeout(() => setJustSavedId(null), 2000)
          closeForm()
        }
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/firearms/shot-timer/courses?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== id))
        if (editingId === id) closeForm()
      }
    } catch {
      // Silent fail
    }
  }

  function handleEdit(course: CourseRow) {
    setEditingId(course.id)
    setName(course.name)
    setDescription(course.description ?? '')
    setStringsCount(String(course.strings_count))
    setShotsPerString(String(course.shots_per_string))
    setDelayMode(course.delay_mode)
    setDelayMinSec((course.delay_min_ms / 1000).toFixed(1))
    setDelayMaxSec((course.delay_max_ms / 1000).toFixed(1))
    setShowForm(true)
  }

  function handleLoad(course: CourseRow) {
    onLoadCourse({
      delayMode: course.delay_mode,
      delayMinMs: course.delay_min_ms,
      delayMaxMs: course.delay_max_ms,
      parTimesMs: course.par_times_ms,
      shotsPerString: course.shots_per_string,
      totalStringsInCourse: course.strings_count,
    }, course.name)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setName('')
    setDescription('')
    setStringsCount('5')
    setShotsPerString('6')
    setDelayMode('random')
    setDelayMinSec('2.0')
    setDelayMaxSec('5.0')
  }

  function openCreateForm() {
    closeForm()
    setShowForm(true)
  }

  const inputClass = 'w-full px-3 py-2 bg-surface border border-subtle rounded-lg text-primary text-base sm:text-sm placeholder:text-muted'
  const monoInputClass = 'w-full px-3 py-2 bg-surface border border-subtle rounded-lg text-primary text-base sm:text-sm font-mono'

  return (
    <>
    <div className="bg-surface border border-subtle rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-bold text-sm">Course of Fire</h3>
        <button
          onClick={() => showForm ? closeForm() : openCreateForm()}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'New'}
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="space-y-3 border border-subtle rounded-lg p-3 bg-elevated">
          {editingId && (
            <p className="text-accent text-xs font-medium">Editing course</p>
          )}

          <input
            type="text"
            placeholder="Course name (e.g. Bill Drill)"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={inputClass}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-secondary text-xs font-medium block mb-1">Strings</label>
              <input
                type="text"
                inputMode="numeric"
                value={stringsCount}
                onChange={e => setStringsCount(e.target.value.replace(/[^0-9]/g, ''))}
                className={monoInputClass}
              />
            </div>
            <div>
              <label className="text-secondary text-xs font-medium block mb-1">Shots/String</label>
              <input
                type="text"
                inputMode="numeric"
                value={shotsPerString}
                onChange={e => setShotsPerString(e.target.value.replace(/[^0-9]/g, ''))}
                className={monoInputClass}
              />
            </div>
          </div>

          {/* Delay Mode */}
          <div>
            <label className="text-secondary text-xs font-medium block mb-1">Delay</label>
            <div className="flex gap-1 bg-surface rounded-lg p-1">
              {DELAY_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDelayMode(value)}
                  className={cn(
                    'flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors',
                    delayMode === value ? 'bg-accent text-base' : 'text-muted hover:text-secondary'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Delay Range — text inputs */}
          {delayMode !== 'instant' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-secondary text-xs font-medium block mb-1">
                  {delayMode === 'fixed' ? 'Delay (sec)' : 'Min (sec)'}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={delayMinSec}
                  onChange={e => setDelayMinSec(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(delayMinSec)
                    if (isNaN(v)) setDelayMinSec('0.0')
                    else setDelayMinSec(Math.max(0, v).toFixed(1))
                  }}
                  className={monoInputClass}
                />
              </div>
              {delayMode === 'random' && (
                <div>
                  <label className="text-secondary text-xs font-medium block mb-1">Max (sec)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={delayMaxSec}
                    onChange={e => setDelayMaxSec(e.target.value)}
                    onBlur={() => {
                      const v = parseFloat(delayMaxSec)
                      if (isNaN(v)) setDelayMaxSec('0.0')
                      else setDelayMaxSec(Math.max(0, v).toFixed(1))
                    }}
                    className={monoInputClass}
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full px-4 py-2 text-sm font-medium bg-accent text-base rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      )}
    </div>

    {/* Saved courses list */}
    <div className="bg-surface border border-subtle rounded-xl p-4 space-y-3">
      <h3 className="text-primary font-bold text-sm">Saved Courses</h3>
      {loading ? (
        <p className="text-muted text-xs">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-muted text-xs">No courses created yet. Create one above to define your drills.</p>
      ) : (
        <div className="space-y-2">
          {courses.map(course => (
            <div
              key={course.id}
              className={cn(
                'flex items-center gap-3 bg-elevated border rounded-lg p-3 transition-colors duration-500',
                justSavedId === course.id ? 'border-accent bg-accent/10' : 'border-subtle'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-primary text-sm font-medium truncate">{course.name}</p>
                <p className="text-muted text-xs">
                  {course.strings_count} strings × {course.shots_per_string} shots · {course.delay_mode} delay
                </p>
                {course.description && (
                  <p className="text-muted text-xs mt-0.5 truncate">{course.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleLoad(course)}
                  className="p-1.5 text-accent hover:text-accent/80 transition-colors"
                  title="Load course"
                >
                  <PlayCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEdit(course)}
                  className="p-1.5 text-muted hover:text-secondary transition-colors"
                  title="Edit course"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-1.5 text-muted hover:text-red-400 transition-colors"
                  title="Delete course"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
