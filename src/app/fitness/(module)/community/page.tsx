import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedPanel } from '@/components/community/feed-panel'
import { PeopleSidebar } from '@/components/community/people-sidebar'

export default async function FitnessCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: friendships } = await supabase
    .from('my_friends')
    .select('friendship_id, friend_id, display_name, email, direction, status, created_at')
    .order('display_name')

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <FeedPanel currentUserId={user.id} module="fitness" />
      </div>

      <div className="hidden lg:block w-80 shrink-0">
        <PeopleSidebar
          initialFriends={friendships ?? []}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
