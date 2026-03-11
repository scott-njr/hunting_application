import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 5000
const VALID_CATEGORIES = ['bug', 'feature_request', 'content_error', 'other'] as const

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const issueModule = searchParams.get('module') ?? 'hunting'

  const { data: issues, error } = await supabase
    .from('issue_reports')
    .select('id, module, category, title, description, page_url, status, resolution, resolved_at, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('module', issueModule as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ issues: issues ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { category, title, description, page_url, module: issueModule } = body
  const safeModule = String(issueModule ?? 'hunting').trim() as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'

  // Validate category
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Validate title
  const trimmedTitle = String(title ?? '').trim()
  if (!trimmedTitle) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` }, { status: 400 })
  }

  // Validate description
  const trimmedDescription = String(description ?? '').trim()
  if (!trimmedDescription) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }
  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` }, { status: 400 })
  }

  const safePageUrl = page_url ? String(page_url).trim().slice(0, 500) : null

  const { data: issue, error } = await supabase
    .from('issue_reports')
    .insert({
      user_id: user.id,
      module: safeModule,
      category: category as typeof VALID_CATEGORIES[number],
      title: trimmedTitle,
      description: trimmedDescription,
      page_url: safePageUrl,
    })
    .select('id, module, category, title, description, page_url, status, created_at')
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ issue })
}
