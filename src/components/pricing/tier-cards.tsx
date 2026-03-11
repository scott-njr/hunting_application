'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ALL_MODULES, MODULE_TIER_LABELS, type ModuleSlug, type ModuleTier } from '@/lib/modules'
import { Crosshair, Target, Shield, Heart, Fish, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/components/auth/auth-modal-provider'

const MODULE_ICONS: Record<ModuleSlug, React.ElementType> = {
  hunting: Crosshair,
  archery: Target,
  firearms: Shield,
  medical: Heart,
  fishing: Fish,
  fitness: Dumbbell,
}

const TIERS: ModuleTier[] = ['free', 'basic', 'pro']

const TIER_PRICES: Record<ModuleTier, { amount: string; period: string }> = {
  free: { amount: '$0', period: 'forever' },
  basic: { amount: '$9', period: '/mo' },
  pro: { amount: '$19', period: '/mo' },
}

interface TierCardsProps {
  onTierChanged?: () => void
}

export function TierCards({ onTierChanged }: TierCardsProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const { openAuthModal } = useAuthModal()
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedTiers, setSavedTiers] = useState<Record<string, ModuleTier>>({})
  const [pendingTiers, setPendingTiers] = useState<Record<string, ModuleTier>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      setLoggedIn(true)
      // module_subscriptions not in generated types — cast to bypass
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(supabase as any)
        .from('module_subscriptions')
        .select('module_slug, tier, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .then(({ data }: { data: { module_slug: string; tier: string; status: string }[] | null }) => {
          const tiers: Record<string, ModuleTier> = {}
          for (const row of data ?? []) {
            tiers[row.module_slug] = row.tier as ModuleTier
          }
          setSavedTiers(tiers)
          setPendingTiers(tiers)
          setLoading(false)
        })
    })
  }, [])

  // Check if there are unsaved changes
  const hasChanges = ALL_MODULES.some(mod => {
    const saved = savedTiers[mod.slug] ?? 'free'
    const pending = pendingTiers[mod.slug] ?? 'free'
    return saved !== pending
  })

  // Count changed modules for the save button label
  const changeCount = ALL_MODULES.filter(mod => {
    const saved = savedTiers[mod.slug] ?? 'free'
    const pending = pendingTiers[mod.slug] ?? 'free'
    return saved !== pending
  }).length

  async function saveAllChanges() {
    setSaving(true)
    setError(null)
    try {
      const changedModules = ALL_MODULES.filter(mod => {
        const saved = savedTiers[mod.slug] ?? 'free'
        const pending = pendingTiers[mod.slug] ?? 'free'
        return saved !== pending
      })

      const results = await Promise.all(
        changedModules.map(mod =>
          fetch('/api/subscriptions/select-tier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: mod.slug, tier: pendingTiers[mod.slug] ?? 'free' }),
          })
        )
      )

      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        const errBody = await failed[0].json().catch(() => null)
        const detail = errBody?.error ?? `HTTP ${failed[0].status}`
        console.error('[tier-cards] save failed:', detail)
        setPendingTiers({ ...savedTiers })
        setError(`Failed to save: ${detail}`)
        return
      }

      setSavedTiers({ ...pendingTiers })

      if (onTierChanged) {
        onTierChanged()
        return
      }
      if (redirectTo) {
        window.location.href = redirectTo
        return
      }
      router.refresh()
    } catch {
      setPendingTiers({ ...savedTiers })
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 mb-12">
      {/* Tier column headers */}
      <div className="hidden sm:grid grid-cols-[1fr_repeat(3,100px)] gap-2 px-4">
        <div />
        {TIERS.map(t => (
          <div key={t} className="text-center">
            <p className="text-primary text-sm font-semibold">{MODULE_TIER_LABELS[t]}</p>
            <p className="text-muted text-xs">
              {TIER_PRICES[t].amount}<span className="text-muted/60">{TIER_PRICES[t].period}</span>
            </p>
          </div>
        ))}
      </div>
      {/* Mobile tier header */}
      <div className="flex sm:hidden justify-between px-4">
        {TIERS.map(t => (
          <div key={t} className="text-center flex-1">
            <p className="text-primary text-xs font-semibold">{MODULE_TIER_LABELS[t]}</p>
            <p className="text-muted text-xs">
              {TIER_PRICES[t].amount}<span className="text-muted/60">{TIER_PRICES[t].period}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Module rows */}
      {ALL_MODULES.map(mod => {
        const Icon = MODULE_ICONS[mod.slug]
        const savedTier = savedTiers[mod.slug] ?? 'free'
        const pendingTier = pendingTiers[mod.slug] ?? 'free'

        return (
          <div
            key={mod.slug}
            className={cn(
              'grid grid-cols-3 sm:grid-cols-[1fr_repeat(3,100px)] gap-2 items-center rounded-lg border p-4',
              pendingTier !== savedTier
                ? 'border-accent/40 bg-accent/5'
                : 'border-subtle bg-surface',
            )}
          >
            <div className="flex items-center gap-3 min-w-0 col-span-3 sm:col-span-1">
              <Icon className="h-5 w-5 text-accent flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-primary text-sm font-semibold">{mod.name}</p>
                <p className="text-muted text-xs truncate">{mod.description}</p>
              </div>
            </div>

            {TIERS.map(t => {
              const isSelected = pendingTier === t
              const isSaved = savedTier === t

              if (loading) {
                return <div key={t} className="h-8 rounded bg-elevated animate-pulse" />
              }

              if (!loggedIn) {
                return (
                  <button
                    key={t}
                    onClick={() => openAuthModal('signup')}
                    className="h-8 sm:h-8 min-h-[44px] sm:min-h-0 flex items-center justify-center rounded text-xs font-medium bg-elevated hover:bg-strong text-secondary hover:text-primary transition-colors"
                  >
                    Sign Up
                  </button>
                )
              }

              return (
                <button
                  key={t}
                  disabled={saving}
                  onClick={() => setPendingTiers(prev => ({ ...prev, [mod.slug]: t }))}
                  className={cn(
                    'h-8 sm:h-8 min-h-[44px] sm:min-h-0 rounded text-xs font-medium transition-colors',
                    isSelected && isSaved
                      ? 'bg-accent/15 text-accent cursor-default'
                      : isSelected && !isSaved
                        ? 'bg-accent/25 text-accent ring-1 ring-accent/40'
                        : 'bg-elevated hover:bg-strong text-secondary hover:text-primary',
                    saving && 'opacity-50'
                  )}
                >
                  {isSelected && isSaved ? 'Current' : isSelected ? MODULE_TIER_LABELS[t] : 'Select'}
                </button>
              )
            })}
          </div>
        )
      })}

      {/* Error message */}
      {error && (
        <div className="mx-4 p-3 bg-red-950/30 border border-red-500/20 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Save button */}
      {loggedIn && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={saveAllChanges}
            disabled={!hasChanges || saving}
            className={cn(
              'px-8 py-3 rounded-lg text-sm font-semibold transition-all',
              hasChanges
                ? 'bg-accent text-base hover:bg-accent-hover cursor-pointer'
                : 'bg-elevated text-muted cursor-not-allowed',
              saving && 'opacity-50'
            )}
          >
            {saving
              ? 'Saving...'
              : hasChanges
                ? `Save Changes (${changeCount} module${changeCount !== 1 ? 's' : ''})`
                : 'No Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
