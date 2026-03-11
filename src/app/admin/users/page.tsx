'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Shield, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminUser {
  id: string
  email: string
  display_name: string | null
  is_admin: boolean
  onboarding_completed: boolean
  created_at: string
  subscriptions?: { module_slug: string; tier: string; status: string }[]
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const limit = 25

  useEffect(() => {
    let cancelled = false
    async function loadUsers() {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/users?${params}`)
      if (!cancelled && res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      }
      if (!cancelled) setLoading(false)
    }
    loadUsers()
    return () => { cancelled = true }
  }, [page, search])

  async function updateUser(userId: string, field: string, value: string | boolean) {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, field, value }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, [field]: value } : u
        ))
      }
    } catch {
      // Network error — no update applied
    }
    setUpdating(null)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted text-sm mt-1">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-subtle bg-surface text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent/40"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="text-left px-4 py-3 text-muted text-xs font-semibold uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-muted text-xs font-semibold uppercase tracking-wider">Modules</th>
                <th className="text-left px-4 py-3 text-muted text-xs font-semibold uppercase tracking-wider">Joined</th>
                <th className="text-left px-4 py-3 text-muted text-xs font-semibold uppercase tracking-wider">Admin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-subtle">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-elevated rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">No users found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    className={cn(
                      'border-b border-subtle last:border-0 transition-colors cursor-pointer hover:bg-elevated/50',
                      updating === user.id && 'opacity-50'
                    )}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-primary font-medium truncate max-w-[200px]">{user.display_name || '—'}</p>
                      <p className="text-muted text-xs truncate max-w-[200px]">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.subscriptions ?? []).filter(s => s.status === 'active').map(sub => (
                          <span key={sub.module_slug} className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                            {sub.module_slug} · {sub.tier}
                          </span>
                        ))}
                        {(user.subscriptions ?? []).filter(s => s.status === 'active').length === 0 && (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => updateUser(user.id, 'is_admin', !user.is_admin)}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          user.is_admin
                            ? 'text-accent bg-accent/10 hover:bg-accent/20'
                            : 'text-muted hover:text-secondary hover:bg-elevated'
                        )}
                        title={user.is_admin ? 'Remove admin' : 'Make admin'}
                      >
                        {user.is_admin ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-subtle">
            <p className="text-muted text-xs">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded text-secondary hover:text-primary hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded text-secondary hover:text-primary hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
