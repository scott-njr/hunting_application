import { NextResponse } from 'next/server'
import { Resend } from 'resend'

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
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input.' },
        { status: 400 }
      )
    }

    // Sanitize
    const cleanName = sanitize(name).slice(0, MAX_NAME_LENGTH)
    const cleanEmail = email.trim().toLowerCase()
    const cleanMessage = sanitize(message).slice(0, MAX_MESSAGE_LENGTH)

    // Validate
    if (cleanName.length < 1) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (cleanMessage.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })
    }

    // Honeypot check — if a hidden field is filled, it's a bot
    if (body.website) {
      // Silently succeed to not tip off the bot
      return NextResponse.json({ success: true })
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
      // Dev fallback — log to console
      console.log('[Contact Form]', { name: cleanName, email: cleanEmail, message: cleanMessage })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
