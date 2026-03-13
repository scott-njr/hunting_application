import { createHmac, timingSafeEqual } from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { apiDone, badRequest, forbidden, serverError } from '@/lib/api-response'

const VALID_CATEGORIES = ['release_notes', 'newsletter', 'blog', 'announcement', 'all'] as const

function verifyUnsubToken(email: string, category: string, token: string): boolean {
  const secret = process.env.UNSUB_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(`${email}|${category}`).digest('hex')
  if (token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, category, token } = body as {
      email?: string
      category?: string
      token?: string
    }

    if (!email || !category || !token) {
      return badRequest('Missing required fields')
    }

    if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      return badRequest('Invalid category')
    }

    if (!verifyUnsubToken(email, category, token)) {
      return forbidden()
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert opt-out, ignore conflict if already unsubscribed
    const { error } = await admin
      .from('email_unsubscribe')
      .upsert(
        { email, category },
        { onConflict: 'email,category', ignoreDuplicates: true }
      )

    if (error) {
      console.error('[Unsubscribe]', error)
      return serverError()
    }

    return apiDone()
  } catch {
    return serverError()
  }
}
