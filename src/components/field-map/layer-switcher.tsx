'use client'

import { cn } from '@/lib/utils'
import { Layers, Map } from 'lucide-react'

type MapLayer = 'topo' | 'satellite' | 'hybrid'

type Props = {
  activeLayer: MapLayer
  onLayerChange: (layer: MapLayer) => void
  showLandBoundaries: boolean
  onToggleBoundaries: () => void
}

const LAYERS: { value: MapLayer; label: string }[] = [
  { value: 'topo', label: 'Topo' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'hybrid', label: 'Hybrid' },
]

export function LayerSwitcher({ activeLayer, onLayerChange, showLandBoundaries, onToggleBoundaries }: Props) {
  return (
    <div className="absolute top-3 right-3 z-[1000] bg-surface/90 backdrop-blur border border-subtle rounded-lg p-2 space-y-2">
      {/* Base layer toggle */}
      <div className="flex gap-1">
        {LAYERS.map(l => (
          <button
            key={l.value}
            onClick={() => onLayerChange(l.value)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              activeLayer === l.value
                ? 'bg-accent-dim text-accent-hover border border-accent-border'
                : 'bg-elevated text-secondary border border-subtle hover:text-primary'
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Land boundaries toggle */}
      <button
        onClick={onToggleBoundaries}
        className={cn(
          'flex items-center gap-1.5 w-full px-2 py-1 rounded text-xs transition-colors',
          showLandBoundaries
            ? 'bg-accent-dim text-accent-hover border border-accent-border'
            : 'bg-elevated text-secondary border border-subtle hover:text-primary'
        )}
      >
        {showLandBoundaries ? <Layers className="h-3 w-3" /> : <Map className="h-3 w-3" />}
        Land Boundaries
      </button>
    </div>
  )
}
