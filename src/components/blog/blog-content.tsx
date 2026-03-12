'use client'

import DOMPurify from 'dompurify'
import { useMemo } from 'react'

interface BlogContentProps {
  html: string
}

export function BlogContent({ html }: BlogContentProps) {
  const sanitized = useMemo(() => DOMPurify.sanitize(html), [html])

  return (
    <div
      className="prose-blog"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
