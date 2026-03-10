import Link from 'next/link'
import {
  Crosshair, Target, Shield, Heart, Fish, Dumbbell,
} from 'lucide-react'
import type { ModuleSlug } from '@/lib/modules'

const MODULE_ICONS: Record<ModuleSlug, React.ElementType> = {
  hunting: Crosshair,
  archery: Target,
  firearms: Shield,
  medical: Heart,
  fishing: Fish,
  fitness: Dumbbell,
}

interface CourseModule {
  slug: ModuleSlug
  name: string
  completed: number
  total: number
}

export function CourseProgressRow({ modules }: { modules: CourseModule[] }) {
  if (modules.length === 0) return null

  return (
    <div className="space-y-2">
      {modules.map(mod => {
        const Icon = MODULE_ICONS[mod.slug]
        const pct = mod.total > 0 ? (mod.completed / mod.total) * 100 : 0

        return (
          <Link
            key={mod.slug}
            href={`/${mod.slug}/courses`}
            className="flex items-center gap-3 rounded-lg border border-subtle bg-surface px-4 py-3 hover:border-default transition-colors"
          >
            <Icon className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="text-primary text-sm font-medium w-20">{mod.name}</span>
            <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-secondary flex-shrink-0 w-16 text-right">
              {mod.completed}/{mod.total}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
