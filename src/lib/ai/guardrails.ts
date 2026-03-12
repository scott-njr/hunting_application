import { BASE_SYSTEM_RULES, BASE_RESPONSE_RULES } from './rules/base.rules'
import { HUNTING_MODULE_RULES, HUNTING_SCOUT_RULES, HUNTING_DRAW_RULES, HUNTING_UNIT_SCOUT_RULES } from './rules/hunting.rules'
import { FITNESS_MODULE_RULES } from './rules/fitness.rules'
import { FITNESS_COACH_RULES } from './rules/fitness-coach.rules'
import { FIREARMS_MODULE_RULES } from './rules/firearms.rules'
import { ADMIN_BUG_TRIAGE_RULES } from './rules/admin.rules'

// ─── Module types ──────────────────────────────────────────────────────────────

export type AIModule = 'hunting' | 'fitness' | 'firearms' | 'admin'
export type AIFeature =
  | 'hunting_scout_report'
  | 'hunting_draw_assistant'
  | 'hunting_unit_scout'
  | 'fitness_wow_generator'
  | 'fitness_run_coach'
  | 'fitness_strength_coach'
  | 'fitness_meal_prep'
  | 'fitness_coach_chat'
  | 'firearms_education'
  | 'admin_bug_triage'
  | 'general_chat'

// ─── System prompt builder ─────────────────────────────────────────────────────

const MODULE_RULES: Record<AIModule, string> = {
  hunting: HUNTING_MODULE_RULES,
  fitness: FITNESS_MODULE_RULES,
  firearms: FIREARMS_MODULE_RULES,
  admin: '',
}

const FEATURE_RULES: Partial<Record<AIFeature, string>> = {
  hunting_scout_report: HUNTING_SCOUT_RULES,
  hunting_draw_assistant: HUNTING_DRAW_RULES,
  hunting_unit_scout: HUNTING_UNIT_SCOUT_RULES,
  fitness_coach_chat: FITNESS_COACH_RULES,
  admin_bug_triage: ADMIN_BUG_TRIAGE_RULES,
}

/**
 * Build a complete system prompt from base rules + module rules + feature rules.
 * Always starts with base guardrails, then layers on module and feature-specific rules.
 */
export function buildSystemPrompt(
  module: AIModule,
  feature: AIFeature,
  additionalContext?: string,
): string {
  const parts = [
    BASE_SYSTEM_RULES,
    MODULE_RULES[module],
    FEATURE_RULES[feature],
    BASE_RESPONSE_RULES,
    additionalContext,
  ].filter(Boolean)

  return parts.join('\n\n')
}

// ─── Input validation & sanitization ───────────────────────────────────────────

/** Known prompt injection patterns */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?(your|the)\s+(rules|instructions|guidelines|prompt)/i,
  /you\s+are\s+now\s+a/i,
  /new\s+instructions?\s*:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /```\s*system/i,
  /override\s+(all\s+)?safety/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /act\s+as\s+(if\s+)?(you\s+)?(have|had)\s+no\s+(restrictions|rules|limits)/i,
]

/** Content that should never appear in user input */
const BLOCKED_CONTENT = [
  /how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)/i,
  /how\s+to\s+(kill|murder|harm)\s+(a\s+)?person/i,
  /illegal\s+(drug|substance)\s+(manufacture|production|synthesis)/i,
]

/** SQL injection patterns — flagged for audit, not blocked */
const SQL_INJECTION_PATTERNS = [
  /('\s*(OR|AND)\s+')/i,                     // ' OR '1'='1
  /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER)\s/i, // ; DROP TABLE
  /UNION\s+(ALL\s+)?SELECT/i,                // UNION SELECT
  /1\s*=\s*1/,                               // 1=1
  /'\s*;\s*--/,                              // '; --
  /EXEC(\s+|\()/i,                           // EXEC(
  /xp_cmdshell/i,                            // xp_cmdshell
]

export interface InputValidationResult {
  safe: boolean
  sanitized: string
  flags: string[]
}

/**
 * Validate and sanitize user input before sending to AI.
 * Returns the sanitized input and any flags.
 */
export function validateInput(input: string): InputValidationResult {
  const flags: string[] = []

  // Check for blocked content
  for (const pattern of BLOCKED_CONTENT) {
    if (pattern.test(input)) {
      return {
        safe: false,
        sanitized: '',
        flags: ['blocked_content'],
      }
    }
  }

  // Check for injection attempts — flag but don't block (the system prompt handles defense)
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      flags.push('injection_attempt')
      break
    }
  }

  // Check for SQL injection patterns — flag for audit
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      flags.push('sql_injection_attempt')
      break
    }
  }

  // Sanitize: strip control characters, limit length
  let sanitized = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()

  // Cap input length (prevent cost attacks with massive prompts)
  const MAX_INPUT_LENGTH = 4000
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH)
    flags.push('input_truncated')
  }

  return { safe: true, sanitized, flags }
}

// ─── Output validation ─────────────────────────────────────────────────────────

/** Patterns that should never appear in AI output */
const OUTPUT_LEAK_PATTERNS = [
  /sk-ant-api/i, // Anthropic API key prefix
  /ANTHROPIC_API_KEY/i,
  /SUPABASE_SERVICE_ROLE/i,
  /process\.env\./i,
  /\.env\.local/i,
  /password\s*[:=]\s*["'][^"']+["']/i,
]

/**
 * Validate AI output before returning to user.
 * Strips any accidentally leaked sensitive data.
 */
export function validateOutput(output: string): { safe: boolean; sanitized: string; flags: string[] } {
  const flags: string[] = []
  let sanitized = output

  for (const pattern of OUTPUT_LEAK_PATTERNS) {
    if (pattern.test(sanitized)) {
      flags.push('potential_data_leak')
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    }
  }

  // Strip any HTML script tags (XSS prevention)
  if (/<script[\s>]/i.test(sanitized)) {
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '[removed]')
    flags.push('script_tag_removed')
  }

  return {
    safe: flags.length === 0,
    sanitized,
    flags,
  }
}

// ─── Rate limiting (per-user, beyond quota) ────────────────────────────────────

const userRateMap = new Map<string, { count: number; windowStart: number }>()
const RATE_WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10

/**
 * Check if a user has exceeded the per-minute rate limit.
 * This is separate from the monthly quota — it prevents rapid-fire abuse.
 */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = userRateMap.get(userId)

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    userRateMap.set(userId, { count: 1, windowStart: now })
    return true // allowed
  }

  entry.count++
  return entry.count <= MAX_REQUESTS_PER_MINUTE
}

// ─── Logging (for security monitoring) ─────────────────────────────────────────

export interface AIAuditLog {
  userId: string
  module: AIModule
  feature: AIFeature
  inputLength: number
  outputLength: number
  flags: string[]
  timestamp: string
  durationMs: number
}

/**
 * Log AI interactions for security monitoring.
 * In production, this should go to a logging service.
 */
export function logAIInteraction(log: AIAuditLog): void {
  if (log.flags.length > 0) {
    console.warn('[AI SECURITY]', JSON.stringify(log))
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[AI]', `${log.module}/${log.feature}`, `${log.durationMs}ms`, `in:${log.inputLength}`, `out:${log.outputLength}`)
  }
}
