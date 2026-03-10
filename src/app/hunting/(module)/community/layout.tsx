import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { getUserModuleTier } from '@/lib/modules'
import { UpgradeGate } from '@/components/dashboard/upgrade-gate'
import { GuidelinesGate } from '@/components/community/guidelines-gate'
import { CURRENT_GUIDELINES_VERSION } from '@/lib/community-guidelines'

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [tier, { data: member }] = await Promise.all([
    getUserModuleTier(supabase, user.id, 'hunting'),
    supabase
      .from('members')
      .select('community_guidelines_version')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const guidelinesVersion = member?.community_guidelines_version ?? 0
  const guidelinesAccepted = guidelinesVersion >= CURRENT_GUIDELINES_VERSION

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Users className="h-5 w-5 text-accent-hover" />
        <h1 className="text-2xl font-bold text-primary">Community</h1>
      </div>
      <p className="text-secondary text-sm mb-6">
        Connect with verified hunters, find buddies in your area, and get matched with mentors.
      </p>

      <UpgradeGate
        requiredTier="basic"
        currentTier={tier}
        feature="Member Community"
        description="Upgrade to Basic to connect with other Scout hunters and build your trusted circle."
      />

      {tier !== 'free' && !guidelinesAccepted && (
        <GuidelinesGate isUpdate={guidelinesVersion > 0} />
      )}

      {tier !== 'free' && guidelinesAccepted && children}
    </div>
  )
}
