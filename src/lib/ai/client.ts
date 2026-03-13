import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  buildSystemPrompt,
  validateInput,
  validateOutput,
  checkRateLimit,
  logAIInteraction,
  type AIModule,
  type AIFeature,
} from './guardrails'

// ─── Singleton clients ─────────────────────────────────────────────────────────

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

/** Log raw AI response to bronze layer (fire-and-forget, never blocks the response) */
export function logBronze(data: {
  userId: string
  module: string
  feature: string
  inputLength: number
  rawResponse: string
  tokensInput?: number
  tokensOutput?: number
  flags: string[]
  durationMs: number
  sanitizedInput?: string
}) {
  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    admin.from('ai_responses').insert({
      user_id: data.userId,
      module: data.module,
      feature: data.feature,
      input_length: data.inputLength,
      output_length: data.rawResponse.length,
      raw_response: data.rawResponse,
      tokens_input: data.tokensInput ?? null,
      tokens_output: data.tokensOutput ?? null,
      parse_success: !data.flags.includes('parse_failed'),
      flags: data.flags,
      duration_ms: data.durationMs,
      sanitized_input: data.sanitizedInput ?? null,
    }).then(({ error }) => {
      if (error) console.error('[AI BRONZE] insert failed:', error.message)
    })
  } catch (err) {
    console.error('[AI BRONZE] error:', err)
  }
}

// ─── Main AI call interface ────────────────────────────────────────────────────

export interface AICallOptions {
  /** Which module this call belongs to */
  module: AIModule
  /** Which feature within the module */
  feature: AIFeature
  /** The user's message / prompt content */
  userMessage: string
  /** Additional context to append to system prompt (e.g., hunt plan details) */
  context?: string
  /** Authenticated user ID (for rate limiting + audit) */
  userId: string
  /** Max tokens for the response (default: 1024) */
  maxTokens?: number
  /** Model to use (default: claude-sonnet-4-6) */
  model?: string
}

export interface AICallResult {
  success: boolean
  response: string
  flags: string[]
  error?: string
  tokensUsed?: { input: number; output: number }
}

/**
 * Make a guardrailed AI call. This is the ONLY way AI should be called in the app.
 *
 * Handles:
 * 1. Per-minute rate limiting (beyond monthly quota)
 * 2. Input validation & sanitization
 * 3. System prompt construction with layered rules
 * 4. Output validation (leak detection, XSS)
 * 5. Audit logging
 */
export async function aiCall(options: AICallOptions): Promise<AICallResult> {
  const {
    module,
    feature,
    userMessage,
    context,
    userId,
    maxTokens = 1024,
    model = 'claude-sonnet-4-6',
  } = options

  const startTime = Date.now()
  const allFlags: string[] = []

  // 1. Rate limit check
  if (!checkRateLimit(userId)) {
    return {
      success: false,
      response: '',
      flags: ['rate_limited'],
      error: 'Too many requests. Please wait a moment and try again.',
    }
  }

  // 2. Validate input
  const inputResult = validateInput(userMessage)
  allFlags.push(...inputResult.flags)

  if (!inputResult.safe) {
    logAIInteraction({
      userId,
      module,
      feature,
      inputLength: userMessage.length,
      outputLength: 0,
      flags: allFlags,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    })
    return {
      success: false,
      response: '',
      flags: allFlags,
      error: 'Your request could not be processed. Please rephrase and try again.',
    }
  }

  // 3. Build system prompt with guardrails
  const systemPrompt = buildSystemPrompt(module, feature, context)

  // 4. Call the model
  try {
    const client = getClient()
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: inputResult.sanitized }],
    })

    const rawResponse = message.content[0].type === 'text' ? message.content[0].text : ''

    // Flag if response was truncated (hit max_tokens)
    if (message.stop_reason === 'max_tokens') {
      allFlags.push('truncated')
      console.warn('[AI TRUNCATED]', { module, feature, outputTokens: message.usage.output_tokens, maxTokens })
    }

    // 5. Validate output
    const outputResult = validateOutput(rawResponse)
    allFlags.push(...outputResult.flags)

    const durationMs = Date.now() - startTime

    // 6. Log (console + bronze layer)
    logAIInteraction({
      userId,
      module,
      feature,
      inputLength: inputResult.sanitized.length,
      outputLength: outputResult.sanitized.length,
      flags: allFlags,
      timestamp: new Date().toISOString(),
      durationMs,
    })

    logBronze({
      userId,
      module,
      feature,
      inputLength: inputResult.sanitized.length,
      rawResponse,
      tokensInput: message.usage.input_tokens,
      tokensOutput: message.usage.output_tokens,
      flags: allFlags,
      durationMs,
      sanitizedInput: inputResult.sanitized,
    })

    return {
      success: true,
      response: outputResult.sanitized,
      flags: allFlags,
      tokensUsed: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    }
  } catch (err) {
    const errMsg = String(err)
    const isBillingError = errMsg.includes('credit balance') || errMsg.includes('billing') || errMsg.includes('payment')

    logAIInteraction({
      userId,
      module,
      feature,
      inputLength: inputResult.sanitized.length,
      outputLength: 0,
      flags: [...allFlags, isBillingError ? 'billing_error' : 'api_error'],
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    })

    return {
      success: false,
      response: '',
      flags: allFlags,
      error: isBillingError
        ? 'AI is temporarily unavailable. Your data was saved — try again later.'
        : 'Something went wrong with the AI service. Please try again.',
    }
  }
}

// ─── Vision AI call (image + text) ──────────────────────────────────────────

export interface AIVisionCallOptions {
  module: AIModule
  feature: AIFeature
  /** Text prompt describing what to analyze */
  userMessage: string
  /** Base64-encoded image data */
  imageBase64: string
  /** MIME type of the image */
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  /** Additional context for system prompt */
  context?: string
  userId: string
  maxTokens?: number
  model?: string
}

/**
 * Make a guardrailed AI call with an image. Same guardrails as aiCall() but
 * sends the image as a content block alongside the text prompt.
 */
export async function aiVisionCall(options: AIVisionCallOptions): Promise<AICallResult> {
  const {
    module,
    feature,
    userMessage,
    imageBase64,
    imageMediaType,
    context,
    userId,
    maxTokens = 2048,
    model = 'claude-sonnet-4-6',
  } = options

  const startTime = Date.now()
  const allFlags: string[] = ['vision']

  // 1. Rate limit check
  if (!checkRateLimit(userId)) {
    return {
      success: false,
      response: '',
      flags: ['rate_limited'],
      error: 'Too many requests. Please wait a moment and try again.',
    }
  }

  // 2. Validate text input (image bypasses text sanitization)
  const inputResult = validateInput(userMessage)
  allFlags.push(...inputResult.flags)

  if (!inputResult.safe) {
    logAIInteraction({
      userId,
      module,
      feature,
      inputLength: userMessage.length,
      outputLength: 0,
      flags: allFlags,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    })
    return {
      success: false,
      response: '',
      flags: allFlags,
      error: 'Your request could not be processed. Please rephrase and try again.',
    }
  }

  // 3. Build system prompt with guardrails
  const systemPrompt = buildSystemPrompt(module, feature, context)

  // 4. Call the model with image + text content blocks
  try {
    const client = getClient()
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageMediaType,
              data: imageBase64,
            },
          },
          { type: 'text', text: inputResult.sanitized },
        ],
      }],
    })

    const rawResponse = message.content[0].type === 'text' ? message.content[0].text : ''

    if (message.stop_reason === 'max_tokens') {
      allFlags.push('truncated')
      console.warn('[AI TRUNCATED]', { module, feature, outputTokens: message.usage.output_tokens, maxTokens })
    }

    // 5. Validate output
    const outputResult = validateOutput(rawResponse)
    allFlags.push(...outputResult.flags)

    const durationMs = Date.now() - startTime

    // 6. Log (console + bronze layer — text prompt only, not the image)
    logAIInteraction({
      userId,
      module,
      feature,
      inputLength: inputResult.sanitized.length,
      outputLength: outputResult.sanitized.length,
      flags: allFlags,
      timestamp: new Date().toISOString(),
      durationMs,
    })

    logBronze({
      userId,
      module,
      feature,
      inputLength: inputResult.sanitized.length,
      rawResponse,
      tokensInput: message.usage.input_tokens,
      tokensOutput: message.usage.output_tokens,
      flags: allFlags,
      durationMs,
      sanitizedInput: inputResult.sanitized,
    })

    return {
      success: true,
      response: outputResult.sanitized,
      flags: allFlags,
      tokensUsed: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    }
  } catch (err) {
    const errMsg = String(err)
    const isBillingError = errMsg.includes('credit balance') || errMsg.includes('billing') || errMsg.includes('payment')

    logAIInteraction({
      userId,
      module,
      feature,
      inputLength: inputResult.sanitized.length,
      outputLength: 0,
      flags: [...allFlags, isBillingError ? 'billing_error' : 'api_error'],
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    })

    return {
      success: false,
      response: '',
      flags: allFlags,
      error: isBillingError
        ? 'AI is temporarily unavailable. Your data was saved — try again later.'
        : 'Something went wrong with the AI service. Please try again.',
    }
  }
}
