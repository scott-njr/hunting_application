import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, forbidden, withHandler, serverError } from '@/lib/api-response'

// Claude Sonnet 4.6 pricing
const INPUT_COST_PER_TOKEN = 3 / 1_000_000   // $3 per 1M input tokens
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000  // $15 per 1M output tokens

export const GET = withHandler(async () => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  // Try Anthropic Admin API first, fall back to token-based calculation
  const adminKey = process.env.ANTHROPIC_ADMIN_API_KEY
  if (adminKey) {
    try {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const params = new URLSearchParams({
        starting_at: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        ending_at: monthEnd.toISOString(),
        bucket_width: '1d',
      })

      const res = await fetch(
        `https://api.anthropic.com/v1/organizations/cost_report?${params}`,
        {
          headers: {
            'anthropic-version': '2023-06-01',
            'x-api-key': adminKey,
          },
        }
      )

      if (res.ok) {
        const data = await res.json()
        let totalCostCents = 0
        for (const bucket of data.data ?? []) {
          totalCostCents += parseFloat(bucket.cost_cents ?? bucket.cost ?? '0')
        }
        const totalCostDollars = totalCostCents / 100
        const projected = dayOfMonth > 0 ? (totalCostDollars / dayOfMonth) * daysInMonth : 0

        return apiOk({
          source: 'console',
          actualCost: totalCostDollars,
          projectedCost: projected,
          dayOfMonth,
          daysInMonth,
        })
      }
    } catch {
      // Fall through to token-based calculation
    }
  }

  // Fallback: calculate from ai_responses token data
  // ai_responses has RLS with no SELECT policies — use service role to bypass
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: responses } = await admin
    .from('ai_responses')
    .select('tokens_input, tokens_output')
    .gte('created_on', monthStart)

  let totalInputTokens = 0
  let totalOutputTokens = 0
  for (const row of responses ?? []) {
    totalInputTokens += row.tokens_input ?? 0
    totalOutputTokens += row.tokens_output ?? 0
  }

  const actualCost = (totalInputTokens * INPUT_COST_PER_TOKEN) + (totalOutputTokens * OUTPUT_COST_PER_TOKEN)
  const projected = dayOfMonth > 0 ? (actualCost / dayOfMonth) * daysInMonth : 0

  return apiOk({
    source: 'tokens',
    actualCost,
    projectedCost: projected,
    dayOfMonth,
    daysInMonth,
  })
})

