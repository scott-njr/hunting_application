'use client'

import IdentityForm from '@/components/profile/identity-form'
import HuntingPreferencesForm from '@/components/profile/hunting-preferences-form'
import FitnessProfileForm from '@/components/profile/fitness-profile-form'

function ModuleProfilePlaceholder({ moduleSlug }: { moduleSlug: string }) {
  const label = moduleSlug.charAt(0).toUpperCase() + moduleSlug.slice(1)
  return (
    <div>
      <h1 className="text-xl font-bold text-primary mb-3">{label} Profile</h1>
      <div className="glass-card border border-subtle rounded-lg p-6 text-center">
        <p className="text-muted text-sm">No module-specific profile fields yet.</p>
        <p className="text-muted text-xs mt-1">Module-specific settings will appear here as they are added.</p>
      </div>
    </div>
  )
}

export default function ProfilePage({ moduleSlug }: { moduleSlug?: string } = {}) {
  if (moduleSlug === 'hunting') return <HuntingPreferencesForm />
  if (moduleSlug === 'fitness') return <FitnessProfileForm />
  if (moduleSlug) return <ModuleProfilePlaceholder moduleSlug={moduleSlug} />
  return <IdentityForm />
}
