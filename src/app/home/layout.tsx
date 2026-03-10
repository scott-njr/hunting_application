import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserModuleSubscriptions, getUserHighestTier, type ModuleSlug } from '@/lib/modules'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { ModuleHeader } from '@/components/layout/module-header'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: member }, subscriptions, memberTier] = await Promise.all([
    supabase
      .from('members')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle(),
    getUserModuleSubscriptions(supabase, user.id),
    getUserHighestTier(supabase, user.id),
  ])

  const subscribedModules = Object.keys(subscriptions) as ModuleSlug[]

  return (
    <div className="min-h-dvh bg-base text-primary flex flex-col">
      <ModuleHeader userId={user.id} email={user.email ?? ''} messagesHref="/home/messages" />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar
          subscribedModules={subscribedModules}
          memberName={member?.full_name ?? null}
          memberEmail={user.email ?? ''}
          memberTier={memberTier}
        />
        <main className="flex-1 min-w-0 px-4 py-4 pt-16 sm:px-6 sm:py-6 sm:pt-18 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
