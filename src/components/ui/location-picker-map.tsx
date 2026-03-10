'use client'

import { useEffect, useRef } from 'react'

type Props = {
  lat?: number | null
  lng?: number | null
  /** Called when user clicks map or moves marker — receives 6-decimal-precision coords */
  onPick: (lat: number, lng: number) => void
  /** Default center when no coords given; defaults to central Colorado */
  defaultCenter?: [number, number]
  zoom?: number
}

export function LocationPickerMap({
  lat,
  lng,
  onPick,
  defaultCenter = [39.0, -105.5],
  zoom = 7,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)

  useEffect(() => {
    // Guard against Strict Mode double-invoke: if cleanup runs before the
    // async Leaflet import resolves, the `destroyed` flag prevents init.
    let destroyed = false

    if (!containerRef.current || mapRef.current) return

    // Load Leaflet CSS dynamically (avoids SSR issues)
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      // Bail out if the component unmounted before the import resolved
      if (destroyed || !containerRef.current) return

      // Clean up a stale Leaflet instance on the same container (Strict Mode)
      const container = containerRef.current as HTMLElement & { _leaflet_id?: number }
      if (container._leaflet_id != null) {
        mapRef.current?.remove()
        mapRef.current = null
        markerRef.current = null
        // Re-check after cleanup — component may have unmounted during remove()
        if (destroyed || !containerRef.current) return
      }

      // Fix webpack/Next.js icon URL issue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center: [number, number] = lat != null && lng != null ? [lat, lng] : defaultCenter
      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(center, zoom)

      // Enable scroll zoom only while cursor is inside the map
      map.getContainer().addEventListener('mouseenter', () => map.scrollWheelZoom.enable())
      map.getContainer().addEventListener('mouseleave', () => map.scrollWheelZoom.disable())

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      // Restore existing pin
      if (lat != null && lng != null) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng()
          onPick(round(pos.lat), round(pos.lng))
        })
      }

      // Click to place / move marker and zoom to it
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng])
        } else {
          markerRef.current = L.marker([clickLat, clickLng], { draggable: true }).addTo(map)
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng()
            onPick(round(pos.lat), round(pos.lng))
          })
        }
        // Zoom to the dropped pin if currently zoomed out
        const targetZoom = Math.max(map.getZoom(), 12)
        map.flyTo([clickLat, clickLng], targetZoom, { animate: true, duration: 0.5 })
        onPick(round(clickLat), round(clickLng))
      })

      mapRef.current = map
    })

    return () => {
      destroyed = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative rounded-lg overflow-hidden border border-default" style={{ height: '220px' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <p className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none
                    bg-surface/80 text-secondary text-xs px-2 py-0.5 rounded">
        Click to drop a pin · Drag to adjust
      </p>
    </div>
  )
}

function round(n: number) {
  return Math.round(n * 1_000_000) / 1_000_000
}
