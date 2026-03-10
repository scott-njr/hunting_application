import Link from 'next/link'
import { Lock } from 'lucide-react'
import { type ModuleTier, MODULE_TIER_LABELS, hasModuleAccess } from '@/lib/modules'

interface UpgradeGateProps {
  requiredTier: ModuleTier
  currentTier: ModuleTier
  feature: string
  description: string
  module?: string
}

export function UpgradeGate({ requiredTier, currentTier, feature, description, module: moduleProp }: UpgradeGateProps) {
  if (hasModuleAccess(currentTier, requiredTier)) return null

  const params = new URLSearchParams({ upgrade: requiredTier })
  if (moduleProp) params.set('module', moduleProp)

  return (
    <div className="rounded-lg border border-default bg-elevated p-6 text-center">
      <div className="flex justify-center mb-3">
        <div className="rounded-full bg-elevated p-3">
          <Lock className="h-5 w-5 text-secondary" />
        </div>
      </div>
      <h3 className="text-primary font-semibold mb-1">{feature}</h3>
      <p className="text-secondary text-sm mb-4 max-w-sm mx-auto">{description}</p>
      <Link
        href={`/pricing?${params.toString()}`}
        className="inline-block btn-primary font-semibold
                   rounded px-5 py-2 text-sm transition-colors"
      >
        Upgrade to {MODULE_TIER_LABELS[requiredTier]}
      </Link>
    </div>
  )
}
