/**
 * Validates a redirect path to prevent open redirect attacks.
 * Only allows paths starting with "/" and not "//".
 */
export function safeRedirect(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/home'
  return path
}
