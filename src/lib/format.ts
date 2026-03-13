/**
 * Shared formatting utilities — single source of truth for timeAgo, initials, displayLabel.
 */

interface TimeAgoOptions {
  /** Omit "ago" suffix (e.g., "5m" instead of "5m ago") */
  compact?: boolean
  /** Omit date fallback for >7 days — just return day count (e.g., "14d") */
  daysOnly?: boolean
}

export function timeAgo(dateStr: string, opts?: TimeAgoOptions): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  const suffix = opts?.compact ? '' : ' ago'

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m${suffix}`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h${suffix}`

  const days = Math.floor(hours / 24)

  if (opts?.daysOnly) return `${days}d`
  if (days < 7) return `${days}d${suffix}`

  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function initials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function displayLabel(f: { display_name: string | null; email: string }): string {
  return f.display_name || f.email
}
