'use client'

import dynamic from 'next/dynamic'

// Leaflet requires `window` — must be loaded client-side only
export const FieldMapDynamic = dynamic(
  () => import('./field-map').then(mod => mod.FieldMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-base">
        <p className="text-sm text-muted">Loading map…</p>
      </div>
    ),
  }
)
