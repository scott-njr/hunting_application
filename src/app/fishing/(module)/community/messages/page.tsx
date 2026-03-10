import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessagesClient } from '@/components/community/messages-client'

export default async function FishingMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: friendships } = await supabase
    .from('my_friends')
    .select('friendship_id, friend_id, display_name, email, direction, status, created_at')
    .eq('status', 'accepted')
    .order('display_name')

  return (
    <MessagesClient
      friends={friendships ?? []}
      currentUserId={user.id}
    />
  )
}
