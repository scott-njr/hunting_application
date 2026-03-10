'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Calendar, Shield, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'

interface UserDetail {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  created_at: string
}

interface Subscription {
  module_slug: string
  tier: string
  status: string
}

interface Plan {
  id: string
  plan_type: string
  status: string
  goal: string | null
  weeks_total: number
  started_at: string
  created_at: string
}

const PLAN_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
]

const PLAN_STATUS_COLORS: Record<string, string> = {
  active: 'bg-accent/15 text-accent',
  completed: 'bg-blue-500/15 text-blue-400',
  abandoned: 'bg-muted/15 text-muted',
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  run: 'Run Plan',
  strength: 'Strength Plan',
  meal: 'Meal Plan',
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [member, setMember] = useState<UserDetail | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}`)
    if (res.ok) {
      const data = await res.json()
      setMember(data.member)
      setSubscriptions(data.subscriptions)
      setPlans(data.plans)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { loadUser() }, [loadUser])

  async function updatePlanStatus(planId: string, status: string) {
    setUpdating(planId)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, status }),
    })
    if (res.ok) {
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, status } : p))
    }
    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-elevated rounded animate-pulse" />
        <div className="h-40 bg-elevated rounded-lg animate-pulse" />
        <div className="h-60 bg-elevated rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!member) {
    return (
      <div>
        <p className="text-muted">User not found.</p>
        <Link href="/admin/users" className="text-accent text-sm hover:text-accent-hover mt-2 inline-block">
          Back to users
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Users
      </Link>

      {/* User header */}
      <div className="rounded-lg border border-subtle bg-surface p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{member.full_name || 'No Name'}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted">
              <Mail className="h-3.5 w-3.5" />
              <span>{member.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined {new Date(member.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {member.is_admin && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="bg-base/50 rounded-lg p-3 inline-block">
            <p className="text-xs text-muted mb-0.5">Module Subscriptions</p>
            <p className="text-sm font-semibold text-primary">{subscriptions.length}</p>
          </div>
        </div>
      </div>

      {/* Module subscriptions */}
      {subscriptions.length > 0 && (
        <div className="rounded-lg border border-subtle bg-surface p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3">Module Subscriptions</h2>
          <div className="space-y-2">
            {subscriptions.map(sub => (
              <div key={sub.module_slug} className="flex items-center justify-between py-1.5 border-b border-subtle last:border-0">
                <span className="text-primary text-sm capitalize">{sub.module_slug}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-accent/10 text-accent">
                  {sub.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training plans */}
      <div className="rounded-lg border border-subtle bg-surface p-5">
        <h2 className="text-sm font-semibold mb-3">Training Plans</h2>
        {plans.length === 0 ? (
          <p className="text-muted text-xs">No training plans.</p>
        ) : (
          <div className="space-y-2">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded border border-subtle',
                  updating === plan.id && 'opacity-50'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-sm font-medium">
                      {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
                    </span>
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', PLAN_STATUS_COLORS[plan.status] || PLAN_STATUS_COLORS.active)}>
                      {plan.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    {plan.goal && <span>{plan.goal}</span>}
                    <span>{plan.weeks_total} weeks</span>
                    <span>Started {new Date(plan.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <TacticalSelect
                  value={plan.status}
                  onChange={val => updatePlanStatus(plan.id, val)}
                  options={PLAN_STATUS_OPTIONS}
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
