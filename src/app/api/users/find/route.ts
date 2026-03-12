import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { apiOk, unauthorized, badRequest } from '@/lib/api-response'

// Uses service role key — bypasses RLS to look up Scout users.
// Returns minimal info only: user_id + display_name + email. Never returns sensitive data.
//
// ?email=  — exact single-result lookup (used by legacy flows)
// ?q=      — search by display_name or email prefix, returns array (used by Community page)

export async function GET(req: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return unauthorized()

  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim()

  if (!email && !q) return badRequest('email or q parameter required')

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Exact email lookup (legacy single-result path) ──────────────────────────
  if (email) {
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!member) return apiOk({ found: false })

    const { data: profile } = await supabase
      .from('user_profile')
      .select('display_name, user_name')
      .eq('id', member.id)
      .maybeSingle()

    return apiOk({ found: true, user_id: member.id, display_name: profile?.display_name ?? null, user_name: profile?.user_name ?? null })
  }

  // ── Search by display_name or email prefix (community search) ───────────────
  if (q && q.length < 2) return apiOk({ results: [] })

  // Sanitize q to prevent PostgREST filter metacharacter injection
  const sanitizedQ = (q as string).replace(/[(),."'\\]/g, '')
  if (!sanitizedQ) return apiOk({ results: [] })

  // Search user_profile by display_name or user_name
  const { data: byName } = await supabase
    .from('user_profile')
    .select('id, display_name, user_name, avatar_url')
    .or(`display_name.ilike.%${sanitizedQ}%,user_name.ilike.%${sanitizedQ}%`)
    .limit(10)

  // Merge and deduplicate by user id — return only safe fields (no email/PII)
  const userIds = new Set<string>()
  const results: { user_id: string; display_name: string | null; user_name: string | null; avatar_url: string | null }[] = []

  for (const p of byName ?? []) {
    if (userIds.has(p.id)) continue
    userIds.add(p.id)
    results.push({ user_id: p.id, display_name: p.display_name, user_name: p.user_name ?? null, avatar_url: p.avatar_url ?? null })
  }

  return apiOk({ results })
}
