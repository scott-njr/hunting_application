// server-only — email HTML template for broadcast emails

import type { BroadcastCategory } from '@/types'

const CATEGORY_LABELS: Record<BroadcastCategory | 'all', string> = {
  release_notes: 'Release Notes',
  newsletter: 'Newsletter',
  blog: 'Blog',
  announcement: 'Announcement',
  all: 'All',
}

interface BroadcastEmailOptions {
  bodyHtml: string
  category: BroadcastCategory
  unsubscribeUrl: string
}

export function buildBroadcastEmail(opts: BroadcastEmailOptions): string {
  const categoryLabel = CATEGORY_LABELS[opts.category]

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Lead the Wild</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f2ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ed;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background-color:#1a1a17;padding:24px 32px;border-radius:12px 12px 0 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <span style="font-size:20px;font-weight:700;color:#f0ece4;letter-spacing:-0.5px;">Lead the Wild</span>
    </td>
    <td align="right">
      <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#7c9a6e;">${categoryLabel}</span>
    </td>
  </tr>
  </table>
  <div style="height:3px;background-color:#7c9a6e;margin-top:16px;border-radius:2px;"></div>
</td></tr>

<!-- Body -->
<tr><td style="background-color:#ffffff;padding:32px;font-size:15px;line-height:1.6;color:#2a2a25;">
${opts.bodyHtml}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f8f6f2;padding:24px 32px;border-radius:0 0 12px 12px;border-top:1px solid #e8e5de;">
  <p style="margin:0 0 8px;font-size:12px;color:#8a8580;">
    You received this because you're subscribed to ${categoryLabel} emails from Lead the Wild.
  </p>
  <p style="margin:0 0 8px;font-size:12px;color:#8a8580;">
    Praevius LLC &middot; United States
  </p>
  <p style="margin:0;font-size:12px;">
    <a href="${opts.unsubscribeUrl}" style="color:#7c9a6e;text-decoration:underline;">Unsubscribe</a>
    <span style="color:#c4c0b8;"> &middot; </span>
    <a href="https://leadthewild.co" style="color:#7c9a6e;text-decoration:underline;">Visit Lead the Wild</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

/** Strip HTML tags for plain text email fallback */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  - ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
