'use client'

import { useState } from 'react'

interface ExpandableTextProps {
  text: string
  className?: string
}

export function ExpandableText({ text, className = '' }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={className}>
      <p className={`text-secondary text-sm mt-2 ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-accent text-xs mt-1 hover:underline"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}
