import { NextResponse, type NextRequest } from 'next/server'

/**
 * API Response Helpers
 *
 * Standard response shapes:
 *   GET single:    apiOk({ plan: {...} })
 *   GET list:      apiOk({ posts: [...] })
 *   POST create:   apiOk({ post: {...} }, 201)
 *   POST action:   apiDone()  or  apiDone({ sent: 5 })
 *   PATCH update:  apiOk({ issue: {...} })
 *   DELETE:        apiDone()
 *   Error:         apiError('Not found', 404)
 */

/** Success with resource data — use named keys */
export function apiOk<T extends Record<string, unknown>>(
  body: T,
  status = 200,
): NextResponse {
  return NextResponse.json(body, { status })
}

/** Mutation acknowledgment — no resource to return */
export function apiDone(extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: true, ...extra })
}

/** Error response */
export function apiError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error, ...extra }, { status })
}

// ── Common shortcuts ──

export const unauthorized = () => apiError('Unauthorized', 401)
export const forbidden = () => apiError('Forbidden', 403)
export const notFound = (msg = 'Not found') => apiError(msg, 404)
export const badRequest = (msg: string) => apiError(msg, 400)
export const serverError = (msg = 'Something went wrong') => apiError(msg, 500)

// ── Request parsing ──

/** Safely parse JSON body — returns 400 on malformed JSON instead of unhandled error */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseBody<T = Record<string, any>>(
  req: Request,
): Promise<T | NextResponse> {
  try {
    return await req.json() as T
  } catch {
    return badRequest('Invalid JSON')
  }
}

/** Type guard: true if parseBody returned an error response */
export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}

// ── CSRF ──

/** Check Origin header against the app's host — returns 403 response if cross-origin, null if OK */
export function validateOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (origin && host && !origin.includes(host)) {
    return apiError('Cross-origin request blocked', 403)
  }
  return null
}
