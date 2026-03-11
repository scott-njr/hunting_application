import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Fetch resolved issues with release tags — RLS allows public read for these
  const { data: issues, error } = await supabase
    .from('issue_reports')
    .select('id, module, category, title, resolution, release_tag, resolved_at')
    .eq('status', 'resolved')
    .not('release_tag', 'is', null)
    .order('resolved_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })

  // Group by release_tag
  const releaseMap = new Map<string, typeof issues>()
  for (const issue of issues ?? []) {
    const tag = issue.release_tag!
    if (!releaseMap.has(tag)) releaseMap.set(tag, [])
    releaseMap.get(tag)!.push(issue)
  }

  const releases = Array.from(releaseMap.entries()).map(([tag, items]) => ({
    tag,
    issues: items,
  }))

  return NextResponse.json({ releases })
}
