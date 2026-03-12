import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 5000
const VALID_CATEGORIES = ['bug', 'feature_request', 'content_error', 'other'] as const

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const issueModule = searchParams.get('module') ?? 'hunting'

  const { data: issues, error } = await supabase
    .from('issue_reports')
    .select('id, module, category, title, description, page_url, status, resolution, resolved_at, created_on, updated_on')
    .eq('user_id', user.id)
    .eq('module', issueModule as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness')
    .order('created_on', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[Issues] fetch error:', error)
    return serverError()
  }

  return apiOk({ issues: issues ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { category, title, description, page_url, module: issueModule } = body as {
    category: typeof VALID_CATEGORIES[number]
    title: string
    description: string
    page_url: string
    module: string
  }
  const safeModule = String(issueModule ?? 'hunting').trim() as 'hunting' | 'archery' | 'firearms' | 'fishing' | 'medical' | 'fitness'

  // Validate category
  if (!VALID_CATEGORIES.includes(category)) {
    return badRequest('Invalid category')
  }

  // Validate title
  const trimmedTitle = String(title ?? '').trim()
  if (!trimmedTitle) {
    return badRequest('Title is required')
  }
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return badRequest(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`)
  }

  // Validate description
  const trimmedDescription = String(description ?? '').trim()
  if (!trimmedDescription) {
    return badRequest('Description is required')
  }
  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return badRequest(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`)
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
    .select('id, module, category, title, description, page_url, status, created_on')
    .single()

  if (error) {
    console.error('[Issues] insert error:', error)
    return serverError()
  }

  return apiOk({ issue }, 201)
}
