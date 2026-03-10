'use client'

import { useEffect, useRef, useCallback } from 'react'
import { buildPinSVG } from '@/lib/field-map/pin-icons'
import { getPinColor } from '@/lib/field-map/pin-types'

export type ScoutPOI = {
  label: string
  lat: number
  lng: number
  type: string
}

export type ExistingPin = {
  id: string
  pin_type: string
  lat: number
  lng: number
  label: string | null
  color: string | null
}

const POI_COLORS: Record<string, string> = {
  emergency: '#ef4444',
  access: '#3b82f6',
  water: '#06b6d4',
  camp: '#f59e0b',
  hazard: '#f97316',
  town: '#6b7280',
  processor: '#d97706',
  // Legacy types (backwards compat with old reports)
  medical: '#ef4444',
  trailhead: '#3b82f6',
  parking: '#22c55e',
  ranger: '#8b5cf6',
}

const POI_LABELS: Record<string, string> = {
  emergency: 'Emergency',
  access: 'Access Point',
  water: 'Water',
  camp: 'Camp',
  hazard: 'Hazard',
  town: 'Town',
  processor: 'Meat Processor',
  medical: 'Emergency',
  trailhead: 'Access Point',
  parking: 'Access Point',
  ranger: 'Emergency',
}

type Props = {
  lat: number
  lng: number
  pois?: ScoutPOI[]
  existingPins?: ExistingPin[]
  onAddPoi?: (poi: ScoutPOI) => void
  highlightedPoi?: { lat: number; lng: number } | null
}

function buildPoiDotSVG(color: string, highlighted = false): string {
  if (highlighted) {
    return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2" stroke-dasharray="4 2"/>
      <circle cx="16" cy="16" r="8" fill="${color}" fill-opacity="1" stroke="#fff" stroke-width="2"/>
    </svg>`
  }
  return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill="${color}" fill-opacity="0.9" stroke="#fff" stroke-width="2"/>
  </svg>`
}

/** Sage-green teardrop SVG for the user's scouted location */
function buildUserMarkerSVG(): string {
  return `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z"
      fill="#7c9a6e" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fff" fill-opacity="0.9"/>
  </svg>`
}

export function LocationScoutMap({ lat, lng, pois = [], existingPins = [], onAddPoi, highlightedPoi }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const poiMarkersRef = useRef<Map<string, import('leaflet').Marker>>(new Map())
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const onAddPoiRef = useRef(onAddPoi)
  onAddPoiRef.current = onAddPoi

  // Highlight POI on map when clicked from the list
  const highlightPoi = useCallback((poi: { lat: number; lng: number } | null) => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    // Reset all POI markers to normal style
    for (const [key, marker] of poiMarkersRef.current) {
      const [, poiType] = key.split('|')
      const color = POI_COLORS[poiType] ?? POI_COLORS.town
      const icon = L.divIcon({
        html: buildPoiDotSVG(color, false),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      marker.setIcon(icon)
    }

    if (!poi) return

    // Find and highlight the matching marker
    const matchKey = [...poiMarkersRef.current.keys()].find(k => {
      const [coords] = k.split('|')
      return coords === `${poi.lat},${poi.lng}`
    })
    if (matchKey) {
      const marker = poiMarkersRef.current.get(matchKey)!
      const [, poiType] = matchKey.split('|')
      const color = POI_COLORS[poiType] ?? POI_COLORS.town
      const icon = L.divIcon({
        html: buildPoiDotSVG(color, true),
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      marker.setIcon(icon)
      marker.openTooltip()
      map.flyTo([poi.lat, poi.lng], 14, { animate: true })
    }
  }, [])

  useEffect(() => {
    let destroyed = false

    if (!containerRef.current || mapRef.current) return

    // Load Leaflet CSS dynamically
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      if (destroyed || !containerRef.current) return
      leafletRef.current = L

      // Clean up stale Leaflet instance (Strict Mode)
      const container = containerRef.current as HTMLElement & { _leaflet_id?: number }
      if (container._leaflet_id != null) {
        mapRef.current?.remove()
        mapRef.current = null
        if (destroyed || !containerRef.current) return
      }

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
      }).setView([lat, lng], 13)

      // Disable double-click zoom so we can use it for "Add to Field Map"
      map.doubleClickZoom.disable()

      // Enable scroll zoom only on hover
      map.getContainer().addEventListener('mouseenter', () => map.scrollWheelZoom.enable())
      map.getContainer().addEventListener('mouseleave', () => map.scrollWheelZoom.disable())

      // USGS topo tiles — same as Field Map
      L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; USGS',
        maxZoom: 16,
      }).addTo(map)

      // User's location — sage-green teardrop
      const userIcon = L.divIcon({
        html: buildUserMarkerSVG(),
        className: 'scout-user-marker',
        iconSize: [28, 38],
        iconAnchor: [14, 38],
        tooltipAnchor: [0, -38],
      })
      const userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map)
      userMarker.bindTooltip('Your Location', { direction: 'top' })

      // Points used for auto-zoom — only user location + scout POIs (not distant field map pins)
      const boundsPoints: [number, number][] = [[lat, lng]]

      // Existing Field Map pins — read-only context at reduced opacity (excluded from bounds)
      for (const pin of existingPins) {
        const color = pin.color ?? getPinColor(pin.pin_type)
        const size = 26
        const svgHtml = buildPinSVG(pin.pin_type, color, size)
        const icon = L.divIcon({
          html: svgHtml,
          className: 'scout-existing-pin',
          iconSize: [size, Math.round(size * 1.35)],
          iconAnchor: [size / 2, Math.round(size * 1.35)],
          tooltipAnchor: [0, -Math.round(size * 1.35) + 4],
        })
        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map)
        if (pin.label) {
          marker.bindTooltip(pin.label, { direction: 'top', permanent: false })
        }
      }

      // POI dots from scout report
      poiMarkersRef.current.clear()
      for (const poi of pois) {
        const color = POI_COLORS[poi.type] ?? POI_COLORS.town
        const icon = L.divIcon({
          html: buildPoiDotSVG(color),
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const marker = L.marker([poi.lat, poi.lng], { icon }).addTo(map)
        marker.bindTooltip(poi.label, { direction: 'top', offset: [0, -10] })
        poiMarkersRef.current.set(`${poi.lat},${poi.lng}|${poi.type}`, marker)

        // Double-click POI dot → popup with "Add to Field Map" button
        marker.on('dblclick', (e: import('leaflet').LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e)
          if (!onAddPoiRef.current) return

          const typeLabel = POI_LABELS[poi.type] ?? poi.type
          const popup = L.popup({
            closeButton: true,
            className: 'scout-poi-popup',
            maxWidth: 240,
            minWidth: 180,
          })
            .setLatLng([poi.lat, poi.lng])
            .setContent(`
              <div style="font-family: system-ui, sans-serif;">
                <div style="font-size: 12px; font-weight: 600; color: #f0ece4; margin-bottom: 2px;">${poi.label}</div>
                <div style="font-size: 10px; color: #a09880; margin-bottom: 8px;">${typeLabel}</div>
                <button class="scout-add-pin-btn" style="
                  width: 100%;
                  padding: 5px 10px;
                  background: #7c9a6e;
                  color: #121210;
                  font-size: 11px;
                  font-weight: 600;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                ">Add to Field Map</button>
              </div>
            `)

          popup.on('add', () => {
            const el = popup.getElement()
            if (!el) return
            el.addEventListener('click', (evt) => {
              const btn = (evt.target as HTMLElement).closest('.scout-add-pin-btn')
              if (btn) {
                map.closePopup(popup)
                onAddPoiRef.current?.(poi)
              }
            })
          })

          popup.openOn(map)
        })

        boundsPoints.push([poi.lat, poi.lng])
      }

      // Fit bounds to user location + scout POIs only (not distant field map pins)
      if (boundsPoints.length > 1) {
        const bounds = L.latLngBounds(boundsPoints.map(p => L.latLng(p[0], p[1])))
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
      }

      mapRef.current = map
    })

    return () => {
      destroyed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update POI markers when pois prop changes (e.g., after scout report loads)
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    // Remove old POI markers
    for (const marker of poiMarkersRef.current.values()) {
      marker.remove()
    }
    poiMarkersRef.current.clear()

    if (!pois.length) return

    const boundsPoints: [number, number][] = [[lat, lng]]

    for (const poi of pois) {
      const color = POI_COLORS[poi.type] ?? POI_COLORS.town
      const icon = L.divIcon({
        html: buildPoiDotSVG(color),
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const marker = L.marker([poi.lat, poi.lng], { icon }).addTo(map)
      marker.bindTooltip(poi.label, { direction: 'top', offset: [0, -10] })
      poiMarkersRef.current.set(`${poi.lat},${poi.lng}|${poi.type}`, marker)

      marker.on('dblclick', (e: import('leaflet').LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        if (!onAddPoiRef.current) return

        const typeLabel = POI_LABELS[poi.type] ?? poi.type
        const popup = L.popup({
          closeButton: true,
          className: 'scout-poi-popup',
          maxWidth: 240,
          minWidth: 180,
        })
          .setLatLng([poi.lat, poi.lng])
          .setContent(`
            <div style="font-family: system-ui, sans-serif;">
              <div style="font-size: 12px; font-weight: 600; color: #f0ece4; margin-bottom: 2px;">${poi.label}</div>
              <div style="font-size: 10px; color: #a09880; margin-bottom: 8px;">${typeLabel}</div>
              <button class="scout-add-pin-btn" style="
                width: 100%;
                padding: 5px 10px;
                background: #7c9a6e;
                color: #121210;
                font-size: 11px;
                font-weight: 600;
                border: none;
                border-radius: 5px;
                cursor: pointer;
              ">Add to Field Map</button>
            </div>
          `)

        popup.on('add', () => {
          const el = popup.getElement()
          if (!el) return
          el.addEventListener('click', (evt) => {
            const btn = (evt.target as HTMLElement).closest('.scout-add-pin-btn')
            if (btn) {
              map.closePopup(popup)
              onAddPoiRef.current?.(poi)
            }
          })
        })

        popup.openOn(map)
      })

      boundsPoints.push([poi.lat, poi.lng])
    }

    // Re-fit bounds to include new POIs
    if (boundsPoints.length > 1) {
      const bounds = L.latLngBounds(boundsPoints.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
    }
  }, [pois, lat, lng])

  // React to highlightedPoi changes
  useEffect(() => {
    highlightPoi(highlightedPoi ?? null)
  }, [highlightedPoi, highlightPoi])

  return (
    <div className="relative rounded-lg overflow-hidden border border-default mt-2" style={{ height: '200px' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        .scout-user-marker {
          background: none !important;
          border: none !important;
        }
        .scout-existing-pin {
          background: none !important;
          border: none !important;
          opacity: 0.5;
        }
        .scout-poi-popup .leaflet-popup-content-wrapper {
          background: rgba(18, 18, 16, 0.95) !important;
          color: #f0ece4 !important;
          border: 1px solid rgba(200, 190, 170, 0.22) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
        }
        .scout-poi-popup .leaflet-popup-content {
          margin: 10px 12px !important;
        }
        .scout-poi-popup .leaflet-popup-tip {
          background: rgba(18, 18, 16, 0.95) !important;
        }
        .scout-poi-popup .leaflet-popup-close-button {
          color: #a09880 !important;
          font-size: 18px !important;
          top: 4px !important;
          right: 6px !important;
        }
        .scout-poi-popup .leaflet-popup-close-button:hover {
          color: #f0ece4 !important;
        }
        .scout-add-pin-btn:hover {
          background: #8faf80 !important;
        }
      `}} />
    </div>
  )
}
