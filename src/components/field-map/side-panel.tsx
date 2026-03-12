'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'
import { PinTypePicker } from '@/components/field-map/pin-type-picker'
import {
  getPinLabel, getPinColor, getMetadataFields, PIN_TYPES as PIN_TYPES_LIST,
  type MetadataField,
} from '@/lib/field-map/pin-types'
import type { ThermalState } from '@/lib/field-map/thermals'
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Pencil,
  Loader2, Thermometer, Wind, Moon, Gauge, MapPin, X, Navigation,
} from 'lucide-react'
import { timeAgo } from '@/lib/format'

// ─── Types ──────────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'Sightings' | 'Sign' | 'Cams' | 'Terrain'

export type Pin = {
  id: string
  pin_type: string
  lat: number
  lng: number
  label: string | null
  notes: string | null
  color: string | null
  metadata: Record<string, unknown>
  observed_at: string
  temp_f: number | null
  wind_speed_mph: number | null
  wind_direction: string | null
  pressure_inhg: number | null
  pressure_trend: string | null
  moon_phase: string | null
  moon_illumination: number | null
}

export type PinFormData = {
  pin_type: string
  label: string
  notes: string
  observed_at: string
  lat: number | null
  lng: number | null
  metadata: Record<string, unknown>
}

type Props = {
  pins: Pin[]
  selectedId: string | null
  formOpen: boolean
  formData: PinFormData
  saving: boolean
  editingId: string | null
  thermalConeId: string | null
  thermalState: ThermalState | null
  thermalLoading: boolean
  onFormToggle: () => void
  onFormChange: (data: PinFormData) => void
  onSave: () => void
  onDelete: (id: string) => void
  onPinSelect: (id: string | null) => void
  onEdit: (pin: Pin) => void
  onToggleThermalCone: (pinId: string) => void
}

// ─── Filter logic ───────────────────────────────────────────────────────────

const FILTER_TABS: FilterTab[] = ['All', 'Sightings', 'Sign', 'Cams', 'Terrain']

const GROUP_MAP: Record<FilterTab, string[]> = {
  All: [],
  Sightings: ['Sightings'],
  Sign: ['Sign'],
  Cams: ['Infrastructure'],
  Terrain: ['Terrain', 'Custom'],
}

function matchesFilter(pinType: string, tab: FilterTab): boolean {
  if (tab === 'All') return true
  const groups = GROUP_MAP[tab]
  const def = PIN_TYPES_LIST.find(p => p.value === pinType)
  return def ? groups.includes(def.group) : false
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── Component ──────────────────────────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
  heating: 'bg-green-500/20 text-green-400 border-green-500/30',
  cooling: 'bg-green-500/20 text-green-400 border-green-500/30',
  wind_override: 'bg-red-500/20 text-red-400 border-red-500/30',
  wind_flat: 'bg-red-500/20 text-red-400 border-red-500/30',
  transition: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  neutral: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  pooling: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

export function SidePanel({
  pins, selectedId, formOpen, formData, saving, editingId,
  thermalConeId, thermalState, thermalLoading,
  onFormToggle, onFormChange, onSave, onDelete, onPinSelect, onEdit,
  onToggleThermalCone,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = pins.filter(p => matchesFilter(p.pin_type, filter))
  const metaFields = getMetadataFields(formData.pin_type)

  function updateMeta(key: string, value: unknown) {
    onFormChange({
      ...formData,
      metadata: { ...formData.metadata, [key]: value },
    })
  }

  // Collapsed state
  if (collapsed) {
    return (
      <>
        {/* Desktop: slim rail */}
        <div className="hidden lg:flex w-10 bg-surface/90 backdrop-blur border-l border-subtle flex-col items-center pt-3">
          <button
            onClick={() => setCollapsed(false)}
            className="text-muted hover:text-primary transition-colors"
            title="Expand panel"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        {/* Mobile: floating button to re-open */}
        <button
          onClick={() => setCollapsed(false)}
          className="lg:hidden fixed bottom-4 right-4 z-[500] bg-surface border border-subtle rounded-full p-3 shadow-lg text-muted hover:text-primary transition-colors"
          title="Show pins"
        >
          <MapPin className="h-5 w-5" />
        </button>
      </>
    )
  }

  return (
    <div className="w-full lg:w-96 bg-surface/95 backdrop-blur border-t lg:border-t-0 lg:border-l border-subtle flex flex-col h-[40vh] lg:h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted uppercase tracking-wide font-medium">
            {pins.length} pin{pins.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onFormToggle}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-elevated text-secondary border border-subtle hover:text-primary transition-colors"
          >
            {formOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {formOpen ? 'Cancel' : 'Add Pin'}
          </button>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-muted hover:text-primary transition-colors"
          title="Collapse panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Entry / Edit Form */}
      {formOpen && (
        <div className="px-4 py-3 border-b border-subtle space-y-3 shrink-0 overflow-y-auto max-h-[50vh]">
          {editingId && (
            <p className="text-xs text-accent-hover font-medium uppercase tracking-wide">Editing pin</p>
          )}

          {/* Pin type picker */}
          <PinTypePicker
            value={formData.pin_type}
            onChange={pt => onFormChange({ ...formData, pin_type: pt, metadata: {} })}
          />

          {/* Coords display */}
          {formData.lat != null && (
            <p className="text-xs text-muted flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formData.lat.toFixed(5)}, {formData.lng?.toFixed(5)}
            </p>
          )}

          {/* Dynamic metadata fields */}
          {metaFields.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {metaFields.map(field => (
                <MetadataInput
                  key={field.key}
                  field={field}
                  value={formData.metadata[field.key]}
                  onChange={v => updateMeta(field.key, v)}
                />
              ))}
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-xs text-muted uppercase tracking-wide mb-1">Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={e => onFormChange({ ...formData, label: e.target.value })}
              placeholder="e.g. Oak Ridge Draw"
              className="input-field w-full !py-1.5 !text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-muted uppercase tracking-wide mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => onFormChange({ ...formData, notes: e.target.value })}
              placeholder="Observations..."
              className="input-field w-full resize-none !py-1.5 !text-sm"
            />
          </div>

          {/* Observed at (only for new pins / manual add) */}
          {!editingId && (
            <div>
              <label className="block text-xs text-muted uppercase tracking-wide mb-1">Date / Time</label>
              <input
                type="datetime-local"
                value={formData.observed_at}
                onChange={e => onFormChange({ ...formData, observed_at: e.target.value })}
                className="input-field w-full !py-1.5 !text-sm"
              />
            </div>
          )}

          {/* Save / Update */}
          <button
            onClick={onSave}
            disabled={!formData.pin_type || (formData.lat == null && !editingId) || saving}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? 'Update Pin' : 'Save Pin'}
          </button>
          {formData.lat == null && formData.pin_type && !editingId && (
            <p className="text-xs text-amber-400 text-center">Long-press the map to set location</p>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="px-4 py-2 border-b border-subtle flex gap-1 shrink-0 overflow-x-auto">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
              filter === tab
                ? 'bg-accent-dim text-accent-hover'
                : 'text-muted hover:text-secondary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pin list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <MapPin className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-xs text-secondary">
              {pins.length === 0 ? 'No pins yet. Long-press the map to drop one.' : 'No pins match this filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {filtered.map(pin => {
              const expanded = expandedId === pin.id
              const isSelected = selectedId === pin.id
              const meta = (pin.metadata ?? {}) as Record<string, unknown>

              return (
                <div
                  key={pin.id}
                  className={cn(
                    'transition-colors',
                    isSelected && 'bg-accent-dim/30'
                  )}
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => {
                      onPinSelect(isSelected ? null : pin.id)
                      setExpandedId(expanded ? null : pin.id)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-elevated/30 transition-colors"
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: pin.color ?? getPinColor(pin.pin_type) }}
                    />
                    <span className="text-xs text-primary font-medium truncate">
                      {getPinLabel(pin.pin_type)}
                      {meta.point_count ? ` (${meta.point_count}pt)` : ''}
                    </span>
                    {pin.label && (
                      <span className="text-xs text-muted truncate hidden sm:block">{pin.label}</span>
                    )}
                    <span className="ml-auto text-xs text-muted shrink-0">{timeAgo(pin.observed_at)}</span>
                  </button>

                  {/* Expanded */}
                  {expanded && (
                    <div className="px-4 pb-3 space-y-2">
                      {/* Metadata */}
                      {Object.keys(meta).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(meta).map(([key, val]) =>
                            val != null && val !== '' ? (
                              <span key={key} className="text-xs bg-elevated px-1.5 py-0.5 rounded text-secondary">
                                {key.replace(/_/g, ' ')}: <span className="text-primary">{String(val)}</span>
                              </span>
                            ) : null
                          )}
                        </div>
                      )}

                      {/* Conditions */}
                      {(pin.temp_f != null || pin.moon_phase) && (
                        <div className="flex flex-wrap gap-2 py-1.5 px-2 rounded bg-elevated/50 border border-subtle">
                          {pin.temp_f != null && (
                            <span className="flex items-center gap-1 text-xs text-secondary">
                              <Thermometer className="h-3 w-3" /> {pin.temp_f}°F
                            </span>
                          )}
                          {pin.wind_speed_mph != null && (
                            <span className="flex items-center gap-1 text-xs text-secondary">
                              <Wind className="h-3 w-3" /> {pin.wind_speed_mph} mph {pin.wind_direction ?? ''}
                            </span>
                          )}
                          {pin.pressure_inhg != null && (
                            <span className="flex items-center gap-1 text-xs text-secondary">
                              <Gauge className="h-3 w-3" /> {pin.pressure_inhg} inHg
                            </span>
                          )}
                          {pin.moon_phase && (
                            <span className="flex items-center gap-1 text-xs text-secondary">
                              <Moon className="h-3 w-3" /> {pin.moon_phase}
                              {pin.moon_illumination != null && ` ${pin.moon_illumination}%`}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Thermal Scent Cone */}
                      <div className="space-y-1.5">
                        <button
                          onClick={() => onToggleThermalCone(pin.id)}
                          disabled={pin.wind_speed_mph == null && thermalConeId !== pin.id}
                          className={cn(
                            'flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border transition-colors w-full',
                            thermalConeId === pin.id
                              ? 'bg-accent-dim text-accent-hover border-accent-border'
                              : 'bg-elevated text-secondary border-subtle hover:text-primary',
                            pin.wind_speed_mph == null && thermalConeId !== pin.id && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          {thermalLoading && thermalConeId === pin.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Navigation className="h-3 w-3" />
                          )}
                          {thermalConeId === pin.id ? 'Hide Scent Cone' : 'Scent Cone'}
                        </button>

                        {thermalConeId === pin.id && thermalState && (
                          <div className="space-y-1.5 py-1.5 px-2 rounded bg-elevated/50 border border-subtle">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                                MODE_COLORS[thermalState.mode],
                              )}>
                                {thermalState.modeLabel}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-primary">
                                <Navigation
                                  className="h-3 w-3"
                                  style={{ transform: `rotate(${thermalState.thermalDirDeg}deg)` }}
                                />
                                {thermalState.thermalLabel}
                              </span>
                              <span className={cn(
                                'ml-auto text-[10px] uppercase tracking-wide',
                                thermalState.confidence === 'high' ? 'text-green-400'
                                  : thermalState.confidence === 'medium' ? 'text-amber-400'
                                  : 'text-red-400',
                              )}>
                                {thermalState.confidence}
                              </span>
                            </div>
                            <p className="text-xs text-secondary leading-relaxed">
                              {thermalState.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {pin.notes && (
                        <p className="text-xs text-secondary italic">&ldquo;{pin.notes}&rdquo;</p>
                      )}

                      {/* Coords */}
                      <p className="text-xs text-muted">
                        {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                      </p>

                      {/* Actions */}
                      <div className="flex justify-between">
                        <button
                          onClick={() => onEdit(pin)}
                          className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors p-2 -ml-2"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        {deleteConfirm === pin.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-secondary">Delete?</span>
                            <button
                              onClick={() => { onDelete(pin.id); setDeleteConfirm(null) }}
                              className="text-xs text-red-400 hover:text-red-300 font-medium p-2"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-muted hover:text-secondary p-2"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(pin.id)}
                            className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors p-2 -mr-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Metadata field renderer ────────────────────────────────────────────────

function MetadataInput({
  field,
  value,
  onChange,
}: {
  field: MetadataField
  value: unknown
  onChange: (val: unknown) => void
}) {
  const strVal = value != null ? String(value) : ''

  switch (field.type) {
    case 'select':
      return (
        <div>
          <label className="block text-xs text-muted uppercase tracking-wide mb-1">{field.label}</label>
          <TacticalSelect
            value={strVal}
            onChange={onChange}
            options={field.options ?? []}
            placeholder={`Select`}
            className="!text-xs"
          />
        </div>
      )
    case 'number':
      return (
        <div>
          <label className="block text-xs text-muted uppercase tracking-wide mb-1">{field.label}</label>
          <input
            type="number"
            value={strVal}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            className="input-field w-full !py-1.5 !text-sm"
          />
        </div>
      )
    case 'text':
      return (
        <div>
          <label className="block text-xs text-muted uppercase tracking-wide mb-1">{field.label}</label>
          <input
            type="text"
            value={strVal}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="input-field w-full !py-1.5 !text-sm"
          />
        </div>
      )
    case 'date':
      return (
        <div>
          <label className="block text-xs text-muted uppercase tracking-wide mb-1">{field.label}</label>
          <input
            type="date"
            value={strVal}
            onChange={e => onChange(e.target.value)}
            className="input-field w-full !py-1.5 !text-sm"
          />
        </div>
      )
    case 'boolean':
      return (
        <div className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            className="accent-[#7c9a6e]"
          />
          <label className="text-xs text-secondary">{field.label}</label>
        </div>
      )
    default:
      return null
  }
}
