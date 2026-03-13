'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'

interface SidebarDrawerHeaderProps {
  onClose: () => void
}

export function SidebarDrawerHeader({ onClose }: SidebarDrawerHeaderProps) {
  return (
    <div className="lg:hidden mb-3 flex items-center justify-between">
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <PraeviusWordmark size="sm" />
      </Link>
      <button
        type="button"
        onClick={onClose}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-primary transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
