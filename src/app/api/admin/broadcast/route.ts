import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { marked } from 'marked'
import { verifyAdmin } from '@/lib/admin-utils'
import { buildBroadcastEmail, htmlToPlainText } from '@/lib/email/broadcast-template'
import { apiOk, apiDone, apiError, forbidden, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'
import type { BroadcastCategory } from '@/types'

const VALID_CATEGORIES: BroadcastCategory[] = ['release_notes', 'newsletter', 'blog', 'announcement']
const BATCH_SIZE = 100 // Resend batch API limit
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://leadthewild.co'

function generateUnsubToken(email: string, category: string): string {
  const secret = process.env.UNSUB_SECRET
  if (!secret) throw new Error('UNSUB_SECRET env var is required')
  return createHmac('sha256', secret).update(`${email}|${category}`).digest('hex')
}

function buildUnsubscribeUrl(email: string, category: string): string {
  const token = generateUnsubToken(email, category)
  return `${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&category=${encodeURIComponent(category)}&token=${token}`
}

// GET — list past broadcasts
export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('email_broadcast')
    .select('id, subject, category, status, recipient_count, sent_at, created_on, error_message')
    .order('created_on', { ascending: false })
    .limit(50)

  if (error) return serverError()

  return apiOk({ broadcasts: data ?? [] })
}

// POST — send a broadcast
export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  try {
    const body = await parseBody(req)
    if (isErrorResponse(body)) return body
    const { subject, bodyMarkdown, category, preview, recipientIds } = body as {
      subject?: string
      bodyMarkdown?: string
      category?: string
      preview?: boolean
      recipientIds?: string[] // optional — if provided, send only to these user IDs
    }

    // Validate inputs
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return badRequest('Subject is required')
    }
    if (!bodyMarkdown || typeof bodyMarkdown !== 'string' || bodyMarkdown.trim().length === 0) {
      return badRequest('Body is required')
    }
    if (!category || !VALID_CATEGORIES.includes(category as BroadcastCategory)) {
      return badRequest('Invalid category')
    }

    // Render markdown to HTML
    const contentHtml = await marked.parse(bodyMarkdown.trim())

    // Preview mode — send single email to admin only
    if (preview) {
      if (!process.env.RESEND_API_KEY) {
        console.warn('[Broadcast Preview]', { subject, category, contentHtml })
        return apiDone({ preview: true, message: 'Preview logged to console (no RESEND_API_KEY)' })
      }

      const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: adminMember } = await admin
        .from('members')
        .select('email')
        .eq('id', adminUser.id)
        .single()

      if (!adminMember?.email) {
        return serverError('Could not find admin email')
      }

      const unsubUrl = buildUnsubscribeUrl(adminMember.email, category)
      const html = buildBroadcastEmail({
        bodyHtml: contentHtml,
        category: category as BroadcastCategory,
        unsubscribeUrl: unsubUrl,
      })

      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Lead the Wild <noreply@praevius.com>',
        to: adminMember.email,
        subject: `[PREVIEW] ${subject.trim()}`,
        html,
        text: htmlToPlainText(contentHtml),
      })

      return apiDone({ preview: true })
    }

    // Full send
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch member emails — all onboarded users, or specific selected users
    let membersQuery = admin.from('members').select('email').eq('onboarding_completed', true)
    if (recipientIds && recipientIds.length > 0) {
      membersQuery = membersQuery.in('id', recipientIds)
    }
    const { data: members, error: membersError } = await membersQuery

    if (membersError) {
      return serverError('Failed to fetch members')
    }

    const allEmails = (members ?? []).map(m => m.email).filter(Boolean) as string[]

    // Fetch unsubscribed emails for this category
    const { data: unsubs } = await admin
      .from('email_unsubscribe')
      .select('email')
      .in('category', [category, 'all'])

    const unsubEmails = new Set((unsubs ?? []).map(u => u.email))
    const recipientEmails = allEmails.filter(e => !unsubEmails.has(e))

    if (recipientEmails.length === 0) {
      return badRequest('No eligible recipients')
    }

    // Insert broadcast record
    const { data: broadcast, error: insertError } = await admin
      .from('email_broadcast')
      .insert({
        sent_by: adminUser.id,
        category,
        subject: subject.trim(),
        body_markdown: bodyMarkdown.trim(),
        body_html: contentHtml,
        status: 'sending',
      })
      .select('id')
      .single()

    if (insertError || !broadcast) {
      return serverError('Failed to create broadcast record')
    }

    // Send in batches
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Broadcast Send] No RESEND_API_KEY', { broadcastId: broadcast.id, recipientCount: recipientEmails.length })
      await admin
        .from('email_broadcast')
        .update({ status: 'sent', recipient_count: recipientEmails.length, sent_at: new Date().toISOString() })
        .eq('id', broadcast.id)
      return apiDone({ sent: recipientEmails.length, message: 'Logged to console (no RESEND_API_KEY)' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    let totalSent = 0

    for (let i = 0; i < recipientEmails.length; i += BATCH_SIZE) {
      const chunk = recipientEmails.slice(i, i + BATCH_SIZE)

      const emails = chunk.map(email => {
        const unsubUrl = buildUnsubscribeUrl(email, category)
        const html = buildBroadcastEmail({
          bodyHtml: contentHtml,
          category: category as BroadcastCategory,
          unsubscribeUrl: unsubUrl,
        })

        return {
          from: 'Lead the Wild <noreply@praevius.com>',
          to: email,
          subject: subject.trim(),
          html,
          text: htmlToPlainText(contentHtml),
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }
      })

      try {
        await resend.batch.send(emails)
        totalSent += chunk.length
      } catch (err) {
        console.error(`[Broadcast] Batch ${i / BATCH_SIZE + 1} failed:`, err)
        await admin
          .from('email_broadcast')
          .update({
            status: 'failed',
            recipient_count: totalSent,
            error_message: `Failed at batch ${i / BATCH_SIZE + 1} (sent ${totalSent}/${recipientEmails.length})`,
            sent_at: new Date().toISOString(),
          })
          .eq('id', broadcast.id)

        return apiError(
          `Partial send: ${totalSent}/${recipientEmails.length} delivered`,
          500,
          { sent: totalSent },
        )
      }
    }

    // Update broadcast record
    await admin
      .from('email_broadcast')
      .update({
        status: 'sent',
        recipient_count: totalSent,
        sent_at: new Date().toISOString(),
      })
      .eq('id', broadcast.id)

    return apiDone({ sent: totalSent })
  } catch (err) {
    console.error('[Broadcast]', err)
    return serverError()
  }
}
