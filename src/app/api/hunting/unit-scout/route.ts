import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import { aiCall, extractJSON } from '@/lib/ai'
import { getScoutContext } from '@/lib/ai/hunting-profile'
import type { WizardInputs, ChatMessage } from '@/components/hunting/draw-research/types'

const STATE_LABELS: Record<string, string> = {
  CO: 'Colorado', MT: 'Montana', WY: 'Wyoming', ID: 'Idaho',
  NV: 'Nevada', UT: 'Utah', AZ: 'Arizona', NM: 'New Mexico',
  OR: 'Oregon', WA: 'Washington', SD: 'South Dakota',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Module-specific quota check
    const subInfo = await getUserModuleSubscriptionInfo(supabase, user.id, 'hunting')

    if (!hasModuleAIQuota(subInfo.tier, subInfo.aiQueriesThisMonth)) {
      return NextResponse.json(
        { error: 'quota_exceeded', message: 'Monthly AI query limit reached for Hunting. Upgrade your plan for more.' },
        { status: 403 },
      )
    }

    const body = await req.json()

    // ── Mode 1: Generate initial recommendations ──
    if (body.wizardInputs && !body.message) {
      return handleGenerate(supabase, user.id, body.wizardInputs as WizardInputs)
    }

    // ── Mode 2: Chat follow-up ──
    if (body.reportId && body.message) {
      return handleChat(supabase, user.id, body.reportId, body.message, body.history ?? [])
    }

    // ── Mode 3: Update rankings or sharing ──
    if (body.reportId && (body.rankings !== undefined || body.sharedWith !== undefined)) {
      return handleUpdate(supabase, user.id, body.reportId, body.rankings, body.sharedWith)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err) {
    console.error('[unit-scout] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleGenerate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  wizard: WizardInputs,
) {
  const context = await getScoutContext(supabase, userId, wizard)

  const speciesLabel = wizard.species.replace(/_/g, ' ')
  const stateLabel = STATE_LABELS[wizard.state] ?? wizard.state

  const userMessage = `Recommend 3-5 specific GMU/units for me to apply for based on my full profile and preferences.

I'm looking for: ${stateLabel} ${speciesLabel}, ${wizard.season} season.
Residency: ${wizard.residency}
Transportation: ${wizard.transportation.join(', ')}
Trip style: ${Array.isArray(wizard.tripStyle) ? wizard.tripStyle.join(', ') : wizard.tripStyle}
My priorities (ranked): ${wizard.priorities.join(', ')}
${wizard.notes ? `Additional notes: ${wizard.notes}` : ''}

For each unit recommendation, include:
1. A score (1-100) weighted by my stated priorities
2. Draw odds estimate factoring in my specific preference/bonus points
3. Draw strategy: which unit I should put as 1st choice, 2nd choice, etc. and WHY
4. Suggested hunt codes in the state's format (mark as unverified)
5. Success rate, terrain difficulty, highlights, pros/cons
6. Fishing and amenity notes if I prioritized those

Return ONLY a valid JSON object matching the format described in your instructions.`

  const result = await aiCall({
    module: 'hunting',
    feature: 'unit_scout',
    userId,
    userMessage,
    context,
    maxTokens: 4000,
  })

  if (!result.success || !result.response) {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }

  // Parse JSON
  const parsed = extractJSON(result.response)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recommendations: any[] = []
  let summary = ''
  let parseFailed = false

  if (parsed && typeof parsed === 'object' && 'recommendations' in parsed) {
    recommendations = (parsed as { recommendations: unknown[]; summary?: string }).recommendations
    summary = (parsed as { summary?: string }).summary ?? ''
  } else {
    parseFailed = true
  }

  if (parseFailed) {
    return NextResponse.json(
      { error: 'Failed to parse AI response' },
      { status: 422 },
    )
  }

  // Save report to DB
  const title = `${stateLabel} ${speciesLabel.charAt(0).toUpperCase() + speciesLabel.slice(1)} ${new Date().getFullYear()}`

  const { data: report, error: insertErr } = await supabase
    .from('hunting_draw_research_reports')
    .insert({
      // @ts-expect-error — Supabase types don't recognize insert shape; works at runtime
      user_id: userId,
      title,
      state: wizard.state,
      species: wizard.species,
      season: wizard.season,
      wizard_inputs: wizard as unknown as Record<string, unknown>,
      recommendations: recommendations as unknown as Record<string, unknown>,
      summary,
      status: 'draft' as const,
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('[unit-scout] Insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }

  // Increment module-specific quota
  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: userId,
    module_slug_param: 'hunting',
  })

  return NextResponse.json({
    reportId: report.id,
    recommendations,
    summary,
    title,
  })
}

async function handleChat(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reportId: string,
  message: string,
  history: ChatMessage[],
) {
  // Load report for context
  const { data: report } = await supabase
    .from('hunting_draw_research_reports')
    .select('wizard_inputs, recommendations, summary, chat_history')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const wizard = report.wizard_inputs as unknown as WizardInputs
  const context = await getScoutContext(supabase, userId, wizard)

  // Build conversation context
  const recsContext = `\n\n[PREVIOUS RECOMMENDATIONS]\n${JSON.stringify(report.recommendations, null, 0).slice(0, 3000)}`

  const recentHistory = history.slice(-6)
  const historyText = recentHistory.length > 0
    ? '\n\n[CONVERSATION HISTORY]\n' + recentHistory.map(m => `${m.role}: ${m.content}`).join('\n')
    : ''

  const userMessage = `${context}${recsContext}${historyText}\n\nUser question: ${message}\n\nRespond naturally and helpfully. Reference the unit recommendations when relevant. If the user asks about hunt codes, provide your best suggestion but remind them to verify at the state portal.`

  const result = await aiCall({
    module: 'hunting',
    feature: 'unit_scout',
    userId,
    userMessage,
    maxTokens: 2000,
  })

  if (!result.success || !result.response) {
    return NextResponse.json({ error: 'AI response failed' }, { status: 500 })
  }

  // Persist chat to DB
  const existingHistory = (report.chat_history ?? []) as ChatMessage[]
  const updatedHistory = [
    ...existingHistory,
    { role: 'user' as const, content: message },
    { role: 'assistant' as const, content: result.response },
  ]

  await supabase
    .from('hunting_draw_research_reports')
    .update({
      // @ts-expect-error — Json type mismatch; Record<string, unknown> works at runtime
      chat_history: updatedHistory as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  // Increment module-specific quota
  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: userId,
    module_slug_param: 'hunting',
  })

  return NextResponse.json({ response: result.response })
}

async function handleUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reportId: string,
  rankings?: string[],
  sharedWith?: string[],
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (rankings !== undefined) updates.user_rankings = rankings
  if (sharedWith !== undefined) {
    updates.shared_with = sharedWith
    updates.status = 'shared'
  }

  const { error } = await supabase
    .from('hunting_draw_research_reports')
    .update(updates)
    .eq('id', reportId)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
