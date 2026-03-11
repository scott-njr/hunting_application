import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleSidebar } from '@/components/layout/module-sidebar'
import { ModuleHeader } from '@/components/layout/module-header'
import { getUserModuleTier } from '@/lib/modules'
import type { ModuleSlug } from '@/lib/modules'

/** Creates a module layout component for the given module slug. */
export function createModuleLayout(moduleSlug: ModuleSlug) {
  return async function ModuleLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const [{ data: profile }, moduleTier] = await Promise.all([
      supabase
        .from('user_profile')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle(),
      getUserModuleTier(supabase, user.id, moduleSlug),
    ])

    if (moduleTier === 'free') redirect(`/pricing?upgrade=basic&module=${moduleSlug}`)

    return (
      <div className="min-h-dvh bg-base text-primary flex flex-col">
        <ModuleHeader userId={user.id} email={user.email ?? ''} />
        <div className="flex flex-1 min-h-0">
          <ModuleSidebar
            moduleSlug={moduleSlug}
            moduleTier={moduleTier}
            memberName={profile?.display_name ?? null}
            memberEmail={user.email ?? ''}
          />
          <main className="flex-1 min-w-0 px-4 py-4 pt-16 sm:px-6 sm:py-6 sm:pt-18 lg:p-8 lg:pt-8">{children}</main>
        </div>
      </div>
    )
  }
}
