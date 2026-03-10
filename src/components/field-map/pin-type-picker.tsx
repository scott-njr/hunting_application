'use client'

import { cn } from '@/lib/utils'
import { PIN_TYPES, PIN_GROUPS, type PinGroup } from '@/lib/field-map/pin-types'

type Props = {
  value: string
  onChange: (pinType: string) => void
}

export function PinTypePicker({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      {PIN_GROUPS.map(group => {
        const items = PIN_TYPES.filter(p => p.group === group)
        if (items.length === 0) return null

        return (
          <div key={group}>
            <p className="text-xs text-muted uppercase tracking-wide mb-1.5">{group}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(pin => (
                <button
                  key={pin.value}
                  type="button"
                  onClick={() => onChange(pin.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors border',
                    value === pin.value
                      ? 'border-accent-border bg-accent-dim text-primary'
                      : 'border-subtle bg-elevated text-secondary hover:text-primary hover:border-default'
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: pin.color }}
                  />
                  {pin.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
