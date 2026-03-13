import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserModuleSubscriptionInfo, hasModuleAIQuota, MODULE_AI_QUOTA } from '@/lib/modules'
import { aiCall, extractJSON } from '@/lib/ai'
import { apiOk, apiError, unauthorized, notFound, badRequest, serverError, parseBody, isErrorResponse } from '@/lib/api-response'

type ReportSection = { key: string; title: string; rows: { label: string; value: string }[] }
type POI = { label: string; lat: number; lng: number; type: string }

function parseSections(parsed: Record<string, unknown>): ReportSection[] {
  if (!Array.isArray(parsed.sections)) return []
  return (parsed.sections as Array<Record<string, unknown>>)
    .filter(s => s.key && s.title && Array.isArray(s.rows))
    .map(s => ({
      key: String(s.key),
      title: String(s.title),
      rows: (s.rows as Array<Record<string, unknown>>)
        .filter(r => r.label && r.value)
        .map(r => ({ label: String(r.label), value: String(r.value) })),
    }))
}

function parsePois(parsed: Record<string, unknown>): POI[] {
  if (!Array.isArray(parsed.points_of_interest)) return []
  return (parsed.points_of_interest as Array<Record<string, unknown>>)
    .filter(p => p.label && typeof p.lat === 'number' && typeof p.lng === 'number')
    .map(p => ({
      label: String(p.label),
      lat: p.lat as number,
      lng: p.lng as number,
      type: typeof p.type === 'string' ? p.type : 'town',
    }))
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    // Check module-specific quota
    const subInfo = await getUserModuleSubscriptionInfo(supabase, user.id, 'hunting')
    const quota = MODULE_AI_QUOTA[subInfo.tier]

    if (!hasModuleAIQuota(subInfo.tier, subInfo.aiQueriesThisMonth)) {
      return apiError('quota_exceeded', 403, { message: 'Monthly AI query limit reached for Hunting. Upgrade your plan for more.' })
    }

    const body = await parseBody(req)
    if (isErrorResponse(body)) return body
    const { location_id } = body
    if (!location_id) return badRequest('location_id required')

    // Fetch location — only lat/lng are used for scouting. Filter by user ownership via hunt plan.
    const { data: loc, error: locErr } = await supabase
      .from('hunting_locations')
      .select('*, hunting_plans!inner(user_id)')
      .eq('id', location_id)
      .eq('hunting_plans.user_id', user.id)
      .single()

    if (locErr || !loc) return notFound('Location not found')

    // Scout requires GPS coordinates — the AI discovers everything from the pin location
    if (!loc.lat || !loc.lng) {
      return badRequest('GPS coordinates required. Drop a pin on the map to scout this location.')
    }

    const pinLocation = `GPS coordinates: ${loc.lat}° N, ${loc.lng}° W`

    // ── Step 1: Generate sections ──────────────────────────────────────
    // Sections are ordered by field importance — contacts, access, medical, and
    // logistics first. Hunting strategy & terrain analysis belong in the AI
    // assistant, not the scout report.
    const sectionsMessage = `Generate a field-ready scout report based ONLY on these GPS coordinates. Determine the state, county, GMU/unit, and all nearby resources by analyzing the coordinates. This is a quick-reference card for logistics, contacts, and access — NOT a hunting strategy guide.

${pinLocation}

CRITICAL: You must determine the correct state and county from the coordinates above. Do NOT guess — use the coordinates to identify the exact geographic location. Getting the county and GMU wrong is unacceptable.

Return a JSON object: { "sections": [...] }

The "sections" array must contain exactly these 6 sections in this order. Each section has a "key", "title", and "rows" array of { "label", "value" } pairs. ONE sentence max per value — brevity is critical.

1. key: "game_warden", title: "Game Warden & Contacts"
   Rows: Game warden name & phone (if known for this area), local sheriff non-emergency, search & rescue, nearest ranger station & phone, state wildlife agency regional office.

2. key: "access", title: "Access & Trailheads"
   Rows: Primary access road(s) and condition, nearest trailhead(s), parking areas, 4WD required (yes/no + which sections), gate/closure notes, permit requirements.

3. key: "medical", title: "Nearest Medical"
   Rows: Hospital 1 (name, distance, drive time, phone), Hospital 2 if applicable, urgent care options, cell service coverage assessment.

4. key: "gmu_info", title: "GMU / Unit Info"
   Rows: Unit number, county, total area, public vs private land %, land management (BLM/USFS/state), OTC or draw-only status, tag quotas if known.

5. key: "weather", title: "Weather & Conditions"
   Rows: Typical temp range for hunting season, precipitation likelihood, wind patterns, snow/ice risk, lightning risk, sunrise/sunset window.

6. key: "meat_processing", title: "Meat Processing"
   Rows: Nearest processor (name, town, distance, phone if known), second option if available, wild game accepted, typical turnaround, cold storage or ice availability.

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no extra text.`

    const sectionsResult = await aiCall({
      module: 'hunting',
      feature: 'hunting_scout_report',
      userMessage: sectionsMessage,
      userId: user.id,
      maxTokens: 4000,
    })

    if (!sectionsResult.success) {
      const isUnavailable = sectionsResult.error?.includes('temporarily unavailable')
      return isUnavailable
        ? apiError('ai_unavailable', 503, { message: sectionsResult.error })
        : apiError('ai_error', 500, { message: sectionsResult.error })
    }

    // Parse sections
    let sections: ReportSection[] = []
    let reportText = ''
    const parseFlags = [...sectionsResult.flags]

    try {
      const parsed = extractJSON(sectionsResult.response)
      sections = parseSections(parsed)
      if (sections.length > 0) {
        reportText = sections
          .map(s => `## ${s.title}\n${s.rows.map(r => `- **${r.label}:** ${r.value}`).join('\n')}`)
          .join('\n\n')
      }
      // Legacy: if AI returned old "report" format
      if (!sections.length && parsed.report && typeof parsed.report === 'string') {
        reportText = parsed.report
      }
    } catch {
      reportText = sectionsResult.response
      parseFlags.push('parse_failed')
    }

    // ── Step 2: Generate POIs ──────────────────────────────────────────
    let pois: POI[] = []
    let poisTruncated = false

    if (sections.length > 0) {
      // Build a concise summary of places mentioned in sections for the POI call
      const mentionedPlaces = sections
        .flatMap(s => s.rows.map(r => r.value))
        .join('\n')

      // Trim mentioned places to avoid exceeding input validation's 4000 char limit
      const trimmedPlaces = mentionedPlaces.slice(0, 1500)

      const poisMessage = `Generate 5–15 real GPS POIs near these coordinates. Return ONLY: { "points_of_interest": [{ "label": "Name", "lat": 39.06, "lng": -107.55, "type": "emergency" }, ...] }

${pinLocation}

Types: "emergency" (hospitals, sheriff, ranger stations, SAR), "access" (trailheads, parking, gates), "water" (rivers, lakes, springs), "camp" (campgrounds), "hazard" (closures, dangerous terrain), "town" (towns, supply points), "processor" (meat processors, butchers).

Places from scout report:
${trimmedPlaces}

Every POI must be a REAL named place with accurate GPS coordinates. No markdown, no code fences.`

      const poisResult = await aiCall({
        module: 'hunting',
        feature: 'hunting_scout_report',
        userMessage: poisMessage,
        userId: user.id,
        maxTokens: 2000,
      })

      if (poisResult.success) {
        try {
          const parsed = extractJSON(poisResult.response)
          pois = parsePois(parsed)
          if (pois.length === 0) {
            console.warn('[scout-data] POI parse returned 0 results. Raw response:', poisResult.response.slice(0, 500))
          }
        } catch (e) {
          console.warn('[scout-data] POI parse failed:', e, 'Raw response:', poisResult.response.slice(0, 500))
        }
        poisTruncated = poisResult.flags.includes('truncated')
      } else {
        console.warn('[scout-data] POI AI call failed:', poisResult.error)
      }
    }

    // Save report back to location (includes POIs + structured sections)
    const scoutReport = {
      text: reportText,
      sections,
      pois,
      generated_at: new Date().toISOString(),
    }

    await supabase
      .from('hunting_locations')
      .update({ scout_report: scoutReport })
      .eq('id', location_id)

    // POIs are NOT auto-synced to hunting_field_map_pins — users add them manually
    // via "Add to Field Map" button per POI in the UI.

    // Increment module-specific AI query count (counts as 1 even with 2 calls)
    await supabase.rpc('increment_module_ai_queries', {
      user_id_param: user.id,
      module_slug_param: 'hunting',
    })

    const truncated = parseFlags.includes('truncated') || poisTruncated
    return apiOk({ report: reportText, sections, pois, truncated, queries_used: subInfo.aiQueriesThisMonth + 1, quota })
  } catch (err) {
    console.error('[scout-data] error:', err)
    return serverError()
  }
}
