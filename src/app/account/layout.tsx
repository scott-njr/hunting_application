import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 sm:px-6 sm:py-20">
        {children}
      </main>
    </div>
  )
}
