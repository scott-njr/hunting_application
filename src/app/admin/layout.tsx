import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Navbar } from '@/components/layout/navbar'
import { getUserHighestTier } from '@/lib/modules'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: member }, memberTier] = await Promise.all([
    supabase
      .from('user_profile')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('members')
      .select('is_admin')
      .eq('id', user.id)
      .single(),
    getUserHighestTier(supabase, user.id),
  ])

  if (!member?.is_admin) redirect('/home')

  return (
    <div className="min-h-dvh bg-base text-primary flex flex-col">
      <Navbar showHamburger />
      <div className="flex flex-1 min-h-0">
        <AdminSidebar
          memberName={profile?.display_name ?? null}
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
