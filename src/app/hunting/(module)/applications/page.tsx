'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList, Check, X as XIcon, ArrowRight, Calendar, Tent, ChevronDown, ChevronUp,
} from 'lucide-react'

type HuntApplication = {
  id: string
  state: string
  state_name: string
  species: string
  season: string
  year: number
  unit: string | null
  first_choice: string | null
  second_choice: string | null
  third_choice: string | null
  status: 'applied' | 'drawn' | 'not_drawn' | 'withdrawn' | 'hunt_started'
  date_applied: string | null
  notes: string | null
  created_at: string
}

type StateGroup = {
  key: string
  state_name: string
  state: string
  year: number
  apps: HuntApplication[]
}

const STATUS_LABELS: Record<string, string> = {
  applied: 'Pending',
  drawn: 'Drawn!',
  not_drawn: 'Rejected',
  withdrawn: 'Withdrawn',
  hunt_started: 'Hunt Planned',
}

const STATUS_STYLES: Record<string, string> = {
  applied: 'bg-blue-900/40 text-blue-400 border-blue-500/30',
  drawn: 'bg-accent-dim text-accent-hover border-accent-border',
  not_drawn: 'bg-red-950/40 text-red-400 border-red-900/50',
  withdrawn: 'bg-elevated text-muted border-default',
  hunt_started: 'bg-accent-dim text-accent-hover border-accent-border',
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Pending' },
  { key: 'drawn', label: 'Drawn' },
  { key: 'not_drawn', label: 'Rejected' },
]

const speciesLabel = (slug: string) =>
  slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<HuntApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => { loadApplications() }, [])

  async function loadApplications() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('hunt_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('state_name')
      .order('year', { ascending: false })
      .order('species')
    if (data) setApplications(data as HuntApplication[])
    setLoading(false)
  }

  async function updateStatus(appId: string, status: HuntApplication['status']) {
    setUpdatingId(appId)
    const supabase = createClient()
    await supabase.from('hunt_applications').update({ status }).eq('id', appId)
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    setUpdatingId(null)
  }

  async function startHuntPlan(app: HuntApplication) {
    await updateStatus(app.id, 'hunt_started')
    const params = new URLSearchParams({
      new: '1',
      hunt_type: 'group_draw',
      state: app.state,
      species: app.species,
      year: String(app.year),
      ...(app.unit ? { unit: app.unit } : {}),
    })
    router.push(`/hunting/hunts?${params.toString()}`)
  }

  function toggleGroup(key: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Apply filter
  const filtered = filterStatus === 'all'
    ? applications
    : applications.filter(a => a.status === filterStatus)

  // Group by state+year
  const groupMap = new Map<string, StateGroup>()
  for (const app of filtered) {
    const key = `${app.state}-${app.year}`
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, state_name: app.state_name, state: app.state, year: app.year, apps: [] })
    }
    groupMap.get(key)!.apps.push(app)
  }
  const groups = Array.from(groupMap.values())

  const pendingCount = applications.filter(a => a.status === 'applied').length
  const drawnCount = applications.filter(a => a.status === 'drawn').length

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <ClipboardList className="h-5 w-5 text-accent-hover" />
        <h1 className="text-2xl font-bold text-primary">Applications</h1>
      </div>
      <p className="text-secondary text-sm mb-6">
        Track your draw applications. Mark results when they post, then launch a hunt plan for tags you draw.
      </p>

      {/* Stats row */}
      {applications.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="glass-card border border-subtle rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{applications.length}</p>
            <p className="text-muted text-xs mt-0.5">Total</p>
          </div>
          <div className="glass-card border border-blue-500/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{pendingCount}</p>
            <p className="text-muted text-xs mt-0.5">Pending</p>
          </div>
          <div className="glass-card border border-accent-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-accent-hover">{drawnCount}</p>
            <p className="text-muted text-xs mt-0.5">Drawn</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {applications.length > 0 && (
        <div className="flex gap-1 mb-5 glass-card border border-subtle rounded-lg p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setFilterStatus(t.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filterStatus === t.key ? 'bg-elevated text-primary' : 'text-secondary hover:text-primary'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-muted text-sm text-center py-16">Loading applications…</div>
      ) : applications.length === 0 ? (
        <div className="glass-card border border-subtle rounded-lg p-14 text-center">
          <ClipboardList className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-primary font-medium mb-1">No applications yet</p>
          <p className="text-muted text-sm mb-5">
            Go to the Deadlines page and click &quot;I Applied&quot; on any draw you&apos;ve applied for.
          </p>
          <button onClick={() => router.push('/hunting/deadlines')}
            className="inline-flex items-center gap-2 bg-elevated hover:bg-strong text-secondary font-semibold rounded px-5 py-2.5 text-sm transition-colors">
            <Calendar className="h-4 w-4" />
            View Deadlines
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-muted text-sm text-center py-12">No applications with that status.</div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => {
            const isExpanded = expandedGroups.has(group.key)
            const drawnInGroup = group.apps.filter(a => a.status === 'drawn').length
            const pendingInGroup = group.apps.filter(a => a.status === 'applied').length
            const hasDrawn = drawnInGroup > 0

            return (
              <div key={group.key} className={`glass-card rounded-lg border ${hasDrawn ? 'border-accent-border' : 'border-subtle'}`}>

                {/* -- State card header -- */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-primary font-semibold">
                          {group.state_name} {group.year}
                        </span>
                        {hasDrawn && (
                          <span className="text-xs px-2 py-0.5 rounded border font-medium bg-accent-dim text-accent-hover border-accent-border">
                            {drawnInGroup} Drawn!
                          </span>
                        )}
                        {pendingInGroup > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded border font-medium bg-blue-900/40 text-blue-400 border-blue-500/30">
                            {pendingInGroup} Pending
                          </span>
                        )}
                      </div>
                      <p className="text-muted text-xs">
                        {group.apps.length} application{group.apps.length !== 1 ? 's' : ''}
                        {group.apps[0]?.date_applied ? ` · Applied ${new Date(group.apps[0].date_applied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* -- Species table -- */}
                  <div className="rounded-lg border border-subtle overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b border-subtle bg-elevated">
                          <th className="text-left text-muted text-xs font-medium px-4 py-2.5">Species</th>
                          <th className="text-left text-muted text-xs font-medium px-4 py-2.5">Season</th>
                          <th className="text-left text-muted text-xs font-medium px-4 py-2.5">Hunt Code</th>
                          <th className="text-left text-muted text-xs font-medium px-4 py-2.5">Status</th>
                          <th className="text-right text-muted text-xs font-medium px-4 py-2.5">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.apps.map((app, i) => {
                          const isUpdating = updatingId === app.id
                          const isRecord = app.status === 'hunt_started' || app.status === 'withdrawn'
                          const isLast = i === group.apps.length - 1
                          const huntCode = app.first_choice ?? app.unit ?? null

                          return (
                            <tr key={app.id}
                              className={`${!isLast ? 'border-b border-subtle' : ''} ${isRecord ? 'opacity-60' : 'hover:bg-elevated'} transition-colors`}>
                              <td className="px-4 py-3 text-primary font-medium whitespace-nowrap">
                                {speciesLabel(app.species)}
                              </td>
                              <td className="px-4 py-3 text-secondary text-xs capitalize">
                                {app.season}
                              </td>
                              <td className="px-4 py-3 text-secondary text-xs font-mono">
                                {huntCode ?? <span className="text-muted">—</span>}
                                {app.second_choice && (
                                  <span className="text-muted ml-1">+{[app.second_choice, app.third_choice].filter(Boolean).length} more</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_STYLES[app.status]}`}>
                                  {STATUS_LABELS[app.status] ?? app.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {app.status === 'applied' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => updateStatus(app.id, 'drawn')} disabled={isUpdating}
                                      className="text-xs btn-primary disabled:opacity-50 font-semibold rounded px-3 py-1.5 transition-colors inline-flex items-center gap-1">
                                      <Check className="h-3 w-3" /> Drawn
                                    </button>
                                    <button onClick={() => updateStatus(app.id, 'not_drawn')} disabled={isUpdating}
                                      className="text-xs bg-elevated hover:bg-strong disabled:opacity-50 text-secondary rounded px-3 py-1.5 transition-colors inline-flex items-center gap-1">
                                      <XIcon className="h-3 w-3" /> Rejected
                                    </button>
                                  </div>
                                )}
                                {app.status === 'drawn' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => updateStatus(app.id, 'not_drawn')} disabled={isUpdating}
                                      className="text-xs text-muted hover:text-secondary disabled:opacity-50 transition-colors">
                                      ← Not Drawn
                                    </button>
                                    <button onClick={() => startHuntPlan(app)} disabled={isUpdating}
                                      className="text-xs btn-primary disabled:opacity-50 font-semibold rounded px-3 py-1.5 transition-colors inline-flex items-center gap-1">
                                      <Tent className="h-3 w-3" /> Plan Hunt <ArrowRight className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                                {app.status === 'not_drawn' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => updateStatus(app.id, 'applied')} disabled={isUpdating}
                                      className="text-xs text-muted hover:text-secondary disabled:opacity-50 transition-colors">
                                      ← Pending
                                    </button>
                                    <button onClick={() => updateStatus(app.id, 'drawn')} disabled={isUpdating}
                                      className="text-xs bg-elevated hover:bg-strong disabled:opacity-50 text-secondary rounded px-3 py-1.5 transition-colors inline-flex items-center gap-1">
                                      <Check className="h-3 w-3" /> Mark Drawn
                                    </button>
                                  </div>
                                )}
                                {app.status === 'hunt_started' && (
                                  <a href="/hunting/hunts" className="text-xs text-muted hover:text-secondary transition-colors">
                                    View in Hunts →
                                  </a>
                                )}
                                {app.status === 'withdrawn' && (
                                  <span className="text-xs text-muted">Withdrawn</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Rejected note — shown when any app in group is not_drawn */}
                  {group.apps.some(a => a.status === 'not_drawn') && (
                    <p className="text-muted text-xs mt-3">
                      Unsuccessful draws — your preference points may have increased. Update in{' '}
                      <a href="/hunting/profile" className="text-muted hover:text-primary underline">My Profile</a>.
                    </p>
                  )}
                </div>

                {/* Accordion — additional choices per app */}
                {group.apps.some(a => a.second_choice || a.third_choice) && (
                  <>
                    <button type="button" onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-5 py-3 border-t border-subtle text-sm text-secondary hover:text-primary hover:bg-elevated transition-colors">
                      <span className="font-medium">Choice breakdown</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-subtle bg-elevated/50">
                        <div className="mt-4 space-y-3">
                          {group.apps.filter(a => a.second_choice || a.third_choice).map(app => (
                            <div key={app.id}>
                              <p className="text-secondary text-xs font-medium mb-1">{speciesLabel(app.species)}</p>
                              <div className="flex gap-3 text-xs">
                                {app.first_choice && <span className="text-secondary font-mono">1st: {app.first_choice}</span>}
                                {app.second_choice && <span className="text-muted font-mono">2nd: {app.second_choice}</span>}
                                {app.third_choice && <span className="text-muted font-mono">3rd: {app.third_choice}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {applications.length > 0 && (
        <p className="text-muted text-xs mt-6">
          Track new applications from the{' '}
          <a href="/hunting/deadlines" className="text-muted hover:text-primary underline">Deadlines</a> page.
          Always verify results directly with the state agency.
        </p>
      )}
    </div>
  )
}
