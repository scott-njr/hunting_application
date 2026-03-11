'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getPinColor } from '@/lib/field-map/pin-types'
import { buildPinSVG, buildSelectedPinSVG } from '@/lib/field-map/pin-icons'
import { buildQuickPinHTML } from '@/lib/field-map/quick-pin-html'
import type { ThermalMode } from '@/lib/field-map/thermals'

type MapLayer = 'topo' | 'satellite' | 'hybrid'

const THERMAL_COLORS: Record<ThermalMode, string> = {
  heating: '#22c55e',
  cooling: '#22c55e',
  wind_override: '#ef4444',
  wind_flat: '#ef4444',
  transition: '#f59e0b',
  neutral: '#6b7280',
  pooling: '#8b5cf6',
}

const TILE_URLS: Record<MapLayer, string> = {
  topo: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
  satellite: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
  hybrid: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
}

const BLM_TILE_URL = 'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_with_PriUnk/MapServer/tile/{z}/{y}/{x}'

export type FieldMapPin = {
  id: string
  pin_type: string
  lat: number
  lng: number
  label: string | null
  color: string | null
}

export type ThermalConeData = {
  bands: Array<{ coordinates: [number, number][]; opacity: number }>
  mode: ThermalMode
  isDrainage?: boolean
}

/** Teal color for terrain-following drainage flow */
const DRAINAGE_COLOR = '#3b9a8e'

type Props = {
  pins: FieldMapPin[]
  selectedId: string | null
  activeLayer: MapLayer
  showLandBoundaries: boolean
  thermalCone: ThermalConeData | null
  onQuickPin: (lat: number, lng: number, pinType: string) => void
  onPinSelect: (id: string) => void
}

export function FieldMap({
  pins,
  selectedId,
  activeLayer,
  showLandBoundaries,
  thermalCone,
  onQuickPin,
  onPinSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseLayerRef = useRef<L.TileLayer | null>(null)
  const blmLayerRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const thermalLayerRef = useRef<L.LayerGroup | null>(null)

  // Store latest callbacks in refs so map event handlers always see current values
  const onQuickPinRef = useRef(onQuickPin)
  const onPinSelectRef = useRef(onPinSelect)
  useEffect(() => {
    onQuickPinRef.current = onQuickPin
    onPinSelectRef.current = onPinSelect
  }, [onQuickPin, onPinSelect])

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      maxZoom: 20,
    }).setView([39.0, -105.5], 7)

    baseLayerRef.current = L.tileLayer(TILE_URLS.topo, {
      attribution: '&copy; USGS',
      maxNativeZoom: 16,
      maxZoom: 20,
    }).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)

    // Custom pane for thermal cones — between tiles (200) and markers (600)
    const thermalPane = map.createPane('thermal')
    thermalPane.style.zIndex = '450'
    thermalLayerRef.current = L.layerGroup([], { pane: 'thermal' }).addTo(map)

    // Long-press (500ms hold) → open quick-pin popup (mouse + touch)
    let longPressTimer: ReturnType<typeof setTimeout> | null = null
    let longPressLatLng: L.LatLng | null = null

    function clearLongPress() {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
      longPressLatLng = null
    }

    function startLongPress(latlng: L.LatLng) {
      longPressLatLng = latlng
      longPressTimer = setTimeout(() => {
        if (!longPressLatLng) return
        const roundedLat = Math.round(longPressLatLng.lat * 1_000_000) / 1_000_000
        const roundedLng = Math.round(longPressLatLng.lng * 1_000_000) / 1_000_000

        const popup = L.popup({
          closeButton: true,
          className: 'field-map-quickpin-popup',
          maxWidth: 320,
          minWidth: 260,
        })
          .setLatLng([roundedLat, roundedLng])
          .setContent(buildQuickPinHTML())

        popup.on('add', () => {
          const el = popup.getElement()
          if (!el) return
          el.addEventListener('click', (evt) => {
            const btn = (evt.target as HTMLElement).closest('[data-pin-type]')
            if (btn) {
              const pinType = btn.getAttribute('data-pin-type')!
              map.closePopup(popup)
              onQuickPinRef.current(roundedLat, roundedLng, pinType)
            }
          })
        })

        popup.openOn(map)
        longPressTimer = null
        longPressLatLng = null
      }, 500)
    }

    // Mouse events (desktop)
    map.on('mousedown', (e: L.LeafletMouseEvent) => startLongPress(e.latlng))
    map.on('mouseup', clearLongPress)
    map.on('mousemove', clearLongPress)

    // Touch events (mobile) — Leaflet doesn't fire mousedown/mouseup on touch
    const container = map.getContainer()
    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      const point = map.containerPointToLatLng(L.point(touch.clientX - container.getBoundingClientRect().left, touch.clientY - container.getBoundingClientRect().top))
      startLongPress(point)
    }
    function handleTouchEnd() { clearLongPress() }
    function handleTouchMove() { clearLongPress() }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchmove', handleTouchMove)

    mapRef.current = map

    // Leaflet needs a tick for the container to have final dimensions
    requestAnimationFrame(() => {
      map.invalidateSize()
    })

    // Watch for container resizes (e.g. side panel collapse/expand) and fix Leaflet sizing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchmove', handleTouchMove)
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      baseLayerRef.current = null
      blmLayerRef.current = null
      markersRef.current = null
      thermalLayerRef.current = null
    }
  }, [])

  // Switch base layer
  useEffect(() => {
    const map = mapRef.current
    if (!map || !baseLayerRef.current) return

    map.removeLayer(baseLayerRef.current)
    baseLayerRef.current = L.tileLayer(TILE_URLS[activeLayer], {
      attribution: '&copy; USGS',
      maxNativeZoom: 16,
      maxZoom: 20,
    }).addTo(map)

    // Ensure BLM stays on top if active
    if (blmLayerRef.current) {
      blmLayerRef.current.bringToFront()
    }
    // Markers (divIcons) are in a pane above tiles, no bringToFront needed
  }, [activeLayer])

  // Toggle BLM land boundaries
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (showLandBoundaries && !blmLayerRef.current) {
      blmLayerRef.current = L.tileLayer(BLM_TILE_URL, {
        attribution: '&copy; BLM',
        maxNativeZoom: 16,
        maxZoom: 20,
        opacity: 0.5,
      }).addTo(map)
    } else if (!showLandBoundaries && blmLayerRef.current) {
      map.removeLayer(blmLayerRef.current)
      blmLayerRef.current = null
    }
  }, [showLandBoundaries])

  // Update pin markers
  useEffect(() => {
    const map = mapRef.current
    const group = markersRef.current
    if (!map || !group) return

    group.clearLayers()

    pins.forEach(pin => {
      const isSelected = pin.id === selectedId
      const color = pin.color ?? getPinColor(pin.pin_type)

      const size = isSelected ? 38 : 32
      const svgHtml = isSelected
        ? buildSelectedPinSVG(pin.pin_type, color, size)
        : buildPinSVG(pin.pin_type, color, size)

      const icon = L.divIcon({
        html: svgHtml,
        className: 'field-map-pin-icon',
        iconSize: [size, Math.round(size * 1.35)],
        iconAnchor: [size / 2, Math.round(size * 1.35)],
        tooltipAnchor: [0, -Math.round(size * 1.35) + 4],
      })

      const marker = L.marker([pin.lat, pin.lng], { icon })

      if (pin.label) {
        marker.bindTooltip(pin.label, {
          permanent: false,
          direction: 'top',
          className: 'field-map-pin-tooltip',
        })
      }

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        onPinSelectRef.current(pin.id)
      })

      group.addLayer(marker)
    })
  }, [pins, selectedId])

  // Render thermal scent cone
  useEffect(() => {
    const group = thermalLayerRef.current
    if (!group) return

    group.clearLayers()

    if (!thermalCone) return

    const fillColor = thermalCone.isDrainage ? DRAINAGE_COLOR : THERMAL_COLORS[thermalCone.mode]

    thermalCone.bands.forEach(band => {
      const polygon = L.polygon(band.coordinates, {
        fillColor,
        fillOpacity: band.opacity,
        color: fillColor,
        weight: 1,
        opacity: band.opacity + 0.1,
        pane: 'thermal',
      })
      group.addLayer(polygon)
    })
  }, [thermalCone])

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .field-map-pin-icon {
          background: none !important;
          border: none !important;
        }
        .field-map-pin-tooltip {
          background: rgba(18, 18, 16, 0.9) !important;
          color: #f0ece4 !important;
          border: 1px solid rgba(200, 190, 170, 0.22) !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          padding: 2px 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        .field-map-pin-tooltip::before {
          border-top-color: rgba(18, 18, 16, 0.9) !important;
        }
        .field-map-quickpin-popup .leaflet-popup-content-wrapper {
          background: rgba(18, 18, 16, 0.95) !important;
          color: #f0ece4 !important;
          border: 1px solid rgba(200, 190, 170, 0.22) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
        }
        .field-map-quickpin-popup .leaflet-popup-content {
          margin: 10px 12px !important;
        }
        .field-map-quickpin-popup .leaflet-popup-tip {
          background: rgba(18, 18, 16, 0.95) !important;
        }
        .field-map-quickpin-popup .leaflet-popup-close-button {
          color: #a09880 !important;
          font-size: 18px !important;
          top: 4px !important;
          right: 6px !important;
        }
        .field-map-quickpin-popup .leaflet-popup-close-button:hover {
          color: #f0ece4 !important;
        }
      `}} />
    </div>
  )
}
