import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { HuntPlanDocument } from '@/lib/pdf/hunt-plan-document'
import { Resend } from 'resend'
import React from 'react'

// Rate limit: 5 shares/hour/IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60 * 60 * 1000

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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ huntId: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { huntId } = await params
    const { action, recipients } = await req.json() as {
      action: 'download' | 'email'
      recipients?: string[]
    }

    if (!action || !['download', 'email'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'email') {
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json({ error: 'At least one recipient email is required' }, { status: 400 })
      }
      if (recipients.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 recipients allowed' }, { status: 400 })
      }
      for (const email of recipients) {
        if (!isValidEmail(email)) {
          return NextResponse.json({ error: `Invalid email: ${email}` }, { status: 400 })
        }
      }
    }

    // Fetch all data in parallel
    const [planResult, membersResult, locationsResult, profileResult] = await Promise.all([
      supabase.from('hunt_plans').select('*').eq('id', huntId).eq('user_id', user.id).single(),
      supabase.from('hunt_members').select('display_name, email, phone, role, tag_status').eq('hunt_plan_id', huntId),
      supabase.from('hunt_locations').select('label, description, lat, lng, scout_report').eq('hunt_plan_id', huntId).order('created_at'),
      supabase.from('hunter_profiles').select('display_name').eq('id', user.id).single(),
    ])

    if (!planResult.data) {
      return NextResponse.json({ error: 'Hunt plan not found' }, { status: 404 })
    }

    const plan = planResult.data

    // Resolve gear items from gear_list IDs
    const gearIds = Array.isArray(plan.gear_list) ? (plan.gear_list as string[]) : []
    let gearItems: { name: string; category: string | null; brand: string | null }[] = []
    if (gearIds.length > 0) {
      const { data: gear } = await supabase
        .from('gear_items')
        .select('name, category, brand')
        .in('id', gearIds)
        .order('category')
        .order('name')
      gearItems = gear ?? []
    }

    const ownerName = profileResult.data?.display_name ?? 'Unknown'
    const ownerEmail = user.email ?? ''

    // Generate PDF
    const pdfElement = React.createElement(HuntPlanDocument, {
      plan,
      members: membersResult.data ?? [],
      locations: (locationsResult.data ?? []).map(loc => ({
        ...loc,
        scout_report: loc.scout_report as { text?: string; sections?: { key: string; title: string; rows: { label: string; value: string }[] }[] } | null,
      })),
      gearItems,
      ownerName,
      ownerEmail,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(pdfElement as any)

    if (action === 'download') {
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="hunt-plan-${slugify(plan.title)}.pdf"`,
        },
      })
    }

    // action === 'email'
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Lead the Wild <noreply@praevius.com>',
        to: recipients!,
        replyTo: ownerEmail,
        subject: `Hunt Plan: ${plan.title} — Shared by ${ownerName}`,
        text: [
          `${ownerName} shared a hunt plan with you.`,
          '',
          `Hunt: ${plan.title}`,
          `State: ${plan.state_name}${plan.unit ? ` — Unit ${plan.unit}` : ''}`,
          `Species: ${plan.species}`,
          plan.trip_start_date ? `Trip Dates: ${plan.trip_start_date}${plan.trip_end_date ? ` to ${plan.trip_end_date}` : ''}` : '',
          plan.emergency_contact_name ? `Emergency Contact: ${plan.emergency_contact_name}${plan.emergency_contact_phone ? ` (${plan.emergency_contact_phone})` : ''}` : '',
          '',
          'See the attached PDF for full trip details, locations, and gear checklist.',
          '',
          '— Lead the Wild by Praevius',
        ].filter(Boolean).join('\n'),
        attachments: [{
          filename: `hunt-plan-${slugify(plan.title)}.pdf`,
          content: Buffer.from(pdfBuffer).toString('base64'),
        }],
      })
    } else {
      console.log('[Hunt Share] No RESEND_API_KEY — would email PDF to:', recipients)
    }

    return NextResponse.json({ success: true, sent: recipients!.length })
  } catch (err) {
    console.error('[Hunt Share] Error:', err)
    return NextResponse.json({ error: 'Failed to generate hunt plan PDF' }, { status: 500 })
  }
}
