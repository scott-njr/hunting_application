import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { aiCall } from '@/lib/ai'
import { getCoachContext } from '@/lib/ai/fitness-profile'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota } from '@/lib/modules'
import { apiOk, apiError, unauthorized, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

/** Maximum conversation turns to serialize into the prompt */
const MAX_HISTORY_TURNS = 6

type ConversationTurn = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return unauthorized()
  }

  const body = await parseBody(req)
  if (isErrorResponse(body)) return body
  const { message, history } = body as {
    message: string
    history: ConversationTurn[]
  }

  if (!message?.trim()) {
    return badRequest('Message is required')
  }

  // Check module-specific quota
  const subInfo = await getUserModuleSubscriptionInfo(supabase, user.id, 'fitness')
  if (!hasModuleAIQuota(subInfo.tier, subInfo.aiQueriesThisMonth)) {
    return apiError('quota_exceeded', 403, { message: 'Monthly AI query limit reached for Fitness. Upgrade your plan for more.' })
  }

  // Fetch all user fitness data for context injection
  const coachContext = await getCoachContext(supabase, user.id)

  // Serialize recent conversation history into the user message
  const recentHistory = (history ?? []).slice(-MAX_HISTORY_TURNS)
  let userMessage = message.trim()

  if (recentHistory.length > 0) {
    const historyBlock = recentHistory
      .map(t => `${t.role === 'user' ? 'User' : 'Coach'}: ${t.content}`)
      .join('\n')
    userMessage = `[CONVERSATION HISTORY]\n${historyBlock}\n\n[CURRENT QUESTION]\n${message.trim()}`
  }

  const result = await aiCall({
    module: 'fitness',
    feature: 'fitness_coach_chat',
    userMessage,
    context: coachContext,
    userId: user.id,
    maxTokens: 1500,
  })

  if (!result.success) {
    return serverError(result.error ?? 'Coach unavailable. Please try again.')
  }

  await supabase.rpc('increment_module_ai_queries', {
    user_id_param: user.id,
    module_slug_param: 'fitness',
  })

  return apiOk({ response: result.response })
}
