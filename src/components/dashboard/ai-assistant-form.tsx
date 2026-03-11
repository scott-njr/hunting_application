'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'

const STATE_OPTIONS = [
  { value: 'AZ', label: 'Arizona' },
  { value: 'CO', label: 'Colorado' },
  { value: 'ID', label: 'Idaho' },
  { value: 'MT', label: 'Montana' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'OR', label: 'Oregon' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'UT', label: 'Utah' },
  { value: 'WA', label: 'Washington' },
  { value: 'WY', label: 'Wyoming' },
]

const SPECIES_OPTIONS = [
  { value: 'elk', label: 'Elk' },
  { value: 'mule_deer', label: 'Mule Deer' },
  { value: 'pronghorn', label: 'Pronghorn' },
  { value: 'bighorn', label: 'Bighorn Sheep' },
  { value: 'moose', label: 'Moose' },
]

const YEAR_OPTIONS = [
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
]

export function AIAssistantForm() {
  const [state, setState] = useState('')
  const [species, setSpecies] = useState('')
  const [year, setYear] = useState('2026')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">State</label>
        <TacticalSelect
          value={state}
          onChange={setState}
          options={STATE_OPTIONS}
          placeholder="Select state…"
        />
      </div>
      <div>
        <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Species</label>
        <TacticalSelect
          value={species}
          onChange={setSpecies}
          options={SPECIES_OPTIONS}
          placeholder="Select species…"
        />
      </div>
      <div>
        <label className="block text-secondary text-xs mb-1.5 uppercase tracking-wide">Season Year</label>
        <TacticalSelect
          value={year}
          onChange={setYear}
          options={YEAR_OPTIONS}
        />
      </div>
      <div className="sm:col-span-3 flex items-center gap-3">
        <button
          disabled
          className="bg-elevated text-secondary font-semibold rounded px-5 py-2.5
                     text-sm flex items-center gap-2 cursor-not-allowed"
        >
          <Bot className="h-4 w-4" />
          Get Recommendations
        </button>
        <span className="text-xs text-amber-400 bg-amber-950/40 border border-amber-500/20 rounded px-2.5 py-1">
          AI engine coming soon
        </span>
      </div>
    </div>
  )
}
