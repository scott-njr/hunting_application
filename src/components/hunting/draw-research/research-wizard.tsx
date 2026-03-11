'use client'

import { useState } from 'react'
import { Compass, ChevronRight } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'
import {
  STATE_OPTIONS, SPECIES_OPTIONS, SEASON_OPTIONS, RESIDENCY_OPTIONS,
  TRANSPORTATION_OPTIONS, TRIP_STYLE_OPTIONS, PRIORITY_OPTIONS,
  type WizardInputs, type AutoContext,
} from './types'

function ChipMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter(v => v !== opt.value) : [...selected, opt.value])
            }
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              active
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-elevated border-subtle text-secondary hover:border-default'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function ResearchWizard({
  autoContext,
  onSubmit,
  onCancel,
}: {
  autoContext: AutoContext
  onSubmit: (inputs: WizardInputs) => void
  onCancel: () => void
}) {
  const defaultState = autoContext.statesOfInterest?.length === 1
    ? autoContext.statesOfInterest[0]
    : ''
  const defaultSpecies = autoContext.targetSpecies?.length === 1
    ? autoContext.targetSpecies[0]
    : ''

  const [state, setState] = useState(defaultState)
  const [species, setSpecies] = useState(defaultSpecies)
  const [season, setSeason] = useState('')
  const [residency, setResidency] = useState(
    autoContext.state && defaultState
      ? autoContext.state === defaultState ? 'resident' : 'nonresident'
      : ''
  )
  const [transportation, setTransportation] = useState<string[]>([])
  const [tripStyle, setTripStyle] = useState<string[]>([])
  const [priorities, setPriorities] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  // Auto-detect residency when state changes
  function handleStateChange(val: string) {
    setState(val)
    if (autoContext.state) {
      setResidency(autoContext.state === val ? 'resident' : 'nonresident')
    }
  }

  const canSubmit = state && species && season && residency && transportation.length > 0 && tripStyle.length > 0 && priorities.length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ state, species, season, residency, transportation, tripStyle, priorities, notes })
  }

  // Format points for display
  const statePoints = autoContext.points.filter(p => p.state === state)
  const speciesPoints = statePoints.filter(p => p.species === species)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Compass className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-semibold text-primary">New Draw Research</h2>
      </div>
      <p className="text-secondary text-sm -mt-3">
        Tell us what you&apos;re looking for and we&apos;ll recommend the best units based on your full profile.
      </p>

      {/* State + Species + Season + Residency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">State</label>
          <TacticalSelect value={state} onChange={handleStateChange} options={STATE_OPTIONS} placeholder="Select state…" />
        </div>
        <div>
          <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Species</label>
          <TacticalSelect value={species} onChange={setSpecies} options={SPECIES_OPTIONS} placeholder="Select species…" />
        </div>
        <div>
          <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Season / Weapon</label>
          <TacticalSelect value={season} onChange={setSeason} options={SEASON_OPTIONS} placeholder="Select season…" />
        </div>
        <div>
          <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Residency</label>
          <TacticalSelect value={residency} onChange={setResidency} options={RESIDENCY_OPTIONS} placeholder="Select…" />
        </div>
      </div>

      {/* Transportation */}
      <div>
        <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Transportation (select all that apply)</label>
        <ChipMultiSelect options={TRANSPORTATION_OPTIONS} selected={transportation} onChange={setTransportation} />
      </div>

      {/* Trip Style */}
      <div>
        <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Trip Style (select all that apply)</label>
        <ChipMultiSelect options={TRIP_STYLE_OPTIONS} selected={tripStyle} onChange={setTripStyle} />
      </div>

      {/* Priorities */}
      <div>
        <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">What matters most? (select all that apply)</label>
        <ChipMultiSelect options={PRIORITY_OPTIONS} selected={priorities} onChange={setPriorities} />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Additional Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g., Want good fishing nearby for rest days, prefer less crowded units…"
          rows={2}
          className="w-full bg-elevated border border-default text-primary rounded px-3 py-2 text-sm focus:border-accent focus:outline-none placeholder:text-muted resize-none"
        />
      </div>

      {/* Auto-context chips */}
      <div className="border border-subtle rounded-lg p-3 bg-surface/50">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Auto-pulled from your profile</p>
        <div className="flex flex-wrap gap-2">
          {speciesPoints.map(p => (
            <span key={`${p.state}-${p.species}-${p.point_type}`} className="px-2 py-1 rounded text-xs bg-accent/15 text-accent border border-accent/30">
              {p.points} {p.point_type} pts ({p.state} {p.species})
            </span>
          ))}
          {autoContext.experienceLevel && (
            <span className="px-2 py-1 rounded text-xs bg-elevated text-secondary border border-subtle">
              {autoContext.experienceLevel}
            </span>
          )}
          {autoContext.physicalCondition && (
            <span className="px-2 py-1 rounded text-xs bg-elevated text-secondary border border-subtle">
              Fitness: {autoContext.physicalCondition}
            </span>
          )}
          {autoContext.state && (
            <span className="px-2 py-1 rounded text-xs bg-elevated text-secondary border border-subtle">
              Resident: {autoContext.state}
            </span>
          )}
          {autoContext.baselineTest && (
            <span className="px-2 py-1 rounded text-xs bg-elevated text-secondary border border-subtle">
              Baseline: {Math.floor(autoContext.baselineTest.run_time_seconds / 60)}:{String(autoContext.baselineTest.run_time_seconds % 60).padStart(2, '0')} 2mi
            </span>
          )}
          {autoContext.points.length === 0 && !autoContext.experienceLevel && !autoContext.physicalCondition && (
            <span className="text-xs text-muted">Complete your profile for personalized results</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary font-semibold rounded px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Scout Units <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted hover:text-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
