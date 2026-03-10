import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleSidebar } from '@/components/layout/module-sidebar'
import { ModuleHeader } from '@/components/layout/module-header'
import { getUserModuleTier } from '@/lib/modules'

export default async function FirearmsModuleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: member }, moduleTier] = await Promise.all([
    supabase
      .from('members')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle(),
    getUserModuleTier(supabase, user.id, 'firearms'),
  ])

  if (moduleTier === 'free') redirect('/pricing?upgrade=basic&module=firearms')

  return (
    <div className="min-h-dvh bg-base text-primary flex flex-col">
      <ModuleHeader userId={user.id} email={user.email ?? ''} messagesHref="/firearms/community/messages" />
      <div className="flex flex-1 min-h-0">
        <ModuleSidebar
          moduleSlug="firearms"
          moduleTier={moduleTier}
          memberName={member?.full_name ?? null}
          memberEmail={user.email ?? ''}
        />
        <main className="flex-1 min-w-0 px-4 py-4 pt-16 sm:px-6 sm:py-6 sm:pt-18 lg:p-8 lg:pt-8">{children}</main>
      </div>
    </div>
  )
}
