'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutGrid, LayoutDashboard, ChevronDown, Check,
  Crosshair, Target, Shield, Heart, Fish, Dumbbell, Tent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ALL_MODULES, type ModuleSlug } from '@/lib/modules'

const MODULE_ICONS: Record<ModuleSlug, React.ElementType> = {
  hunting: Crosshair,
  archery: Target,
  firearms: Shield,
  medical: Heart,
  fishing: Fish,
  fitness: Dumbbell,
}

const MODULE_NAMES: Record<ModuleSlug, string> = {
  hunting: 'Hunting',
  archery: 'Archery',
  firearms: 'Firearms',
  medical: 'Medical',
  fishing: 'Fishing',
  fitness: 'Fitness',
}

/** First authenticated page per module — avoids landing on the public Nav2 page */
const MODULE_NAV_ENTRY: Record<ModuleSlug, string> = {
  hunting: '/hunting/my-hunts',
  archery: '/archery/my-archery',
  firearms: '/firearms/my-firearms',
  medical: '/medical/my-medical',
  fishing: '/fishing/my-fishing',
  fitness: '/fitness/my-plan',
}

export { MODULE_ICONS, MODULE_NAMES, MODULE_NAV_ENTRY }

interface ModuleSwitcherProps {
  /** Current module slug, or null when on Command Center / Admin */
  currentModule: ModuleSlug | null
  /** Called when user taps a link — parent should close mobile menu etc. */
  onNavigate?: () => void
  /** Override entry hrefs per module (used by ModuleSidebar which reads MODULE_NAV) */
  moduleHrefs?: Partial<Record<ModuleSlug, string>>
  /** Override the display label (e.g. "Admin Panel" instead of "Command Center") */
  label?: string
  /** Override the icon shown for the current selection */
  icon?: React.ElementType
}

export function ModuleSwitcher({ currentModule, onNavigate, moduleHrefs, label, icon }: ModuleSwitcherProps) {
  const [open, setOpen] = useState(false)

  const CurrentIcon = icon ?? (currentModule ? MODULE_ICONS[currentModule] : LayoutDashboard)
  const currentLabel = label ?? (currentModule ? MODULE_NAMES[currentModule] : 'Command Center')

  function handleLinkClick() {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full bg-elevated border border-default rounded px-3 py-2 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <CurrentIcon className="h-3.5 w-3.5 text-accent-hover" />
          <span className="text-primary text-sm font-medium">{currentLabel}</span>
        </div>
        <div className="flex items-center gap-1 text-muted group-hover:text-secondary transition-colors">
          <LayoutGrid className="h-3 w-3" />
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <>
          {/* Invisible overlay to close dropdown on tap outside */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-default rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Command Center link (only shown when inside a module) */}
            {currentModule && (
              <>
                <Link
                  href="/home"
                  onClick={handleLinkClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-primary transition-colors min-h-[44px]"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Command Center</span>
                </Link>
                <div className="border-t border-subtle mx-2 my-1" />
              </>
            )}

            <div className="px-3 pt-1 pb-1">
              <p className="text-muted text-xs uppercase tracking-wide font-medium">Switch Module</p>
            </div>

            {ALL_MODULES.map(mod => {
              const Icon = MODULE_ICONS[mod.slug as ModuleSlug] ?? Tent
              const isCurrent = mod.slug === currentModule
              const href = moduleHrefs?.[mod.slug as ModuleSlug]
                ?? MODULE_NAV_ENTRY[mod.slug as ModuleSlug]

              if (!mod.isActive && !isCurrent) {
                return (
                  <div
                    key={mod.slug}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{MODULE_NAMES[mod.slug as ModuleSlug]}</span>
                      <span className="text-xs text-muted bg-elevated rounded px-1">soon</span>
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={mod.slug}
                  href={href}
                  onClick={handleLinkClick}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors min-h-[44px]',
                    isCurrent
                      ? 'text-accent-hover bg-accent-dim'
                      : 'text-secondary hover:bg-elevated hover:text-primary'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{MODULE_NAMES[mod.slug as ModuleSlug]}</span>
                  </div>
                  {isCurrent && <Check className="h-3 w-3" />}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
