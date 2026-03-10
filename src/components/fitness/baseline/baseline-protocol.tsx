import { Info } from 'lucide-react'

export function BaselineProtocol() {
  return (
    <div className="rounded-lg border border-subtle bg-surface p-4 space-y-2 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <Info className="h-4 w-4 text-muted" />
        <span className="text-secondary text-sm font-medium">Test Protocol</span>
      </div>
      <p className="text-muted text-xs mb-3">
        Complete all four events in order with 2 minutes rest between each.
      </p>
      <div className="flex items-center gap-3 rounded bg-elevated p-3 border border-subtle">
        <span className="text-accent font-bold text-lg w-6 text-center">1</span>
        <div>
          <div className="text-accent font-semibold">Max Pullups</div>
          <div className="text-muted">Max unbroken reps</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded bg-elevated p-3 border border-subtle">
        <span className="text-accent font-bold text-lg w-6 text-center">2</span>
        <div>
          <div className="text-accent font-semibold">Max Pushups</div>
          <div className="text-muted">2 minutes</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded bg-elevated p-3 border border-subtle">
        <span className="text-accent font-bold text-lg w-6 text-center">3</span>
        <div>
          <div className="text-accent font-semibold">Max Situps</div>
          <div className="text-muted">2 minutes</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded bg-elevated p-3 border border-subtle">
        <span className="text-accent font-bold text-lg w-6 text-center">4</span>
        <div>
          <div className="text-accent font-semibold">2-Mile Run</div>
          <div className="text-muted">Run for time</div>
        </div>
      </div>
    </div>
  )
}
