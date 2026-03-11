import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { getUserModuleSubscriptionInfo, MODULE_AI_QUOTA, remainingModuleAIQueries } from '@/lib/modules'
import { DrawResearchPage } from '@/components/hunting/draw-research/draw-research-page'
import type { AutoContext, DrawResearchReport } from '@/components/hunting/draw-research/types'

export default async function DrawResearchAIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Parallel data fetches
  const [subInfo, reportsResult, sharedResult, profileResult, pointsResult, baselineResult, friendsResult] =
    await Promise.all([
      getUserModuleSubscriptionInfo(supabase, user.id, 'hunting'),
      supabase
        .from('hunting_draw_research_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('hunting_draw_research_reports')
        .select('*')
        .contains('shared_with', [user.id])
        .order('updated_at', { ascending: false }),
      Promise.all([
        supabase
          .from('user_profile')
          .select('physical_condition, state')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('hunting_profile')
          .select('experience_level, years_hunting, weapon_types, target_species, states_of_interest')
          .eq('id', user.id)
          .maybeSingle(),
      ]).then(([userRes, huntingRes]) => ({
        data: userRes.data && huntingRes.data
          ? { ...userRes.data, ...huntingRes.data }
          : userRes.data
            ? { ...userRes.data, experience_level: null, years_hunting: null, weapon_types: null, target_species: null, states_of_interest: null }
            : null,
      })),
      supabase
        .from('hunting_points')
        .select('state, species, points, point_type')
        .eq('user_id', user.id),
      supabase
        .from('fitness_baseline_tests')
        .select('run_time_seconds, pushups, situps, pullups, tested_at')
        .eq('user_id', user.id)
        .order('tested_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('my_friends')
        .select('friend_id, display_name, email')
        .eq('status', 'accepted'),
    ])

  const quota = MODULE_AI_QUOTA[subInfo.tier]
  const queriesLeft = remainingModuleAIQueries(subInfo.tier, subInfo.aiQueriesThisMonth)
  const hasQuota = queriesLeft > 0

  // Build auto-context for wizard
  const profile = profileResult.data
  const autoContext: AutoContext = {
    points: (pointsResult.data ?? []).map(p => ({
      state: p.state,
      species: p.species,
      points: p.points,
      point_type: p.point_type,
    })),
    physicalCondition: profile?.physical_condition ?? null,
    experienceLevel: profile?.experience_level ?? null,
    state: profile?.state ?? null,
    yearsHunting: profile?.years_hunting ?? null,
    weaponTypes: (profile?.weapon_types as string[] | null) ?? null,
    statesOfInterest: (profile?.states_of_interest as string[] | null) ?? null,
    targetSpecies: (profile?.target_species as string[] | null) ?? null,
    baselineTest: baselineResult.data ?? null,
  }

  // Map reports from DB to client types
  function mapReport(r: Record<string, unknown>): DrawResearchReport {
    return {
      id: r.id as string,
      title: r.title as string,
      state: r.state as string,
      species: r.species as string,
      season: (r.season as string | null) ?? null,
      wizardInputs: r.wizard_inputs as DrawResearchReport['wizardInputs'],
      recommendations: (r.recommendations ?? []) as DrawResearchReport['recommendations'],
      summary: (r.summary as string | null) ?? null,
      chatHistory: (r.chat_history ?? []) as DrawResearchReport['chatHistory'],
      userRankings: (r.user_rankings as string[] | null) ?? null,
      status: (r.status as DrawResearchReport['status']) ?? 'draft',
      sharedWith: (r.shared_with as string[]) ?? [],
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }
  }

  const reports = (reportsResult.data ?? []).map(r => mapReport(r as Record<string, unknown>))
  const sharedReports = (sharedResult.data ?? []).map(r => mapReport(r as Record<string, unknown>))

  // Friends list for sharing
  const friendsList = ((friendsResult.data ?? []) as { friend_id: string; display_name: string | null; email: string }[]).map(f => ({
    id: f.friend_id,
    name: f.display_name ?? f.email,
  }))

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Sparkles className="h-5 w-5 text-accent" />
        <h1 className="text-2xl font-bold text-primary">Draw Research</h1>
      </div>
      <p className="text-secondary text-sm mb-6">
        Get AI-powered unit recommendations based on your profile, preference points, and priorities.
      </p>

      {/* Quota indicator */}
      {quota !== null && (
        <div className={`mb-6 flex items-center justify-between rounded-lg border px-4 py-3 text-sm
          ${hasQuota
            ? 'border-default bg-elevated'
            : 'border-amber-500/30 bg-amber-950/20'
          }`}>
          <span className={hasQuota ? 'text-secondary' : 'text-amber-400'}>
            {hasQuota
              ? `${queriesLeft} of ${quota} queries remaining this month`
              : 'Monthly query limit reached'}
          </span>
          {!hasQuota && (
            <Link
              href="/pricing?upgrade=pro"
              className="ml-4 shrink-0 btn-primary font-semibold rounded px-3 py-1 text-xs transition-colors"
            >
              Upgrade for more queries
            </Link>
          )}
        </div>
      )}

      <DrawResearchPage
        initialReports={reports}
        sharedReports={sharedReports}
        autoContext={autoContext}
        friends={friendsList}
      />

      <p className="text-muted text-xs mt-6">
        AI recommendations are for guidance only. Always verify deadlines, hunt codes, and rules at the state portal.
        Lead the Wild never submits applications on your behalf.
      </p>
    </div>
  )
}
