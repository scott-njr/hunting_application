'use client'

import { useState } from 'react'
import { Plus, Minus, X, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { type SessionSettings, type DelayMode, SENSITIVITY_THRESHOLDS, FREQUENCY_BANDS, DEFAULT_BAND_THRESHOLDS } from './shot-timer-types'
import { cn } from '@/lib/utils'

interface TimerSettingsPanelProps {
  settings: SessionSettings
  onUpdate: (settings: Partial<SessionSettings>) => void
  onClose: () => void
}

const DELAY_MODES: { value: DelayMode; label: string; description: string }[] = [
  { value: 'random', label: 'Random', description: 'Random delay between min and max' },
  { value: 'fixed', label: 'Fixed', description: 'Fixed delay (uses min value)' },
  { value: 'instant', label: 'Instant', description: 'No delay — immediate start' },
]

const SENSITIVITY_LABELS: Record<number, string> = {
  1: 'Minimum (loud shots only)',
  2: 'Very Low',
  3: 'Low',
  4: 'Medium (default)',
  5: 'Medium-High',
  6: 'High',
  7: 'Very High',
  8: 'Maximum (finger snap)',
}

export function TimerSettingsPanel({ settings, onUpdate, onClose }: TimerSettingsPanelProps) {
  const [newParTime, setNewParTime] = useState('')
  const [showBandThresholds, setShowBandThresholds] = useState(true)

  function addParTime() {
    const ms = Math.round(parseFloat(newParTime) * 1000)
    if (isNaN(ms) || ms <= 0) return
    const updated = [...settings.parTimesMs, ms].sort((a, b) => a - b)
    onUpdate({ parTimesMs: updated })
    setNewParTime('')
  }

  function removeParTime(index: number) {
    const updated = settings.parTimesMs.filter((_, i) => i !== index)
    onUpdate({ parTimesMs: updated })
  }

  return (
    <div className="bg-surface border border-subtle rounded-xl p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-bold text-sm">Timer Settings</h3>
        <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sensitivity */}
      <div>
        <label className="text-secondary text-xs font-medium block mb-2">
          Sensitivity: {settings.sensitivity} — {SENSITIVITY_LABELS[settings.sensitivity]}
        </label>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={settings.sensitivity}
          onChange={e => onUpdate({ sensitivity: parseInt(e.target.value) })}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-muted text-[10px] mt-1">
          <span>1 (Loud)</span>
          <span>Threshold: {SENSITIVITY_THRESHOLDS[settings.sensitivity]}</span>
          <span>8 (Sensitive)</span>
        </div>
      </div>

      {/* Per-Band Thresholds */}
      <div>
        <button
          onClick={() => setShowBandThresholds(!showBandThresholds)}
          className="flex items-center gap-1.5 text-secondary text-xs font-medium mb-2 hover:text-primary transition-colors"
        >
          {showBandThresholds ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Band Thresholds
        </button>
        {showBandThresholds && (
          <div className="space-y-2.5 bg-elevated rounded-lg p-3 border border-subtle">
            {FREQUENCY_BANDS.map((band, i) => {
              const threshold = settings.bandThresholds[i] ?? DEFAULT_BAND_THRESHOLDS[i]
              return (
                <div key={band.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-muted text-[10px] uppercase tracking-wider">{band.name}</span>
                    <span className="text-muted text-[10px] font-mono">{band.minHz}–{band.maxHz}Hz · {threshold}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    step={5}
                    value={threshold}
                    onChange={e => {
                      const updated = [...settings.bandThresholds]
                      updated[i] = parseInt(e.target.value)
                      onUpdate({ bandThresholds: updated })
                    }}
                    className="w-full accent-accent h-1.5"
                  />
                </div>
              )
            })}
            <button
              onClick={() => onUpdate({ bandThresholds: [...DEFAULT_BAND_THRESHOLDS] })}
              className="flex items-center gap-1.5 text-muted text-[10px] hover:text-secondary transition-colors mt-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </button>
          </div>
        )}
      </div>

      {/* Shots & Strings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-secondary text-xs font-medium block mb-1">
            Shots per String
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={99}
              step={1}
              value={settings.shotsPerString ?? ''}
              onChange={e => {
                const v = e.target.value === '' ? null : parseInt(e.target.value)
                onUpdate({ shotsPerString: v && v > 0 ? v : null })
              }}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-primary text-sm font-mono placeholder:text-muted"
            />
          </div>
          <p className="text-muted text-[10px] mt-0.5">Auto-stop after N shots. Blank = manual stop.</p>
        </div>
        <div>
          <label className="text-secondary text-xs font-medium block mb-1">
            Total Strings
          </label>
          <input
            type="number"
            min={0}
            max={10}
            step={1}
            value={settings.totalStringsInCourse ?? ''}
            onChange={e => {
              const v = e.target.value === '' ? null : parseInt(e.target.value)
              onUpdate({ totalStringsInCourse: v && v > 0 ? v : null })
            }}
            placeholder="Unlimited"
            className="w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-primary text-sm font-mono placeholder:text-muted"
          />
          <p className="text-muted text-[10px] mt-0.5">Blank = unlimited strings.</p>
        </div>
      </div>

      {/* Delay Mode */}
      <div>
        <label className="text-secondary text-xs font-medium block mb-2">Start Delay</label>
        <div className="flex gap-1 bg-elevated rounded-lg p-1">
          {DELAY_MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onUpdate({ delayMode: value })}
              className={cn(
                'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                settings.delayMode === value
                  ? 'bg-accent text-base'
                  : 'text-muted hover:text-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Delay Range (not shown for instant) */}
      {settings.delayMode !== 'instant' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-secondary text-xs font-medium block mb-1">
              {settings.delayMode === 'fixed' ? 'Delay (sec)' : 'Min Delay (sec)'}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="30"
              value={(settings.delayMinMs / 1000).toFixed(1)}
              onChange={e => onUpdate({ delayMinMs: Math.round(parseFloat(e.target.value) * 1000) })}
              className="w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-primary text-sm font-mono"
            />
          </div>
          {settings.delayMode === 'random' && (
            <div>
              <label className="text-secondary text-xs font-medium block mb-1">Max Delay (sec)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={(settings.delayMaxMs / 1000).toFixed(1)}
                onChange={e => onUpdate({ delayMaxMs: Math.round(parseFloat(e.target.value) * 1000) })}
                className="w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-primary text-sm font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* Par Times */}
      <div>
        <label className="text-secondary text-xs font-medium block mb-2">
          Par Times {settings.parTimesMs.length > 0 && `(${settings.parTimesMs.length})`}
        </label>

        {/* Existing par times */}
        {settings.parTimesMs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {settings.parTimesMs.map((ms, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 bg-elevated border border-subtle rounded-md"
              >
                <span className="text-primary text-xs font-mono">{(ms / 1000).toFixed(2)}s</span>
                <button
                  onClick={() => removeParTime(i)}
                  className="text-muted hover:text-red-400 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add par time */}
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Seconds (e.g. 3.50)"
            value={newParTime}
            onChange={e => setNewParTime(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addParTime()}
            className="flex-1 px-3 py-2 bg-elevated border border-subtle rounded-lg text-primary text-sm font-mono placeholder:text-muted"
          />
          <button
            onClick={addParTime}
            disabled={!newParTime}
            className="px-3 py-2 bg-accent hover:bg-accent/90 text-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
