import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  viewAllHref?: string
  viewAllLabel?: string
}

export function SectionHeader({ title, viewAllHref, viewAllLabel = 'View all' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</h2>
      {viewAllHref && (
        <Link href={viewAllHref} className="text-xs text-accent hover:underline">
          {viewAllLabel}
        </Link>
      )}
    </div>
  )
}
