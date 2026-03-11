'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronDown, ChevronUp, ExternalLink, CheckCircle2, AlertTriangle,
  Users, Plus, Trash2, ClipboardList, X, Check,
} from 'lucide-react'
import { DrawSpeciesWithState } from '@/app/hunting/(module)/deadlines/page'

type RequirementStep = {
  step: number
  label: string
  detail?: string
  warning?: boolean
  link?: { label: string; url: string }
}

type ApplyMember = {
  id: string
  name: string
  phone: string
  email: string
}

type HuntCodeForm = {
  first: string
  second: string
  third: string
}

const statusStyles = {
  open: 'badge-open',
  upcoming: 'bg-blue-900/40 text-blue-400 border-blue-500/30',
  closed: 'bg-elevated text-muted border-default',
}

const statusLabel = { open: 'Open', upcoming: 'Upcoming', closed: 'Closed' }

const speciesLabel = (slug: string) =>
  slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

type PointsEntry = { preference?: number; bonus?: number }

type Props = {
  draws: DrawSpeciesWithState[]
  hasInterests: boolean
  appliedKeys: string[]
  pointsMap: Record<string, PointsEntry>
}

export function DeadlinesClient({ draws, hasInterests, appliedKeys, pointsMap }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [applyMembers, setApplyMembers] = useState<Record<string, ApplyMember[]>>({})
  const [applyingRowId, setApplyingRowId] = useState<string | null>(null)
  const [huntCodes, setHuntCodes] = useState<HuntCodeForm>({ first: '', second: '', third: '' })
  const [savingApply, setSavingApply] = useState(false)
  const [applied, setApplied] = useState<Set<string>>(new Set(appliedKeys))

  const grouped = new Map<string, DrawSpeciesWithState[]>()
  for (const d of draws) {
    const rows = grouped.get(d.draw_state_id) ?? []
    rows.push(d)
    grouped.set(d.draw_state_id, rows)
  }
  const groups = Array.from(grouped.values())

  function appliedKey(d: DrawSpeciesWithState) {
    return `${d.state_code}-${d.species}-${d.year}`
  }

  function openApplyForm(rowId: string) {
    setApplyingRowId(rowId)
    setHuntCodes({ first: '', second: '', third: '' })
  }

  function cancelApply() {
    setApplyingRowId(null)
    setHuntCodes({ first: '', second: '', third: '' })
  }

  async function saveApplication(d: DrawSpeciesWithState) {
    if (!huntCodes.first.trim()) return
    setSavingApply(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingApply(false); return }

    await supabase
      .from('hunting_applications')
      .upsert({
        user_id: user.id,
        state: d.state_code,
        state_name: d.hunting_draw_states.state_name,
        species: d.species,
        season: d.seasons[0] ?? 'general',
        year: d.year,
        unit: huntCodes.first.trim() || null,
        first_choice: huntCodes.first.trim() || null,
        second_choice: huntCodes.second.trim() || null,
        third_choice: huntCodes.third.trim() || null,
        status: 'applied' as const,
        date_applied: new Date().toISOString().split('T')[0],
      }, { onConflict: 'user_id,state,species,season,year', ignoreDuplicates: true })

    setApplied(prev => new Set(prev).add(appliedKey(d)))
    setSavingApply(false)
    setApplyingRowId(null)
    router.refresh()
  }

  async function unmarkApplied(d: DrawSpeciesWithState) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('hunting_applications')
      .delete()
      .eq('user_id', user.id)
      .eq('state', d.state_code)
      .eq('species', d.species)
      .eq('year', d.year)

    setApplied(prev => {
      const next = new Set(prev)
      next.delete(appliedKey(d))
      return next
    })
    router.refresh()
  }

  function addMember(key: string) {
    setApplyMembers(prev => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: crypto.randomUUID(), name: '', phone: '', email: '' }],
    }))
  }

  function updateMember(key: string, memberId: string, field: keyof ApplyMember, value: string) {
    setApplyMembers(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).map(m => m.id === memberId ? { ...m, [field]: value } : m),
    }))
  }

  function removeMember(key: string, memberId: string) {
    setApplyMembers(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).filter(m => m.id !== memberId),
    }))
  }

  return (
    <>
      {/* Profile nudge */}
      {!hasInterests && draws.length > 0 && (
        <div className="mb-4 rounded-lg border border-default bg-elevated/50 px-4 py-3 text-sm">
          <p className="text-secondary">
            Showing all available draws.{' '}
            <Link href="/hunting/profile" className="text-accent-hover hover:underline">
              Set your species and state interests in your profile
            </Link>{' '}
            to filter to what&apos;s relevant to you.
          </p>
        </div>
      )}

      {/* Empty state */}
      {hasInterests && draws.length === 0 && (
        <div className="glass-card px-6 py-10 text-center">
          <p className="text-secondary text-sm mb-2">No draws found matching your profile interests yet.</p>
          <p className="text-muted text-xs mb-4">More states are coming soon.</p>
          <Link href="/hunting/profile" className="text-accent-hover hover:underline text-sm">Update your interests →</Link>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const state = group[0].hunting_draw_states
          const cardKey = `${state.state_code}-${group[0].year}`
          const isOpen = expanded === cardKey
          const members = applyMembers[cardKey] ?? []
          const requirements = state.shared_requirements as unknown as RequirementStep[]

          const hasOpenSpecies = group.some(d => d.status === 'open')
          const cardStatus: 'open' | 'upcoming' | 'closed' = hasOpenSpecies ? 'open' : 'upcoming'

          const primary = group[0]
          const deadlines = new Set(group.map(d => d.deadline))
          const uniformDates = deadlines.size === 1

          return (
            <div key={cardKey} className="bg-surface border border-subtle rounded-lg">

              {/* ── State-level header ─────────────────────────────────── */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-primary font-semibold text-sm">
                      {state.state_name} {primary.year}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusStyles[cardStatus]}`}>
                      {statusLabel[cardStatus]}
                    </span>
                    <span className="text-muted text-xs hidden sm:inline">
                      {uniformDates ? 'All species · same dates' : 'Dates vary by species'}
                    </span>
                  </div>
                  {state.portal_url && (
                    <a href={state.portal_url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-xs bg-elevated hover:bg-strong text-secondary rounded px-3 py-1.5 transition-colors flex items-center gap-1">
                      Apply at portal <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Shared date grid */}
                {uniformDates && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs mb-3">
                    <div><p className="text-muted mb-0.5">Opens</p><p className="text-secondary">{primary.open_date ?? '—'}</p></div>
                    <div><p className="text-muted mb-0.5">Deadline</p><p className="text-primary font-medium">{primary.deadline ?? '—'}</p></div>
                    <div><p className="text-muted mb-0.5">Results</p><p className="text-secondary">{primary.results_date ?? '—'}</p></div>
                    <div><p className="text-muted mb-0.5">Payment</p><p className="text-secondary">{primary.payment_deadline ?? '—'}</p></div>
                    <div>
                      <p className="text-muted mb-0.5">2nd Draw</p>
                      <p className="text-secondary">
                        {primary.secondary_open ? `${primary.secondary_open}` : '—'}
                      </p>
                    </div>
                    <div><p className="text-muted mb-0.5">Leftovers</p><p className="text-secondary">{primary.leftover_date || '—'}</p></div>
                  </div>
                )}

                {/* State warning */}
                {state.state_warning && (
                  <div className="mb-3 px-3 py-2 rounded bg-amber-950/20 border border-amber-500/20 text-amber-400/90 text-xs flex gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{state.state_warning}</span>
                  </div>
                )}

                {/* ── Species table ──────────────────────────────────── */}
                <div className="rounded border border-subtle overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-subtle bg-elevated/60">
                        <th className="text-left text-muted font-medium px-3 py-2">Species</th>
                        <th className="text-left text-muted font-medium px-3 py-2 hidden sm:table-cell">Seasons</th>
                        {!uniformDates && (
                          <>
                            <th className="text-left text-muted font-medium px-3 py-2">Deadline</th>
                            <th className="text-left text-muted font-medium px-3 py-2 hidden sm:table-cell">Results</th>
                          </>
                        )}
                        <th className="text-left text-muted font-medium px-3 py-2">Status</th>
                        <th className="text-right text-muted font-medium px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((d, i) => {
                        const seasonsStr = d.seasons.length === 1
                          ? speciesLabel(d.seasons[0])
                          : d.seasons.map(s => speciesLabel(s)).join(' · ')
                        const isLast = i === group.length - 1
                        const rowStatus = d.status as 'open' | 'upcoming' | 'closed'
                        const isApplying = applyingRowId === d.id
                        const isApplied = applied.has(appliedKey(d))

                        return (
                          <React.Fragment key={d.id}>
                            <tr
                              className={`${!isLast && !isApplying ? 'border-b border-subtle/50' : ''} hover:bg-elevated/30 transition-colors`}>
                              <td className="px-3 py-2 text-primary font-medium whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 flex-wrap">
                                  {speciesLabel(d.species)}
                                  {d.note && (
                                    <span title={d.note} className="inline-block align-middle cursor-help">
                                      <AlertTriangle className="h-3 w-3 text-amber-500/70" />
                                    </span>
                                  )}
                                  {(() => {
                                    const pts = pointsMap[`${d.state_code}-${d.species}`]
                                    if (!pts) return null
                                    return (
                                      <>
                                        {pts.preference !== undefined && (
                                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30" title="Preference points">
                                            {pts.preference}P
                                          </span>
                                        )}
                                        {pts.bonus !== undefined && (
                                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-500/30" title="Bonus points">
                                            {pts.bonus}B
                                          </span>
                                        )}
                                      </>
                                    )
                                  })()}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted hidden sm:table-cell">{seasonsStr}</td>
                              {!uniformDates && (
                                <>
                                  <td className="px-3 py-2 text-primary font-medium whitespace-nowrap">{d.deadline ?? '—'}</td>
                                  <td className="px-3 py-2 text-muted whitespace-nowrap hidden sm:table-cell">{d.results_date ?? '—'}</td>
                                </>
                              )}
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded border font-medium ${statusStyles[rowStatus]}`}>
                                  {statusLabel[rowStatus]}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap">
                                {isApplied ? (
                                  <span className="inline-flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-accent-hover font-medium">
                                      <Check className="h-3 w-3" />
                                      Applied
                                    </span>
                                    <button
                                      onClick={() => unmarkApplied(d)}
                                      className="text-muted hover:text-secondary transition-colors"
                                      title="Remove application"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ) : !isApplying ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => openApplyForm(d.id)}
                                      className="bg-elevated hover:bg-strong text-secondary rounded px-2.5 py-1 transition-colors inline-flex items-center gap-1"
                                    >
                                      <ClipboardList className="h-3 w-3" />
                                      I Applied
                                    </button>
                                    {state.portal_url && (
                                      <a href={state.portal_url} target="_blank" rel="noopener noreferrer"
                                        className="bg-surface hover:bg-elevated text-muted border border-default rounded px-2.5 py-1 transition-colors inline-flex items-center gap-1">
                                        Portal <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    )}
                                  </span>
                                ) : (
                                  <button onClick={cancelApply}
                                    className="text-muted hover:text-secondary inline-flex items-center gap-1">
                                    <X className="h-3 w-3" /> Cancel
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Hunt code form — inline row below species row */}
                            {isApplying && (
                              <tr className={`${!isLast ? 'border-b border-subtle/50' : ''} bg-elevated/30`}>
                                <td colSpan={uniformDates ? 4 : 6} className="px-3 py-3">
                                  <div className="flex flex-col gap-2">
                                    <p className="text-secondary text-xs">
                                      Hunt code(s) for <span className="text-primary">{speciesLabel(d.species)} — {state.state_name} {d.year}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2 items-end">
                                      <div className="flex flex-col gap-1">
                                        <label className="text-muted text-xs">1st Choice <span className="text-red-400">*</span></label>
                                        <input
                                          type="text"
                                          value={huntCodes.first}
                                          onChange={e => setHuntCodes(h => ({ ...h, first: e.target.value }))}
                                          placeholder="e.g. 310-20"
                                          autoFocus
                                          className="input-field w-28 !py-1.5 !px-2.5 !text-xs"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="text-muted text-xs">2nd Choice</label>
                                        <input
                                          type="text"
                                          value={huntCodes.second}
                                          onChange={e => setHuntCodes(h => ({ ...h, second: e.target.value }))}
                                          placeholder="optional"
                                          className="input-field w-24 !py-1.5 !px-2.5 !text-xs"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="text-muted text-xs">3rd Choice</label>
                                        <input
                                          type="text"
                                          value={huntCodes.third}
                                          onChange={e => setHuntCodes(h => ({ ...h, third: e.target.value }))}
                                          placeholder="optional"
                                          className="input-field w-24 !py-1.5 !px-2.5 !text-xs"
                                        />
                                      </div>
                                      <button
                                        onClick={() => saveApplication(d)}
                                        disabled={!huntCodes.first.trim() || savingApply}
                                        className="btn-primary !text-xs !px-3 !py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        {savingApply ? 'Saving…' : 'Save'}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Accordion: checklist + group members ──────────────── */}
              <button type="button" onClick={() => setExpanded(isOpen ? null : cardKey)}
                className="w-full flex items-center justify-between px-4 py-2.5 border-t border-subtle text-xs text-muted hover:text-secondary hover:bg-elevated/40 transition-colors">
                <span className="font-medium">Application checklist &amp; group members</span>
                {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-subtle/50 bg-elevated/20">
                  {state.gmu_notes && (
                    <div className="mt-3 mb-3 p-3 rounded bg-blue-950/30 border border-blue-500/20 text-blue-300 text-xs">
                      <span className="font-semibold">District Notes: </span>{state.gmu_notes}
                    </div>
                  )}

                  {requirements.length > 0 && (
                    <ol className="mt-3 space-y-2.5 mb-5">
                      {requirements.map(r => (
                        <li key={r.step} className="flex gap-2.5">
                          <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                            r.warning ? 'bg-amber-900/60 text-amber-400' : 'bg-accent-dim text-accent-hover'
                          }`}>
                            {r.warning ? '!' : <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${r.warning ? 'text-amber-300' : 'text-primary'}`}>{r.label}</p>
                            {r.detail && <p className="text-muted text-xs mt-0.5">{r.detail}</p>}
                            {r.link && (
                              <a href={r.link.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-accent-hover hover:underline flex items-center gap-1 mt-1">
                                {r.link.label} <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Group members */}
                  <div className="border-t border-subtle pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted" />
                        <span className="text-primary text-xs font-medium">Who&apos;s Applying With Me</span>
                      </div>
                      <button type="button" onClick={() => addMember(cardKey)}
                        className="flex items-center gap-1 text-xs text-muted hover:text-accent-hover transition-colors">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    <p className="text-muted text-xs mb-2">
                      Group draw reminder: {state.state_name} uses the{' '}
                      <strong className="text-secondary">lowest member&apos;s points</strong> as the group&apos;s effective points.
                    </p>
                    {members.length === 0 && <p className="text-muted text-xs">No group members added yet.</p>}
                    <div className="space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                          <input type="text" value={m.name} onChange={e => updateMember(cardKey, m.id, 'name', e.target.value)}
                            placeholder="Name" className="input-field !py-1.5 !px-2.5 !text-xs" />
                          <input type="text" value={m.phone} onChange={e => updateMember(cardKey, m.id, 'phone', e.target.value)}
                            placeholder="Phone (optional)" className="input-field !py-1.5 !px-2.5 !text-xs" />
                          <input type="text" value={m.email} onChange={e => updateMember(cardKey, m.id, 'email', e.target.value)}
                            placeholder="Email (optional)" className="input-field !py-1.5 !px-2.5 !text-xs" />
                          <button type="button" onClick={() => removeMember(cardKey, m.id)}
                            className="text-muted hover:text-red-400 transition-colors p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
