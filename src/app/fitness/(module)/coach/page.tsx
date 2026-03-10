import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FitnessCoachChat } from '@/components/fitness/coach/fitness-coach-chat'
import { Bot } from 'lucide-react'

export default async function FitnessCoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Bot className="h-5 w-5 text-accent-hover" />
        <h1 className="text-2xl font-bold text-primary">AI Fitness Coach</h1>
      </div>
      <p className="text-secondary text-sm">
        Ask anything about your training plans, workouts, or progress. Your coach has access to all your fitness data.
      </p>
      <FitnessCoachChat userId={user.id} />
    </div>
  )
}
