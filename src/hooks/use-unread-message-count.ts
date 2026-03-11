import { useEffect, useRef, useState } from 'react'

// Module-level cache so count persists across mounts without flashing
let cachedCount = 0
let cacheUid: string | null = null

/**
 * Fetches and caches the count of unread messages.
 * Used by Navbar and ModuleSidebar to show notification badges.
 */
export function useUnreadMessageCount(userId: string | null | undefined, enabled = true) {
  const [count, setCount] = useState(cacheUid === userId ? cachedCount : 0)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!userId || !enabled || (fetchedRef.current && cacheUid === userId)) return
    fetchedRef.current = true
    cacheUid = userId

    fetch('/api/messages/unread-count')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data == null) return
        cachedCount = data.count ?? 0
        setCount(cachedCount)
      })
      .catch(() => {})
  }, [userId, enabled])

  return count
}

/** Reset the cache (call on sign-out). */
export function resetUnreadMessageCache() {
  cachedCount = 0
  cacheUid = null
}
