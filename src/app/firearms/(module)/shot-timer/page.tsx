import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Timer } from 'lucide-react'
import { ShotTimerClient } from '@/components/firearms/shot-timer/shot-timer-client'

export default async function ShotTimerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { data: sessions } = await supabase
    .from('firearms_shot_session')
    .select('*')
    .eq('user_id', user.id)
    .order('created_on', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Timer className="h-6 w-6 text-accent" />
        <h1 className="text-primary font-bold text-xl">Shot Timer</h1>
      </div>
      <ShotTimerClient userId={user.id} userName={profile?.display_name ?? 'Shooter'} initialSessions={sessions ?? []} />
    </div>
  )
}
