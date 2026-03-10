import Link from 'next/link'
import { cn } from '@/lib/utils'

interface UpcomingItem {
  date: string        // ISO date string (YYYY-MM-DD)
  title: string
  subtitle?: string
  href?: string
  badge?: string      // optional status badge text
}

interface UpcomingListProps {
  items: UpcomingItem[]
  emptyMessage?: string
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDateBadge(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  }
}

export function UpcomingList({ items, emptyMessage = 'Nothing upcoming' }: UpcomingListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted py-4">{emptyMessage}</p>
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const days = daysUntil(item.date)
        const { month, day } = formatDateBadge(item.date)
        const urgent = days >= 0 && days <= 7

        const content = (
          <div className="flex items-center gap-3 bg-surface border border-subtle rounded-lg p-3 hover:border-default transition-colors">
            {/* Date badge */}
            <div className={cn(
              'flex flex-col items-center justify-center w-11 h-11 rounded-lg shrink-0 text-center',
              urgent ? 'bg-amber-500/15 text-amber-400' : 'bg-elevated text-secondary'
            )}>
              <span className="text-[9px] font-bold leading-none">{month}</span>
              <span className="text-base font-bold leading-tight">{day}</span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary truncate">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-muted truncate">{item.subtitle}</p>
              )}
            </div>

            {/* Right side: countdown + optional badge */}
            <div className="flex items-center gap-2 shrink-0">
              {item.badge && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                  {item.badge}
                </span>
              )}
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                days <= 0 ? 'text-accent' : urgent ? 'text-amber-400' : 'text-muted'
              )}>
                {days <= 0 ? 'Today!' : `${days}d`}
              </span>
            </div>
          </div>
        )

        if (item.href) {
          return <Link key={i} href={item.href} className="block">{content}</Link>
        }
        return <div key={i}>{content}</div>
      })}
    </div>
  )
}
