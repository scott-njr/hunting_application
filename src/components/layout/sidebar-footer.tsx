'use client'

import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSignOut } from '@/hooks/use-sign-out'
import { MODULE_TIER_LABELS, type ModuleTier } from '@/lib/modules'

interface SidebarFooterProps {
  memberName: string | null
  memberEmail: string
  memberTier: ModuleTier
}

export function SidebarFooter({ memberName, memberEmail, memberTier }: SidebarFooterProps) {
  const handleSignOut = useSignOut()

  return (
    <div className="px-4 py-4 border-t border-subtle">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="text-primary text-sm font-medium truncate">{memberName ?? 'Member'}</p>
          <p className="text-muted text-xs truncate">{memberEmail}</p>
        </div>
        <span className={cn('ml-2 px-2 py-0.5 rounded text-xs font-semibold uppercase shrink-0', `tier-${memberTier}`)}>
          {MODULE_TIER_LABELS[memberTier]}
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 text-muted hover:text-primary text-xs transition-colors min-h-[44px]"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  )
}
