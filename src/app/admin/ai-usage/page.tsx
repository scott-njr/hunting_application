import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ActualCostCard } from './actual-cost-card'

interface FeatureStats {
  feature: string
  module: string
  count: number
  total_input_tokens: number
  total_output_tokens: number
  failures: number
}

export default async function AdminAIUsagePage() {
  // Service role client to bypass RLS on ai_responses and module_subscriptions
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // Fetch stats in parallel (using admin client to see all users' data)
  const [
    { data: monthlyResponses },
    { data: topUsers },
    { count: totalAllTime },
    { count: failedThisMonth },
  ] = await Promise.all([
    admin
      .from('ai_responses')
      .select('module, feature, tokens_input, tokens_output, parse_success')
      .gte('created_on', monthStart),
    admin
      .from('module_subscriptions')
      .select('user_id, ai_queries_this_month')
      .gt('ai_queries_this_month', 0)
      .eq('status', 'active'),
    admin.from('ai_responses').select('*', { count: 'exact', head: true }),
    admin.from('ai_responses').select('*', { count: 'exact', head: true })
      .eq('parse_success', false)
      .gte('created_on', monthStart),
  ])

  // Aggregate by feature
  const featureMap = new Map<string, FeatureStats>()
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const row of monthlyResponses ?? []) {
    const key = `${row.module}:${row.feature}`
    const existing = featureMap.get(key) ?? {
      feature: row.feature,
      module: row.module,
      count: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      failures: 0,
    }
    existing.count++
    existing.total_input_tokens += row.tokens_input ?? 0
    existing.total_output_tokens += row.tokens_output ?? 0
    if (!row.parse_success) existing.failures++
    totalInputTokens += row.tokens_input ?? 0
    totalOutputTokens += row.tokens_output ?? 0
    featureMap.set(key, existing)
  }

  const featureStats = Array.from(featureMap.values()).sort((a, b) => b.count - a.count)
  const totalQueriesMonth = monthlyResponses?.length ?? 0

  // Aggregate AI queries by user from module_subscriptions
  const userQueryMap = new Map<string, number>()
  for (const row of topUsers ?? []) {
    const current = userQueryMap.get(row.user_id) ?? 0
    userQueryMap.set(row.user_id, current + (row.ai_queries_this_month ?? 0))
  }
  const sortedUserIds = Array.from(userQueryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Fetch member info for top users
  let topUserDetails: { id: string; email: string; display_name: string | null; total_queries: number }[] = []
  if (sortedUserIds.length > 0) {
    const ids = sortedUserIds.map(([id]) => id)
    const [{ data: members }, { data: profiles }] = await Promise.all([
      admin.from('members').select('id, email').in('id', ids),
      admin.from('user_profile').select('id, display_name').in('id', ids),
    ])
    const emailMap = new Map((members ?? []).map(m => [m.id, m.email]))
    const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))
    topUserDetails = sortedUserIds.map(([id, count]) => ({
      id,
      email: emailMap.get(id) ?? '',
      display_name: nameMap.get(id) ?? null,
      total_queries: count,
    }))
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">AI Usage</h1>
        <p className="text-muted text-sm mt-1">Token consumption and feature breakdown for the current month.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Queries This Month</p>
          <p className="text-primary text-3xl font-bold">{totalQueriesMonth}</p>
          <p className="text-muted text-xs mt-1">{totalAllTime ?? 0} all time</p>
        </div>
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Input Tokens</p>
          <p className="text-primary text-3xl font-bold">{(totalInputTokens / 1000).toFixed(1)}k</p>
        </div>
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Output Tokens</p>
          <p className="text-primary text-3xl font-bold">{(totalOutputTokens / 1000).toFixed(1)}k</p>
        </div>
        <ActualCostCard />
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <p className="text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Parse Failures</p>
          <p className="text-primary text-3xl font-bold">{failedThisMonth ?? 0}</p>
          <p className="text-muted text-xs mt-1">this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature breakdown */}
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <h2 className="text-sm font-semibold mb-4">By Feature</h2>
          {featureStats.length === 0 ? (
            <p className="text-muted text-xs">No AI usage this month.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_60px_80px_60px] gap-2 text-[10px] text-muted uppercase tracking-wider pb-2 border-b border-subtle">
                <span>Feature</span>
                <span className="text-right">Queries</span>
                <span className="text-right">Tokens</span>
                <span className="text-right">Fails</span>
              </div>
              {featureStats.map(feat => (
                <div key={`${feat.module}:${feat.feature}`} className="grid grid-cols-[1fr_60px_80px_60px] gap-2 py-1.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-primary truncate">{feat.feature}</p>
                    <p className="text-muted text-[10px]">{feat.module}</p>
                  </div>
                  <p className="text-secondary text-right">{feat.count}</p>
                  <p className="text-muted text-right text-xs">{((feat.total_input_tokens + feat.total_output_tokens) / 1000).toFixed(1)}k</p>
                  <p className={feat.failures > 0 ? 'text-red-400 text-right' : 'text-muted text-right'}>{feat.failures}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top users */}
        <div className="rounded-lg border border-subtle bg-surface p-5">
          <h2 className="text-sm font-semibold mb-4">Top Users</h2>
          {topUserDetails.length === 0 ? (
            <p className="text-muted text-xs">No AI usage this month.</p>
          ) : (
            <div className="space-y-2">
              {topUserDetails.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between py-1.5 border-b border-subtle last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-muted text-xs w-5 text-right">{i + 1}.</span>
                    <div className="min-w-0">
                      <p className="text-primary text-sm truncate">{user.display_name || user.email}</p>
                      {user.display_name && <p className="text-muted text-xs truncate">{user.email}</p>}
                    </div>
                  </div>
                  <span className="text-secondary text-sm font-medium flex-shrink-0 ml-3">
                    {user.total_queries}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
