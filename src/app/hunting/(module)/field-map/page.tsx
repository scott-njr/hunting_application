'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FieldMapDynamic } from '@/components/field-map/field-map-dynamic'
import { LayerSwitcher } from '@/components/field-map/layer-switcher'
import { SidePanel, type Pin, type PinFormData } from '@/components/field-map/side-panel'
import {
  getThermalState, getScentConeBands, getScentPoolCircle, getConeParams, compassToDegrees,
  type ThermalState, type ScentConeBand, type ThermalMode,
} from '@/lib/field-map/thermals'
import type { ThermalConeData } from '@/components/field-map/field-map'

type MapLayer = 'topo' | 'satellite' | 'hybrid'

const EMPTY_FORM: PinFormData = {
  pin_type: '',
  label: '',
  notes: '',
  observed_at: '',
  lat: null,
  lng: null,
  metadata: {},
}

function localDatetimeDefault(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function FieldMapPage() {
  const [pins, setPins] = useState<Pin[]>([])
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState<PinFormData>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<MapLayer>('topo')
  const [showLandBoundaries, setShowLandBoundaries] = useState(false)
  const [thermalConeId, setThermalConeId] = useState<string | null>(null)
  const [thermalState, setThermalState] = useState<ThermalState | null>(null)
  const [thermalCone, setThermalCone] = useState<ThermalConeData | null>(null)
  const [thermalLoading, setThermalLoading] = useState(false)
  const terrainCacheRef = useRef<Map<string, { slopeDeg: number; slopeAspectDeg: number }>>(new Map())
  const drainageCacheRef = useRef<Map<string, ScentConeBand[] | null>>(new Map())

  const supabase = createClient()

  const loadPins = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('journal_pins')
        .select('*')
        .eq('user_id', user.id)
        .order('observed_at', { ascending: false })

      if (error) {
        console.warn('[field-map] Failed to load pins:', error.message)
      } else if (data) {
        setPins(data as Pin[])
      }
    } catch (err) {
      console.warn('[field-map] Load error:', err)
    }
  }, [supabase])

  useEffect(() => { loadPins() }, [loadPins])

  // Quick pin from map click popup — optimistic UI
  async function handleQuickPin(lat: number, lng: number, pinType: string) {
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const tempPin: Pin = {
      id: tempId,
      pin_type: pinType,
      lat, lng,
      label: null, notes: null, color: null,
      metadata: {},
      observed_at: now,
      temp_f: null, wind_speed_mph: null, wind_direction: null,
      pressure_inhg: null, pressure_trend: null,
      moon_phase: null, moon_illumination: null,
    }
    setPins(prev => [tempPin, ...prev])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setPins(prev => prev.filter(p => p.id !== tempId)); return }

      // Fetch conditions in background
      let conditions: Record<string, unknown> = {}
      try {
        const res = await fetch(`/api/journal/conditions?lat=${lat}&lng=${lng}`)
        if (res.ok) conditions = await res.json()
      } catch { /* save without conditions */ }

      const insertData = {
        user_id: user.id,
        pin_type: pinType,
        lat, lng,
        label: null,
        notes: null,
        metadata: {} as import('@/types/database.types').Json,
        observed_at: now,
        temp_f: (conditions.temp_f as number) ?? null,
        wind_speed_mph: (conditions.wind_speed_mph as number) ?? null,
        wind_direction: (conditions.wind_direction as string) ?? null,
        pressure_inhg: (conditions.pressure_inhg as number) ?? null,
        pressure_trend: (conditions.pressure_trend as string) ?? null,
        moon_phase: (conditions.moon_phase as string) ?? null,
        moon_illumination: (conditions.moon_illumination as number) ?? null,
      }

      const { data, error } = await supabase
        .from('journal_pins')
        .insert(insertData)
        .select()
        .single()

      if (!error && data) {
        // Replace temp pin with real DB row
        setPins(prev => prev.map(p => p.id === tempId ? (data as Pin) : p))
      } else {
        console.error('[field-map] Failed to save quick pin:', error?.message, error)
        // Remove temp pin on failure
        setPins(prev => prev.filter(p => p.id !== tempId))
      }
    } catch (err) {
      console.error('[field-map] Quick pin error:', err)
      setPins(prev => prev.filter(p => p.id !== tempId))
    }
  }

  // Save pin from manual form
  async function handleSave() {
    if (!formData.pin_type || formData.lat == null) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let conditions: Record<string, unknown> = {}
      try {
        const res = await fetch(`/api/journal/conditions?lat=${formData.lat}&lng=${formData.lng}`)
        if (res.ok) conditions = await res.json()
      } catch { /* save without conditions */ }

      const insertData = {
        user_id: user.id,
        pin_type: formData.pin_type,
        lat: formData.lat,
        lng: formData.lng!,
        label: formData.label || null,
        notes: formData.notes || null,
        metadata: formData.metadata as import('@/types/database.types').Json,
        observed_at: formData.observed_at || new Date().toISOString(),
        temp_f: (conditions.temp_f as number) ?? null,
        wind_speed_mph: (conditions.wind_speed_mph as number) ?? null,
        wind_direction: (conditions.wind_direction as string) ?? null,
        pressure_inhg: (conditions.pressure_inhg as number) ?? null,
        pressure_trend: (conditions.pressure_trend as string) ?? null,
        moon_phase: (conditions.moon_phase as string) ?? null,
        moon_illumination: (conditions.moon_illumination as number) ?? null,
      }

      const { error } = await supabase.from('journal_pins').insert(insertData)

      if (error) {
        console.error('[field-map] Failed to save pin:', error.message, error)
      } else {
        setFormData(EMPTY_FORM)
        setFormOpen(false)
        await loadPins()
      }
    } finally {
      setSaving(false)
    }
  }

  // Update existing pin (from edit flow)
  async function handleUpdate(id: string, updates: Partial<PinFormData>) {
    const updateData: Record<string, unknown> = {}
    if (updates.label !== undefined) updateData.label = updates.label || null
    if (updates.notes !== undefined) updateData.notes = updates.notes || null
    if (updates.pin_type !== undefined) updateData.pin_type = updates.pin_type
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata as import('@/types/database.types').Json

    const { error } = await supabase
      .from('journal_pins')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      setFormOpen(false)
      setFormData(EMPTY_FORM)
      await loadPins()
    }
  }

  // Delete pin
  async function handleDelete(id: string) {
    await supabase.from('journal_pins').delete().eq('id', id)
    setPins(prev => prev.filter(p => p.id !== id))
    if (selectedId === id) setSelectedId(null)
    if (editingId === id) { setEditingId(null); setFormOpen(false); setFormData(EMPTY_FORM) }
  }

  // Toggle manual form
  function handleFormToggle() {
    if (formOpen) {
      setFormOpen(false)
      setFormData(EMPTY_FORM)
      setEditingId(null)
    } else {
      setFormData({ ...EMPTY_FORM, observed_at: localDatetimeDefault() })
      setFormOpen(true)
      setEditingId(null)
    }
  }

  // Edit existing pin
  function handleEdit(pin: Pin) {
    setFormData({
      pin_type: pin.pin_type,
      label: pin.label ?? '',
      notes: pin.notes ?? '',
      observed_at: pin.observed_at ? pin.observed_at.slice(0, 16) : '',
      lat: pin.lat,
      lng: pin.lng,
      metadata: (pin.metadata ?? {}) as Record<string, unknown>,
    })
    setEditingId(pin.id)
    setFormOpen(true)
    setSelectedId(pin.id)
  }

  // Toggle thermal scent cone for a pin
  async function handleToggleThermalCone(pinId: string) {
    // Toggle off
    if (thermalConeId === pinId) {
      setThermalConeId(null)
      setThermalState(null)
      setThermalCone(null)
      return
    }

    const pin = pins.find(p => p.id === pinId)
    if (!pin) return

    setThermalConeId(pinId)
    setThermalLoading(true)

    try {
      // Fetch live conditions, terrain, and drainage DEM in parallel
      const cacheKey = `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}`
      let terrain = terrainCacheRef.current.get(cacheKey)
      const cachedDrainage = drainageCacheRef.current.get(cacheKey)

      const [conditionsRes, terrainRes] = await Promise.all([
        fetch(`/api/journal/conditions?lat=${pin.lat}&lng=${pin.lng}`).catch(() => null),
        terrain ? Promise.resolve(null) : fetch(`/api/journal/terrain?lat=${pin.lat}&lng=${pin.lng}`).catch(() => null),
      ])

      // Parse live conditions (fall back to pin-stamped data)
      let liveConditions: Record<string, unknown> = {}
      if (conditionsRes?.ok) {
        liveConditions = await conditionsRes.json()
      }

      const windMph = (liveConditions.wind_speed_mph as number) ?? pin.wind_speed_mph ?? 0
      const windDir = (liveConditions.wind_direction as string) ?? pin.wind_direction ?? ''
      const tempF = (liveConditions.temp_f as number) ?? pin.temp_f ?? 50
      const windDirDeg = windDir ? compassToDegrees(windDir) : 0

      // Parse terrain
      if (!terrain && terrainRes?.ok) {
        const data = await terrainRes.json()
        terrain = { slopeDeg: data.slopeDeg, slopeAspectDeg: data.slopeAspectDeg }
      }
      if (!terrain) terrain = { slopeDeg: 10, slopeAspectDeg: 180 }
      terrainCacheRef.current.set(cacheKey, terrain)

      // Compute thermal state with live conditions
      const state = getThermalState({
        lat: pin.lat,
        lng: pin.lng,
        slopeAspectDeg: terrain.slopeAspectDeg,
        slopeDeg: terrain.slopeDeg,
        datetime: new Date(),
        ambientTempF: tempF,
        surfaceWindMph: windMph,
        surfaceWindDirDeg: windDirDeg,
      })

      const { rangeYards, spreadDeg } = getConeParams(windMph, state.mode as ThermalMode)
      const rangeM = rangeYards * 0.9144

      // Determine if we should use terrain-following flow
      const useTerrainFlow = terrain.slopeDeg >= 3 &&
        ['heating', 'cooling', 'transition'].includes(state.mode)

      let bands: ScentConeBand[]
      let isDrainage = false

      if (state.mode === 'pooling') {
        bands = getScentPoolCircle(pin.lat, pin.lng, rangeYards)
      } else if (useTerrainFlow) {
        // Fetch drainage flow (cached if available)
        let drainageBands = cachedDrainage
        if (drainageBands === undefined) {
          const isUphill = state.mode === 'heating'
          const windBiasParam = windMph >= 4 ? `&windBias=${state.thermalDirDeg}` : ''
          const drainageRes = await fetch(
            `/api/journal/drainage?lat=${pin.lat}&lng=${pin.lng}&range=${rangeM}&uphill=${isUphill}${windBiasParam}`,
          ).catch(() => null)

          if (drainageRes?.ok) {
            const drainageData = await drainageRes.json()
            drainageBands = drainageData.bands as ScentConeBand[] | null
          } else {
            drainageBands = null
          }
          drainageCacheRef.current.set(cacheKey, drainageBands)
        }

        if (drainageBands && drainageBands.length > 0) {
          bands = drainageBands
          isDrainage = true
        } else {
          // Fallback to straight cone
          bands = getScentConeBands(pin.lat, pin.lng, state.thermalDirDeg, rangeYards, spreadDeg)
        }
      } else {
        bands = getScentConeBands(pin.lat, pin.lng, state.thermalDirDeg, rangeYards, spreadDeg)
      }

      setThermalState(state)
      setThermalCone({ bands, mode: state.mode as ThermalMode, isDrainage })
    } catch (err) {
      console.error('[field-map] Thermal calc error:', err)
      setThermalConeId(null)
    } finally {
      setThermalLoading(false)
    }
  }

  // Clear thermal cone when pin is deleted
  function handleDeleteWithThermal(id: string) {
    if (thermalConeId === id) {
      setThermalConeId(null)
      setThermalState(null)
      setThermalCone(null)
    }
    handleDelete(id)
  }

  return (
    <div className="flex flex-col lg:flex-row -mx-4 -my-4 -mt-16 sm:-mx-6 sm:-my-6 sm:-mt-18 lg:-m-8 overflow-hidden" style={{ height: '100dvh' }}>
      {/* Map — z-30 keeps it below the mobile sidebar top bar (z-40) */}
      <div className="flex-1 relative min-h-0 z-30">
        <FieldMapDynamic
          pins={pins.filter(p => p.lat != null).map(p => ({
            id: p.id,
            pin_type: p.pin_type,
            lat: p.lat,
            lng: p.lng,
            label: p.label,
            color: p.color,
          }))}
          selectedId={selectedId}
          activeLayer={activeLayer}
          showLandBoundaries={showLandBoundaries}
          thermalCone={thermalCone}
          onQuickPin={handleQuickPin}
          onPinSelect={id => setSelectedId(selectedId === id ? null : id)}
        />
        <LayerSwitcher
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          showLandBoundaries={showLandBoundaries}
          onToggleBoundaries={() => setShowLandBoundaries(v => !v)}
        />
      </div>

      {/* Side Panel */}
      <SidePanel
        pins={pins}
        selectedId={selectedId}
        formOpen={formOpen}
        formData={formData}
        saving={saving}
        editingId={editingId}
        thermalConeId={thermalConeId}
        thermalState={thermalState}
        thermalLoading={thermalLoading}
        onFormToggle={handleFormToggle}
        onFormChange={setFormData}
        onSave={editingId ? () => handleUpdate(editingId, formData) : handleSave}
        onDelete={handleDeleteWithThermal}
        onPinSelect={setSelectedId}
        onEdit={handleEdit}
        onToggleThermalCone={handleToggleThermalCone}
      />
    </div>
  )
}
