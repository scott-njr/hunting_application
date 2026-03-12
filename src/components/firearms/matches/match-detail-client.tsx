'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Users, Trophy, Play, Search, X, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TacticalSelect } from '@/components/ui/tactical-select'
import {
  type MatchStatus,
  USPSA_DIVISIONS,
  USPSA_CLASSES,
} from '@/components/firearms/shot-timer/shot-timer-types'

// ─── Types ──────────────────────────────────────────────────────────────────

type MatchRow = {
  id: string
  name: string
  organizer_id: string
  course_of_fire_id: string
  match_date: string | null
  status: MatchStatus
  created_on: string
}

type CourseRow = {
  id: string
  name: string
  strings_count: number
  shots_per_string: number
  description: string | null
} | null

type MemberSession = {
  points: number | null
  hit_factor: number | null
  alpha: number | null
  bravo: number | null
  charlie: number | null
  delta: number | null
  miss: number | null
  status: string | null
  total_strings: number | null
  ended_at: string | null
}

type MemberUser = {
  display_name: string | null
  user_name: string | null
  avatar_url: string | null
}

type MemberRow = {
  id: string
  match_id: string
  user_id: string
  squad: string | null
  division: string | null
  power_factor: string | null
  classification: string | null
  session_id: string | null
  shoot_order: number | null
  user: MemberUser | null
  session: MemberSession | null
}

type SearchResult = {
  user_id: string
  display_name: string | null
  user_name: string | null
  avatar_url: string | null
}

interface MatchDetailClientProps {
  userId: string
  userName: string
  match: MatchRow
  initialMembers: MemberRow[]
  course: CourseRow
  isOrganizer: boolean
}

const STATUS_COLORS: Record<MatchStatus, string> = {
  setup: 'text-amber-400 bg-amber-900/20 border-amber-800/50',
  active: 'text-accent bg-accent/10 border-accent/30',
  complete: 'text-secondary bg-elevated border-subtle',
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MatchDetailClient({ userId, userName, match, initialMembers, course, isOrganizer }: MatchDetailClientProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [status, setStatus] = useState<MatchStatus>(match.status)

  // Add member
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null)

  // Member config
  const [newDivision, setNewDivision] = useState('')
  const [newPowerFactor, setNewPowerFactor] = useState('minor')
  const [newClassification, setNewClassification] = useState('u')
  const [newSquad, setNewSquad] = useState('')

  // ─── User Search ────────────────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/find?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          const memberUserIds = new Set(members.map(m => m.user_id))
          setSearchResults((data.results ?? []).filter((r: SearchResult) => !memberUserIds.has(r.user_id)))
        }
      } catch { /* silent */ }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, members])

  // ─── Add Member ─────────────────────────────────────────────────────────

  async function handleAddMember(user: SearchResult) {
    if (addingMember) return
    setAddingMember(true)
    setAddError(null)
    try {
      const res = await fetch(`/api/firearms/matches/${match.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          division: newDivision || null,
          power_factor: newPowerFactor || 'minor',
          classification: newClassification || 'u',
          squad: newSquad || null,
          shoot_order: members.length + 1,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        // Optimistically add to local state — avoids relying on GET join
        const newMember: MemberRow = {
          id: data.member.id,
          match_id: match.id,
          user_id: user.user_id,
          squad: newSquad || null,
          division: newDivision || null,
          power_factor: newPowerFactor || 'minor',
          classification: newClassification || 'u',
          session_id: null,
          shoot_order: members.length + 1,
          user: { display_name: user.display_name, user_name: user.user_name, avatar_url: user.avatar_url },
          session: null,
        }
        setMembers(prev => [...prev, newMember])
        setSelectedUser(null)
        setSearchQuery('')
        setSearchResults([])
        setNewDivision('')
        setNewPowerFactor('minor')
        setNewClassification('u')
        setNewSquad('')
      } else {
        const data = await res.json().catch(() => null)
        setAddError(data?.error ?? 'Failed to add shooter')
      }
    } catch {
      setAddError('Network error — could not add shooter')
    }
    setAddingMember(false)
  }

  // ─── Remove Member ──────────────────────────────────────────────────────

  async function handleRemoveMember(memberId: string) {
    try {
      const res = await fetch(`/api/firearms/matches/${match.id}/members/${memberId}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
      }
    } catch { /* silent */ }
  }

  // ─── Update Match Status ────────────────────────────────────────────────

  async function handleStatusChange(newStatus: MatchStatus) {
    try {
      const res = await fetch(`/api/firearms/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) setStatus(newStatus)
    } catch { /* silent */ }
  }

  // ─── Refresh Members ───────────────────────────────────────────────────

  const refreshMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/firearms/matches/${match.id}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members ?? [])
      }
    } catch { /* silent */ }
  }, [match.id])

  // ─── Render ─────────────────────────────────────────────────────────────

  const scoredMembers = [...members]
    .filter(m => m.session?.status)
    .sort((a, b) => (b.session?.hit_factor ?? 0) - (a.session?.hit_factor ?? 0))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/firearms/matches')} className="text-muted hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-primary font-bold text-xl truncate">{match.name}</h1>
            <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0', STATUS_COLORS[status])}>
              {status}
            </span>
          </div>
          {course && (
            <p className="text-muted text-xs mt-0.5">
              {course.name} · {course.strings_count} strings × {course.shots_per_string} shots
            </p>
          )}
        </div>
      </div>

      {/* Status controls */}
      {isOrganizer && (
        <div className="flex gap-2">
          {status === 'setup' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={members.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-base font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4" />
              Start Match {members.length === 0 && '(add shooters first)'}
            </button>
          )}
          {status === 'active' && (
            <button
              onClick={() => handleStatusChange('complete')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              <Trophy className="h-4 w-4" />
              Complete Match
            </button>
          )}
        </div>
      )}

      {/* Members Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-secondary font-bold text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shooters ({members.length})
          </h2>
          {isOrganizer && status === 'setup' && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-1.5 text-accent text-xs font-medium hover:text-accent/80 transition-colors"
            >
              {showAddMember ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddMember ? 'Cancel' : 'Add Shooter'}
            </button>
          )}
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <div className="bg-surface border border-subtle rounded-xl p-4 space-y-3">
            {addError && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-2">
                <p className="text-red-400 text-xs">{addError}</p>
              </div>
            )}

            {/* Quick add yourself */}
            {!members.some(m => m.user_id === userId) && (
              <button
                onClick={() => handleAddMember({ user_id: userId, display_name: userName, user_name: null, avatar_url: null })}
                disabled={addingMember}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {addingMember ? 'Adding...' : `Add Yourself (${userName})`}
              </button>
            )}

            {/* Search for other users */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedUser(null) }}
                placeholder="Search by name or username..."
                className="w-full pl-9 pr-3 py-2.5 bg-elevated border border-subtle rounded-lg text-primary text-sm placeholder:text-muted/50 focus:border-accent focus:outline-none"
                autoFocus
              />
            </div>

            {/* Search results — select a user */}
            {!selectedUser && searchResults.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map(result => (
                  <button
                    key={result.user_id}
                    onClick={() => { setSelectedUser(result); setSearchQuery(result.display_name ?? result.user_name ?? '') }}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-elevated hover:bg-elevated/80 border border-subtle rounded-lg transition-colors text-left"
                  >
                    {result.avatar_url ? (
                      <img src={result.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                        {(result.display_name?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-primary text-sm font-medium truncate">{result.display_name ?? 'Unknown'}</p>
                      {result.user_name && <p className="text-muted text-[10px]">@{result.user_name}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected user indicator */}
            {selectedUser && (
              <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
                  {(selectedUser.display_name?.[0] ?? '?').toUpperCase()}
                </div>
                <span className="text-primary text-sm font-medium flex-1 truncate">{selectedUser.display_name ?? 'Unknown'}</span>
                <button onClick={() => { setSelectedUser(null); setSearchQuery('') }} className="text-muted hover:text-primary transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {searching && <p className="text-muted text-xs text-center py-2">Searching...</p>}
            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && !selectedUser && (
              <p className="text-muted text-xs text-center py-2">No users found</p>
            )}

            {/* Member config (optional) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted text-[10px] block mb-0.5">Division</label>
                <TacticalSelect
                  value={newDivision}
                  onChange={setNewDivision}
                  options={USPSA_DIVISIONS.map(d => ({ value: d.value, label: d.label }))}
                  placeholder="Division..."
                />
              </div>
              <div>
                <label className="text-muted text-[10px] block mb-0.5">Power Factor</label>
                <TacticalSelect
                  value={newPowerFactor}
                  onChange={setNewPowerFactor}
                  options={[{ value: 'major', label: 'Major' }, { value: 'minor', label: 'Minor' }]}
                  placeholder="PF..."
                />
              </div>
              <div>
                <label className="text-muted text-[10px] block mb-0.5">Classification</label>
                <TacticalSelect
                  value={newClassification}
                  onChange={setNewClassification}
                  options={USPSA_CLASSES.map(c => ({ value: c.value, label: c.label }))}
                  placeholder="Class..."
                />
              </div>
              <div>
                <label className="text-muted text-[10px] block mb-0.5">Squad</label>
                <input
                  type="text"
                  value={newSquad}
                  onChange={e => setNewSquad(e.target.value)}
                  placeholder="e.g. A, 1"
                  className="w-full px-2 py-1.5 bg-elevated border border-subtle rounded-lg text-primary text-xs placeholder:text-muted/50 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Add Shooter button — visible when a user is selected */}
            {selectedUser && (
              <button
                onClick={() => handleAddMember(selectedUser)}
                disabled={addingMember}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-base font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {addingMember ? 'Adding...' : `Add Shooter (${selectedUser.display_name ?? 'Unknown'})`}
              </button>
            )}
          </div>
        )}

        {/* Member List */}
        {members.length === 0 && !showAddMember && (
          <div className="bg-surface border border-subtle rounded-xl p-6 text-center">
            <Users className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-secondary text-sm">No shooters added yet</p>
            <p className="text-muted text-xs mt-1">Add shooters to start the match</p>
          </div>
        )}

        {members.length > 0 && (
          <div className="space-y-2">
            {members.map((member, idx) => {
              const displayName = member.user?.display_name ?? member.user?.user_name ?? 'Unknown'
              const hasScores = member.session && member.session.status
              const divisionLabel = USPSA_DIVISIONS.find(d => d.value === member.division)?.label
              const classLabel = USPSA_CLASSES.find(c => c.value === member.classification)?.label

              return (
                <div key={member.id} className={cn('bg-surface border rounded-xl p-3', hasScores ? 'border-accent/30' : 'border-subtle')}>
                  <div className="flex items-center gap-3">
                    <span className="text-muted text-xs font-mono w-5 text-center shrink-0">#{idx + 1}</span>

                    {member.user?.avatar_url ? (
                      <img src={member.user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                        {(displayName[0] ?? '?').toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-primary text-sm font-medium truncate">{displayName}</p>
                      <div className="flex items-center gap-2 text-muted text-[10px] mt-0.5">
                        {divisionLabel && <span>{divisionLabel}</span>}
                        {member.power_factor && <span className="uppercase">{member.power_factor}</span>}
                        {classLabel && <span>{classLabel}</span>}
                        {member.squad && <span>Squad {member.squad}</span>}
                      </div>
                    </div>

                    {hasScores && (
                      <div className="text-right shrink-0">
                        <p className="text-accent text-sm font-bold font-mono">{member.session!.hit_factor?.toFixed(4) ?? '—'}</p>
                        <p className="text-muted text-[10px]">{member.session!.points ?? 0} pts</p>
                      </div>
                    )}

                    {/* Run Timer button (active match, not yet scored) */}
                    {isOrganizer && status === 'active' && !hasScores && (
                      <button
                        onClick={() => router.push(`/firearms/matches/${match.id}/timer/${member.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 text-base text-xs font-bold rounded-lg transition-colors shrink-0"
                      >
                        <Timer className="h-3.5 w-3.5" />
                        Run
                      </button>
                    )}

                    {isOrganizer && status === 'setup' && (
                      <button onClick={() => handleRemoveMember(member.id)} className="text-muted hover:text-red-400 transition-colors p-1 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {hasScores && member.session!.alpha !== null && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-subtle text-[10px] font-mono">
                      <span className="text-accent">A:{member.session!.alpha}</span>
                      <span className="text-blue-400">B:{member.session!.bravo}</span>
                      <span className="text-yellow-400">C:{member.session!.charlie}</span>
                      <span className="text-orange-400">D:{member.session!.delta}</span>
                      <span className="text-red-400">M:{member.session!.miss}</span>
                      <span className="text-muted ml-auto">
                        {member.session!.status === 'dq' && 'DQ'}
                        {member.session!.status === 'dnf' && 'DNF'}
                        {member.session!.status === 'review' && 'Complete'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Scoreboard */}
      {scoredMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-secondary font-bold text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Scoreboard
          </h2>
          <div className="bg-surface border border-subtle rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-subtle text-muted text-[10px] uppercase tracking-wider">
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Shooter</th>
                    <th className="text-left px-3 py-2">Div</th>
                    <th className="text-right px-3 py-2">A</th>
                    <th className="text-right px-3 py-2">B</th>
                    <th className="text-right px-3 py-2">C</th>
                    <th className="text-right px-3 py-2">D</th>
                    <th className="text-right px-3 py-2">M</th>
                    <th className="text-right px-3 py-2">Pts</th>
                    <th className="text-right px-3 py-2">HF</th>
                    <th className="text-right px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scoredMembers.map((member, idx) => {
                    const displayName = member.user?.display_name ?? member.user?.user_name ?? '?'
                    const divLabel = USPSA_DIVISIONS.find(d => d.value === member.division)?.label ?? '—'
                    const s = member.session!
                    return (
                      <tr key={member.id} className="border-b border-subtle/50 last:border-b-0">
                        <td className="px-3 py-2 text-muted font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 text-primary font-medium truncate max-w-[120px]">{displayName}</td>
                        <td className="px-3 py-2 text-muted">{divLabel}</td>
                        <td className="px-3 py-2 text-right text-accent font-mono">{s.alpha ?? 0}</td>
                        <td className="px-3 py-2 text-right text-blue-400 font-mono">{s.bravo ?? 0}</td>
                        <td className="px-3 py-2 text-right text-yellow-400 font-mono">{s.charlie ?? 0}</td>
                        <td className="px-3 py-2 text-right text-orange-400 font-mono">{s.delta ?? 0}</td>
                        <td className="px-3 py-2 text-right text-red-400 font-mono">{s.miss ?? 0}</td>
                        <td className="px-3 py-2 text-right text-primary font-mono font-bold">{s.points ?? 0}</td>
                        <td className="px-3 py-2 text-right text-accent font-mono font-bold">{s.hit_factor?.toFixed(4) ?? '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={cn(
                            'text-[10px] font-bold uppercase',
                            s.status === 'dq' ? 'text-red-400' : s.status === 'dnf' ? 'text-amber-400' : 'text-accent'
                          )}>
                            {s.status === 'review' ? 'OK' : s.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
