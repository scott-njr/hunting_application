'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clearAuthCache } from '@/lib/use-auth-cached'

/** Returns a sign-out handler that clears auth state and redirects to home. */
export function useSignOut() {
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuthCache()
    router.push('/')
    router.refresh()
  }, [router])

  return handleSignOut
}
