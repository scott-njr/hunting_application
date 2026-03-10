'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectOption = {
  value: string
  label: string
}

type TacticalSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TacticalSelect({
  value,
  onChange,
  options,
  placeholder = '— Select —',
  className,
  disabled = false,
}: TacticalSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-sm transition-colors text-left',
          'bg-elevated border text-primary',
          open
            ? 'border-accent ring-1 ring-accent'
            : 'border-default hover:border-strong',
          disabled && 'opacity-50 cursor-not-allowed',
          !selected && 'text-muted'
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-muted shrink-0 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-default rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors',
                opt.value === value
                  ? 'bg-elevated text-primary'
                  : 'text-secondary hover:bg-elevated hover:text-primary'
              )}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check className="h-3.5 w-3.5 text-accent-hover shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
