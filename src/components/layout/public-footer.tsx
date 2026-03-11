import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-subtle bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link href="/about" className="hover:text-secondary transition-colors">About</Link>
            <Link href="/pricing" className="hover:text-secondary transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-secondary transition-colors">Contact</Link>
            <Link href="/changelog" className="hover:text-secondary transition-colors">Changelog</Link>
          </div>
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
