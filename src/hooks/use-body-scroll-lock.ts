'use client'

import { useEffect } from 'react'

/** Lock body scroll when `isLocked` is true. Restores on cleanup. */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isLocked])
}
