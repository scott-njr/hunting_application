import { useEffect, useRef, useState } from 'react'

// Module-level cache so count persists across mounts without flashing
let cachedCount = 0
let cacheUid: string | null = null

/**
 * Fetches and caches the count of incoming pending friend requests.
 * Used by Navbar to show notification badges.
 */
export function usePendingFriendCount(userId: string | null | undefined, enabled = true) {
  const [count, setCount] = useState(cacheUid === userId ? cachedCount : 0)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!userId || !enabled || (fetchedRef.current && cacheUid === userId)) return
    fetchedRef.current = true
    cacheUid = userId

    fetch('/api/friends')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.friends) return
        const pending = (data.friends as Array<{ direction: string; status: string }>)
          .filter(f => f.status === 'pending' && f.direction === 'received').length
        cachedCount = pending
        setCount(pending)
      })
      .catch(() => {})
  }, [userId, enabled])

  return count
}

/** Reset the cache (call on sign-out). */
export function resetPendingFriendCache() {
  cachedCount = 0
  cacheUid = null
}
