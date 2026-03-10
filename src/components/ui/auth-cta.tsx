'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

let cachedLoggedIn: boolean | null = null

/**
 * Renders `children` (the default CTA) for logged-out users.
 * For logged-in users, renders a link to `authedHref` with `authedLabel`.
 * Keeps the parent page static by isolating auth check in a client component.
 */
export function AuthCta({
  children,
  authedHref,
  authedLabel,
  className,
}: {
  children: React.ReactNode
  authedHref: string
  authedLabel: string
  className?: string
}) {
  const [loggedIn, setLoggedIn] = useState(cachedLoggedIn)

  useEffect(() => {
    if (cachedLoggedIn !== null) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      cachedLoggedIn = !!user
      setLoggedIn(!!user)
    })
  }, [])

  if (loggedIn) {
    return (
      <Link href={authedHref} className={className}>
        {authedLabel}
      </Link>
    )
  }

  return <>{children}</>
}
