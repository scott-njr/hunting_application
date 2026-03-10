'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useAuthCached } from '@/lib/use-auth-cached'
import { useAuthModal } from '@/components/auth/auth-modal-provider'

interface ModuleCtaProps {
  /** Authenticated destination, e.g. "/hunting/deadlines" or "/archery/courses" */
  moduleHref: string
  /** Module display name, e.g. "Hunting" */
  moduleName: string
  /** Render inline (left-aligned, no wrapper) vs centered block */
  inline?: boolean
}

export function ModuleCta({ moduleHref, moduleName, inline }: ModuleCtaProps) {
  const { user, loading } = useAuthCached()
  const { openAuthModal } = useAuthModal()

  if (loading) return null

  if (user) {
    return (
      <div className={inline ? 'mt-6' : 'text-center'}>
        <Link href={moduleHref} className="btn-primary inline-flex items-center gap-2 text-sm rounded-full px-8 py-2.5 font-semibold">
          Open {moduleName} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className={inline ? 'mt-6' : 'text-center'}>
      <button onClick={() => openAuthModal('signup')} className="btn-primary inline-flex items-center gap-2 text-sm rounded-full px-8 py-2.5 font-semibold">
        Get Started <ArrowRight className="h-4 w-4" />
      </button>
      {!inline && <p className="text-muted text-xs mt-3">Free tier available. No credit card required.</p>}
    </div>
  )
}
