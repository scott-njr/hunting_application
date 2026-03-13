import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GraduationCap, Users, Bot } from 'lucide-react'
import { getUserModuleSubscriptionInfo, MODULE_AI_QUOTA } from '@/lib/modules'
import type { ModuleSlug } from '@/lib/modules'
import { SummaryCard } from '@/components/module-overview/summary-card'

const MODULE_NAMES: Record<string, string> = {
  hunting: 'Hunting',
  archery: 'Archery',
  firearms: 'Firearms',
  fishing: 'Fishing',
  medical: 'Medical',
  fitness: 'Fitness',
}

const MODULE_OVERVIEW_SLUGS: Record<string, string> = {
  hunting: 'my-hunts',
  archery: 'my-archery',
  firearms: 'my-firearms',
  fishing: 'my-fishing',
  medical: 'my-medical',
  fitness: 'my-plan',
}

export function createMyModulePage(moduleSlug: ModuleSlug) {
  const moduleName = MODULE_NAMES[moduleSlug] ?? moduleSlug
  const overviewSlug = MODULE_OVERVIEW_SLUGS[moduleSlug] ?? `my-${moduleSlug}`

  return async function MyModulePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const [
      subInfo,
      coursesResult,
      progressResult,
      postsResult,
    ] = await Promise.all([
      getUserModuleSubscriptionInfo(supabase, user.id, moduleSlug),
      supabase.from('courses').select('id').eq('module', moduleSlug).eq('published', true),
      supabase.from('course_progress').select('course_id').eq('user_id', user.id).eq('completed', true),
      supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('module', moduleSlug),
    ])

    const courseIds = new Set((coursesResult.data ?? []).map(c => c.id))
    const completedCourses = (progressResult.data ?? []).filter(p => courseIds.has(p.course_id)).length
    const totalCourses = courseIds.size
    const communityPosts = postsResult.count ?? 0
    const aiUsed = subInfo.aiQueriesThisMonth
    const aiQuota = MODULE_AI_QUOTA[subInfo.tier]

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">My {moduleName}</h1>
          <p className="text-secondary text-sm mt-1">Your {moduleName.toLowerCase()} overview at a glance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            title="Courses"
            value={`${completedCourses}/${totalCourses}`}
            subtitle={totalCourses > 0 ? `${Math.round((completedCourses / totalCourses) * 100)}% complete` : 'No courses available'}
            icon={GraduationCap}
            href={`/${moduleSlug}/courses`}
            accent={completedCourses > 0}
          />
          <SummaryCard
            title="Community Posts"
            value={communityPosts}
            subtitle={`Total posts in ${moduleName.toLowerCase()} feed`}
            icon={Users}
            href={`/${moduleSlug}/community`}
          />
          <SummaryCard
            title="AI Queries"
            value={`${aiUsed}/${aiQuota}`}
            subtitle="Used this month"
            icon={Bot}
            href={`/${moduleSlug}/${overviewSlug}`}
          />
        </div>
      </div>
    )
  }
}
