import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  href: string
  accent?: boolean
}

export function SummaryCard({ title, value, subtitle, icon: Icon, href, accent }: SummaryCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-surface border border-subtle rounded-lg p-4 hover:border-default transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          'p-2 rounded-lg',
          accent ? 'bg-accent/15 text-accent' : 'bg-elevated text-secondary'
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-sm font-medium text-secondary">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted mt-1">{subtitle}</p>
      )}
    </Link>
  )
}
