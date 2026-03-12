import Link from 'next/link'

const nav2Links = [
  { label: 'Command Center', href: '/dashboard' },
  { label: 'Hunting', href: '/hunting' },
  { label: 'Archery', href: '/archery' },
  { label: 'Fishing', href: '/fishing' },
  { label: 'Spearfishing', href: '/spearfishing' },
  { label: 'Butcher Block', href: '/butcher-block' },
  { label: 'Firearms', href: '/firearms' },
  { label: 'Medical', href: '/medical' },
  { label: 'Fitness', href: '/fitness' },
  { label: 'Mindset', href: '/mindset' },
  { label: 'Blog', href: '/blog' },
  { label: 'Newsletter', href: '/newsletter' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export function Nav2() {
  return (
    <nav className="border-b border-subtle/50 bg-surface/60 backdrop-blur-sm sticky top-14 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1.5 -mx-1">
          {nav2Links.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="text-xs font-medium text-muted hover:text-primary px-2 py-2.5 rounded-md hover:bg-elevated/60 transition-colors whitespace-nowrap tracking-wide uppercase"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
