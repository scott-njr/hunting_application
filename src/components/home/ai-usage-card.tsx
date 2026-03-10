import Link from 'next/link'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MODULE_TIER_LABELS, type ModuleTier, type ModuleSlug } from '@/lib/modules'

interface ModuleUsage {
  slug: ModuleSlug
  name: string
  tier: ModuleTier
  used: number
  quota: number
}

interface AiUsageCardProps {
  moduleUsage: ModuleUsage[]
}

function UsageBar({ used, quota, label, tierLabel }: { used: number; quota: number; label: string; tierLabel: string }) {
  const pct = quota > 0 ? Math.min((used / quota) * 100, 100) : 0
  const remaining = Math.max(0, quota - used)
  const isLow = quota > 0 && remaining <= Math.ceil(quota * 0.2)
  const isOut = remaining === 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-xs">{label}</span>
          <span className="text-[10px] text-muted">({tierLabel})</span>
        </div>
        <span className={cn(
          'text-xs font-medium',
          isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-primary'
        )}>
          {used}/{quota}
        </span>
      </div>
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-accent'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function AiUsageCard({ moduleUsage }: AiUsageCardProps) {
  const paidModules = moduleUsage.filter(m => m.quota > 0)

  if (paidModules.length === 0) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-4 w-4 text-accent" />
          <h3 className="text-primary font-semibold text-sm">AI Queries</h3>
        </div>
        <p className="text-muted text-xs">Upgrade a module to Pro to unlock AI features.</p>
        <Link href="/pricing" className="text-[10px] text-accent hover:text-accent-hover transition-colors mt-1 inline-block">
          View plans &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" />
          <h3 className="text-primary font-semibold text-sm">AI Queries This Month</h3>
        </div>
        {paidModules.some(m => m.used >= m.quota) && (
          <Link href="/pricing" className="text-[10px] text-accent hover:text-accent-hover transition-colors">
            Upgrade &rarr;
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {paidModules.map(m => (
          <UsageBar
            key={m.slug}
            used={m.used}
            quota={m.quota}
            label={m.name}
            tierLabel={MODULE_TIER_LABELS[m.tier]}
          />
        ))}
      </div>
    </div>
  )
}
