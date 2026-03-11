'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock'

interface SidebarShellProps {
  renderContent: (closeMobile: () => void) => React.ReactNode
  onRouteChange?: () => void
}

export function SidebarShell({ renderContent, onRouteChange }: SidebarShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false))
    onRouteChange?.()
  }, [pathname, onRouteChange])

  // Listen for hamburger menu event from Navbar
  useEffect(() => {
    const handler = () => setMobileOpen(true)
    window.addEventListener('open-mobile-menu', handler)
    return () => window.removeEventListener('open-mobile-menu', handler)
  }, [])

  useBodyScrollLock(mobileOpen)

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const content = renderContent(closeMobile)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden sidebar-surface flex flex-col h-dvh z-50 fixed inset-y-0 left-0 w-72',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
        style={{ transition: 'transform 0.2s ease-in-out' }}
      >
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:sticky lg:top-14 lg:shrink-0 sidebar-surface flex-col lg:h-[calc(100dvh-3.5rem)]">
        {content}
      </aside>
    </>
  )
}
