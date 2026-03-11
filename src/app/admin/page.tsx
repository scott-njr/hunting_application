import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Users, AlertCircle, Activity, CreditCard } from 'lucide-react'
import { FailedRequestsPanel } from './failed-requests-panel'

interface StatCard {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

function StatCard({ icon: Icon, label, value, sub, accent }: StatCard) {
  return (
    <div className="rounded-lg border border-subtle bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={accent ? 'h-4 w-4 text-accent' : 'h-4 w-4 text-muted'} />
        <span className="text-muted text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-primary text-3xl font-bold">{value}</p>
      {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboard() {
  // Auth check (layout already verifies admin, but we need cookies for session)
  await createClient()

  // Use service role to bypass RLS for admin aggregate queries
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // Fetch all stats in parallel
  const [
    { count: totalUsers },
    { data: tierCounts },
    { count: openIssues },
    { data: recentSignups },
    { count: aiQueriesMonth },
    { count: failedCount },
    { data: recentFailures },
  ] = await Promise.all([
    admin.from('members').select('*', { count: 'exact', head: true }),
    admin.from('module_subscriptions').select('tier').eq('status', 'active'),
    admin.from('issue_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin
      .from('members')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    admin.from('ai_responses').select('*', { count: 'exact', head: true })
      .eq('parse_success', true)
      .gte('created_at', monthStart),
    admin.from('ai_responses').select('*', { count: 'exact', head: true })
      .eq('parse_success', false)
      .gte('created_at', monthStart),
    admin.from('ai_responses')
      .select('id, user_id, module, feature, flags, sanitized_input, raw_response, duration_ms, created_at')
      .eq('parse_success', false)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Enrich recent signups + failures with display names from user_profile
  const signupIds = (recentSignups ?? []).map(u => u.id)
  const failureUserIds = [...new Set((recentFailures ?? []).map(f => f.user_id))]
  const allUserIds = [...new Set([...signupIds, ...failureUserIds])]

  const profileMap: Record<string, string | null> = {}
  const emailMap: Record<string, string> = {}
  if (allUserIds.length > 0) {
    const [{ data: profiles }, { data: members }] = await Promise.all([
      admin.from('user_profile').select('id, display_name').in('id', allUserIds),
      admin.from('members').select('id, email').in('id', failureUserIds),
    ])
    for (const p of profiles ?? []) profileMap[p.id] = p.display_name
    for (const m of members ?? []) emailMap[m.id] = m.email
  }

  const enrichedFailures = (recentFailures ?? []).map(f => ({
    ...f,
    user_email: emailMap[f.user_id] ?? 'Unknown',
    user_name: profileMap[f.user_id] ?? null,
  }))

  // Count unique tiers from module_subscriptions
  let freeCount = 0, basicCount = 0, proCount = 0
  for (const row of tierCounts ?? []) {
    if (row.tier === 'free') freeCount++
    else if (row.tier === 'basic') basicCount++
    else if (row.tier === 'pro') proCount++
  }

  const paidUsers = basicCount + proCount

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted text-sm mt-1">Overview of platform activity and health.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={totalUsers ?? 0} sub={`${paidUsers} paid`} accent />
        <StatCard icon={CreditCard} label="Paid Subscriptions" value={paidUsers} sub={`${basicCount} basic · ${proCount} pro`} accent={paidUsers > 0} />
        <StatCard icon={AlertCircle} label="Open Issues" value={openIssues ?? 0} accent={(openIssues ?? 0) > 0} />
        <StatCard icon={Activity} label="AI Queries" value={aiQueriesMonth ?? 0} sub="successful this month" />
      </div>

      {/* Failed requests */}
      {(failedCount ?? 0) > 0 && (
        <FailedRequestsPanel failures={enrichedFailures} failedCount={failedCount ?? 0} />
      )}

      {/* Tier breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier distribution */}
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <h2 className="text-sm font-semibold mb-4">Tier Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Free', count: freeCount, color: 'bg-muted/30' },
              { label: 'Basic', count: basicCount, color: 'bg-blue-500/40' },
              { label: 'Pro', count: proCount, color: 'bg-accent/40' },
            ].map(tier => {
              const totalSubs = freeCount + basicCount + proCount
              const pct = totalSubs > 0 ? Math.round((tier.count / totalSubs) * 100) : 0
              return (
                <div key={tier.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-secondary">{tier.label}</span>
                    <span className="text-muted">{tier.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-elevated rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${tier.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <h2 className="text-sm font-semibold mb-4">Recent Signups</h2>
          <div className="space-y-2">
            {(recentSignups ?? []).length === 0 && (
              <p className="text-muted text-xs">No signups yet.</p>
            )}
            {(recentSignups ?? []).map(user => (
              <div key={user.id} className="flex items-center justify-between py-1.5 border-b border-subtle last:border-0">
                <div className="min-w-0">
                  <p className="text-primary text-sm truncate">{profileMap[user.id] || user.email}</p>
                  {profileMap[user.id] && <p className="text-muted text-xs truncate">{user.email}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-muted text-[10px]">
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
