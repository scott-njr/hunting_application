'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import { AlertBanner } from '@/components/ui/alert-banner'

export function BaselineLogForm() {
  const router = useRouter()
  const [runMinutes, setRunMinutes] = useState('')
  const [runSeconds, setRunSeconds] = useState('')
  const [pushups, setPushups] = useState('')
  const [situps, setSitups] = useState('')
  const [pullups, setPullups] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const mins = parseInt(runMinutes, 10)
    const secs = parseInt(runSeconds, 10)
    if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs > 59) {
      setError('Enter a valid run time (MM:SS)')
      setSaving(false)
      return
    }

    const run_time_seconds = mins * 60 + secs
    const pushupCount = parseInt(pushups, 10)
    const situpCount = parseInt(situps, 10)
    const pullupCount = parseInt(pullups, 10)

    if (isNaN(pushupCount) || isNaN(situpCount) || isNaN(pullupCount)) {
      setError('Enter valid numbers for all exercises')
      setSaving(false)
      return
    }

    const res = await fetch('/api/fitness/baseline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        run_time_seconds,
        pushups: pushupCount,
        situps: situpCount,
        pullups: pullupCount,
        notes: notes.trim() || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save test')
      setSaving(false)
      return
    }

    setSuccess(true)
    setRunMinutes('')
    setRunSeconds('')
    setPushups('')
    setSitups('')
    setPullups('')
    setNotes('')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="h-5 w-5 text-accent" />
        <h2 className="text-primary font-bold text-lg">Log Test Results</h2>
      </div>

      {error && <AlertBanner variant="error" message={error} className="mb-4" />}

      {success && <AlertBanner variant="success" message="Test logged successfully!" className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ordered to match test protocol: Pullups → Pushups → Situps → Run */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-secondary text-sm mb-1.5">1. Pullups <span className="text-muted">(max)</span></label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={pullups}
              onChange={(e) => setPullups(e.target.value)}
              className="w-full input-field"
              required
            />
          </div>
          <div>
            <label className="block text-secondary text-sm mb-1.5">2. Pushups <span className="text-muted">(2 min)</span></label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={pushups}
              onChange={(e) => setPushups(e.target.value)}
              className="w-full input-field"
              required
            />
          </div>
          <div>
            <label className="block text-secondary text-sm mb-1.5">3. Situps <span className="text-muted">(2 min)</span></label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={situps}
              onChange={(e) => setSitups(e.target.value)}
              className="w-full input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">4. 2-Mile Run Time</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="99"
              placeholder="MM"
              value={runMinutes}
              onChange={(e) => setRunMinutes(e.target.value)}
              className="w-20 input-field text-center"
              required
            />
            <span className="text-muted font-bold">:</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="SS"
              value={runSeconds}
              onChange={(e) => setRunSeconds(e.target.value)}
              className="w-20 input-field text-center"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-secondary text-sm mb-1.5">Notes <span className="text-muted">(optional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full input-field resize-none"
            rows={2}
            placeholder="How did it feel? Any conditions to note?"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed font-semibold rounded transition-colors"
        >
          {saving ? 'Saving...' : 'Log Baseline Test'}
        </button>
      </form>
    </div>
  )
}
