'use client'

export const INPUT_CLASS = "bg-elevated border border-default text-primary rounded px-3 py-2 text-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-ring placeholder:text-muted"

export function Chip({ value, label, selected, onToggle }: { value: string; label: string; selected: boolean; onToggle: (v: string) => void }) {
  return (
    <button type="button" onClick={() => onToggle(value)}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
        selected
          ? 'bg-green-600/20 border-accent text-accent-hover'
          : 'bg-elevated border-default text-secondary hover:border-strong hover:text-primary'
      }`}>
      {label}
    </button>
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-subtle" />
      <span className="text-muted text-xs uppercase tracking-wider">{label}</span>
      <div className="h-px flex-1 bg-subtle" />
    </div>
  )
}

export function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-4 mb-2">
      <div className="h-px flex-1 bg-accent/30" />
      <span className="text-accent text-xs font-semibold uppercase tracking-wider">{label}</span>
      <div className="h-px flex-1 bg-accent/30" />
    </div>
  )
}
