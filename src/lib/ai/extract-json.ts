/**
 * Extract JSON from an AI response that may be wrapped in markdown code fences.
 * Strips ```json ... ``` or ``` ... ``` wrappers before parsing.
 * Attempts to repair truncated JSON by closing open brackets/braces.
 */
export function extractJSON(raw: string): Record<string, unknown> {
  let cleaned = raw.trim()

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }

  // Sometimes the AI wraps JSON in extra text — try to find the JSON object
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const jsonStart = cleaned.indexOf('{')
    if (jsonStart !== -1) {
      const jsonEnd = cleaned.lastIndexOf('}')
      if (jsonEnd > jsonStart) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
      }
    }
  }

  // First attempt: parse as-is
  try {
    return JSON.parse(cleaned)
  } catch {
    // Fall through to repair attempt
  }

  // Repair truncated JSON: close unclosed strings, strip trailing junk, close brackets
  let repaired = cleaned

  // Check if we're inside an unclosed string by counting unescaped quotes
  let quoteCount = 0
  for (let i = 0; i < repaired.length; i++) {
    if (repaired[i] === '\\') { i++; continue }
    if (repaired[i] === '"') quoteCount++
  }
  // Odd quote count means we're mid-string — close it
  if (quoteCount % 2 !== 0) {
    repaired += '"'
  }

  // Remove trailing comma or incomplete key-value pair (outside strings)
  repaired = repaired
    .replace(/,\s*"[^"]*"\s*:\s*$/, '')       // key with no value
    .replace(/,\s*"[^"]*"\s*$/, '')            // orphan key string
    .replace(/,\s*$/, '')                       // trailing comma

  // Track open bracket/brace stack to close in correct order
  const stack: string[] = []
  let inString = false
  let escape = false
  for (const ch of repaired) {
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }

  // Close in reverse order (innermost first)
  while (stack.length > 0) repaired += stack.pop()

  return JSON.parse(repaired)
}
