'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TierCards } from '@/components/pricing/tier-cards'
import { MODULE_TIER_RANK, MODULE_TIER_LABELS, type ModuleTier } from '@/lib/modules'

const TIER_PRICES: Record<ModuleTier, string> = {
  free: '$0',
  basic: '$9',
  pro: '$19',
}

interface SubscriptionState {
  highestTier: ModuleTier
  hasActiveSub: boolean
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subState, setSubState] = useState<SubscriptionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const loadSubscriptions = useCallback(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
        return
      }
      supabase
        .from('module_subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .then(({ data }: { data: { tier: string; status: string }[] | null }) => {
          let highestTier: ModuleTier = 'free'
          for (const row of data ?? []) {
            const t = row.tier as ModuleTier
            if (MODULE_TIER_RANK[t] > MODULE_TIER_RANK[highestTier]) highestTier = t
          }
          setSubState({
            highestTier,
            hasActiveSub: (data ?? []).some(r => r.tier !== 'free'),
          })
          setLoading(false)
        })
    })
  }, [router])

  useEffect(() => { loadSubscriptions() }, [loadSubscriptions])

  async function handleCancelSubscription() {
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch('/api/subscriptions/cancel-all', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setCancelError(data.error ?? 'Failed to cancel subscription')
        return
      }
      setSubState({ highestTier: 'free', hasActiveSub: false })
      setShowCancelConfirm(false)
      router.refresh()
    } catch {
      setCancelError('Network error — please try again')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-elevated rounded" />
        <div className="h-40 bg-elevated rounded-lg" />
      </div>
    )
  }

  if (!subState) return null

  const currentTier = subState.highestTier
  const isPaid = subState.hasActiveSub

  return (
    <div>
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <h1 className="text-2xl font-bold mb-1">Subscription</h1>
        <p className="text-secondary text-sm mb-8">Manage your module plans and billing.</p>

        {/* Current global tier summary */}
        <div className="border border-accent/30 bg-accent/5 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Account Tier</p>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-primary">{MODULE_TIER_LABELS[currentTier]}</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/15 px-2 py-0.5 rounded">
                  {isPaid ? 'Active' : 'Free'}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">Your account tier is the highest of your module tiers.</p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {TIER_PRICES[currentTier]}
              <span className="text-sm text-muted font-normal">{currentTier === 'free' ? '' : '/mo'}</span>
            </p>
          </div>

          <div className="bg-base/50 rounded-lg p-3">
            <p className="text-xs text-muted mb-0.5">Status</p>
            <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-accent" />
              {isPaid ? 'Active' : 'Free'}
            </p>
            <p className="text-xs text-muted mt-1">AI query usage is tracked per module.</p>
          </div>
        </div>

        {/* Module tier cards */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-primary mb-4">Module Plans</h3>
          <p className="text-xs text-muted mb-4">Select a tier for each module. Your account tier auto-syncs to the highest module tier.</p>
          <Suspense fallback={<div className="h-40 animate-pulse bg-elevated rounded-lg" />}>
            <TierCards onTierChanged={() => loadSubscriptions()} />
          </Suspense>
        </div>

        {/* Cancel subscription */}
        {isPaid && (
          <div className="border border-subtle rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-1">Cancel All Subscriptions</h3>
                <p className="text-xs text-muted">
                  You&apos;ll lose access to all paid features and revert to Free on every module.
                </p>
              </div>
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-muted hover:text-red-400 transition-colors flex-shrink-0"
                >
                  Cancel All
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="text-xs text-muted hover:text-secondary transition-colors"
                    disabled={cancelling}
                  >
                    Keep Plans
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="text-xs bg-red-500/15 text-red-400 hover:bg-red-500/25 px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              )}
            </div>
            {showCancelConfirm && (
              <div className="mt-3 p-3 bg-red-950/30 border border-red-500/20 rounded flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400/80">
                  Are you sure? All module access will revert to Free immediately.
                </p>
              </div>
            )}
            {cancelError && (
              <div className="mt-3 p-3 bg-red-950/30 border border-red-500/20 rounded flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400/80">{cancelError}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-muted text-xs text-center mt-8">
          <Link href="/pricing" className="hover:text-secondary transition-colors underline">
            Compare all plans
          </Link>
          {' · '}Prices in USD.
        </p>
    </div>
  )
}
