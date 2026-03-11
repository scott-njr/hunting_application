'use client'

import { useEffect, useState, useRef, useSyncExternalStore, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Module-level cache so auth state persists across client-side navigations
let cachedUser: { id: string; email?: string } | null = null
let cacheResolved = false
let version = 0
const listeners = new Set<() => void>()

function notify() {
  version++
  listeners.forEach((l) => l())
}

export function clearAuthCache() {
  cachedUser = null
  cacheResolved = true
  notify()
}

export function useAuthCached() {
  // Subscribe to cache changes so clearAuthCache triggers re-render
  const ver = useSyncExternalStore(
    useCallback((cb: () => void) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    }, []),
    () => version,
    () => version,
  )

  const [user, setUser] = useState<{ id: string; email?: string } | null>(cachedUser)
  const [loading, setLoading] = useState(!cacheResolved)
  const checkedRef = useRef(false)

  useEffect(() => {
    if (checkedRef.current && cacheResolved) {
      // Cache was cleared (sign out) — sync local state
      queueMicrotask(() => {
        setUser(cachedUser)
        setLoading(false)
      })
      return
    }
    checkedRef.current = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      cachedUser = u
      cacheResolved = true
      setUser(u)
      setLoading(false)
    })
  }, [ver])

  return { user, loading }
}
