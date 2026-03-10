import Link from 'next/link'
import {
  Tent, Target, Crosshair, Heart, Fish, Dumbbell, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MODULE_TIER_LABELS, MODULE_TIER_COLORS, type ModuleSlug, type ModuleSubscriptionInfo } from '@/lib/modules'

const ICON_MAP: Record<string, React.ElementType> = {
  Tent, Target, Crosshair, Heart, Fish, Dumbbell,
}

const MODULE_ENTRY: Record<ModuleSlug, string> = {
  hunting: '/hunting/deadlines',
  archery: '/archery/courses',
  firearms: '/firearms/courses',
  medical: '/medical/courses',
  fishing: '/fishing/courses',
  fitness: '/fitness/my-plan',
}

interface ModuleCardProps {
  slug: ModuleSlug
  name: string
  description: string
  icon: string
  subscription: ModuleSubscriptionInfo | null
  quickLinks: { label: string; href: string }[]
  planSummary?: string
}

export function ModuleCard({ slug, name, description, icon, subscription, quickLinks, planSummary }: ModuleCardProps) {
  const Icon = ICON_MAP[icon] ?? Tent
  const isSubscribed = !!subscription && subscription.tier !== 'free'

  if (!isSubscribed) {
    return (
      <div className="rounded-lg border border-dashed border-subtle bg-surface/50 p-4 opacity-60 hover:opacity-90 transition-all">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted" />
          <Link href={`/${slug}`} className="text-secondary font-medium text-sm hover:text-primary transition-colors">
            {name}
          </Link>
        </div>
        <p className="text-muted text-xs mt-1.5 mb-3">{description}</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add {name} Module
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface p-4 hover:border-default transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-accent" />
          <Link href={MODULE_ENTRY[slug]} className="text-primary font-medium text-sm hover:text-accent transition-colors">
            {name}
          </Link>
        </div>
        <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', MODULE_TIER_COLORS[subscription.tier])}>
          {MODULE_TIER_LABELS[subscription.tier]}
        </span>
      </div>
      {planSummary && (
        <p className="text-muted text-xs mb-2 ml-8">{planSummary}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
