import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Uses service role key — bypasses RLS to look up Scout users.
// Returns minimal info only: user_id + display_name + email. Never returns sensitive data.
//
// ?email=  — exact single-result lookup (used by legacy flows)
// ?q=      — search by display_name or email prefix, returns array (used by Community page)

export async function GET(req: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim()

  if (!email && !q) return NextResponse.json({ found: false }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Exact email lookup (legacy single-result path) ──────────────────────────
  if (email) {
    const { data: member } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('email', email)
      .maybeSingle()

    if (!member) return NextResponse.json({ found: false })

    const { data: profile } = await supabase
      .from('hunter_profiles')
      .select('display_name')
      .eq('id', member.id)
      .maybeSingle()

    const displayName = profile?.display_name || member.full_name || null

    return NextResponse.json({ found: true, user_id: member.id, display_name: displayName })
  }

  // ── Search by display_name or email prefix (community search) ───────────────
  if (q && q.length < 2) return NextResponse.json({ results: [] })

  // Search members by email prefix
  const { data: byEmail } = await supabase
    .from('members')
    .select('id, email, full_name')
    .ilike('email', `${q}%`)
    .limit(10)

  // Search hunter_profiles by display_name prefix
  const { data: byName } = await supabase
    .from('hunter_profiles')
    .select('id, display_name')
    .ilike('display_name', `%${q}%`)
    .limit(10)

  // Merge and deduplicate by user id
  const userIds = new Set<string>()
  const results: { user_id: string; display_name: string | null; email: string }[] = []

  for (const p of byName ?? []) {
    if (userIds.has(p.id)) continue
    userIds.add(p.id)
    // Fetch their email
    const member = (byEmail ?? []).find(m => m.id === p.id)
    const { data: m } = member ? { data: member } : await supabase
      .from('members')
      .select('email, full_name')
      .eq('id', p.id)
      .maybeSingle()
    if (m) results.push({ user_id: p.id, display_name: p.display_name, email: (m as { email: string }).email })
  }

  for (const m of byEmail ?? []) {
    if (userIds.has(m.id)) continue
    userIds.add(m.id)
    const { data: profile } = await supabase
      .from('hunter_profiles')
      .select('display_name')
      .eq('id', m.id)
      .maybeSingle()
    results.push({ user_id: m.id, display_name: profile?.display_name || m.full_name || null, email: m.email })
  }

  return NextResponse.json({ results })
}
