'use client'

import { useAuthModal } from '@/components/auth/auth-modal-provider'

interface AuthCtaButtonProps {
  view?: 'login' | 'signup'
  className?: string
  children: React.ReactNode
}

/**
 * A button that opens the auth modal. Use in place of <Link href="/auth/login">
 * or <Link href="/auth/signup"> in server components that can't use hooks directly.
 */
export function AuthCtaButton({ view = 'signup', className, children }: AuthCtaButtonProps) {
  const { openAuthModal } = useAuthModal()

  return (
    <button onClick={() => openAuthModal(view)} className={className}>
      {children}
    </button>
  )
}
