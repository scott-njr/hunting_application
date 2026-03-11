import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GraduationCap, Users, Bot } from 'lucide-react'
import { getUserModuleSubscriptionInfo, MODULE_AI_QUOTA } from '@/lib/modules'
import { SummaryCard } from '@/components/module-overview/summary-card'

export default async function MyArcheryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    subInfo,
    coursesResult,
    progressResult,
    postsResult,
  ] = await Promise.all([
    getUserModuleSubscriptionInfo(supabase, user.id, 'archery'),
    supabase.from('courses').select('id').eq('module', 'archery').eq('published', true),
    supabase.from('course_progress').select('course_id').eq('user_id', user.id).eq('completed', true),
    supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('module', 'archery'),
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
        <h1 className="text-2xl font-bold text-primary">My Archery</h1>
        <p className="text-secondary text-sm mt-1">Your archery overview at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Courses"
          value={`${completedCourses}/${totalCourses}`}
          subtitle={totalCourses > 0 ? `${Math.round((completedCourses / totalCourses) * 100)}% complete` : 'No courses available'}
          icon={GraduationCap}
          href="/archery/courses"
          accent={completedCourses > 0}
        />
        <SummaryCard
          title="Community Posts"
          value={communityPosts}
          subtitle="Total posts in archery feed"
          icon={Users}
          href="/archery/community"
        />
        <SummaryCard
          title="AI Queries"
          value={`${aiUsed}/${aiQuota}`}
          subtitle="Used this month"
          icon={Bot}
          href="/archery/my-archery"
        />
      </div>
    </div>
  )
}
