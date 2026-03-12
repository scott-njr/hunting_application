import { Resend } from 'resend'
import { apiDone, apiError, badRequest, serverError } from '@/lib/api-response'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'info@leadthewild.co'
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_MESSAGE_LENGTH = 5000

// Simple rate limit: track IPs in memory (resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5 // max submissions
const RATE_WINDOW = 60 * 60 * 1000 // per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT
}

function sanitize(input: string): string {
  return input
    .replace(/[<>]/g, '') // strip HTML angle brackets
    .trim()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= MAX_EMAIL_LENGTH
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return apiError('Too many requests. Please try again later.', 429)
    }

    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return badRequest('All fields are required.')
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return badRequest('Invalid input.')
    }

    // Sanitize
    const cleanName = sanitize(name).slice(0, MAX_NAME_LENGTH)
    const cleanEmail = email.trim().toLowerCase()
    const cleanMessage = sanitize(message).slice(0, MAX_MESSAGE_LENGTH)

    // Validate
    if (cleanName.length < 1) {
      return badRequest('Name is required.')
    }

    if (!isValidEmail(cleanEmail)) {
      return badRequest('Please enter a valid email address.')
    }

    if (cleanMessage.length < 10) {
      return badRequest('Message must be at least 10 characters.')
    }

    // Honeypot check — if a hidden field is filled, it's a bot
    if (body.website) {
      // Silently succeed to not tip off the bot
      return apiDone()
    }

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Lead the Wild <noreply@praevius.com>',
        to: CONTACT_EMAIL,
        replyTo: cleanEmail,
        subject: `Contact Form: ${cleanName}`,
        text: `Name: ${cleanName}\nEmail: ${cleanEmail}\n\nMessage:\n${cleanMessage}`,
      })
    } else {
      // Dev fallback — log without PII
      console.warn('[Contact Form] Received (no RESEND_API_KEY set)')
    }

    return apiDone()
  } catch {
    return serverError('Something went wrong. Please try again.')
  }
}
