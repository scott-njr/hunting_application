---
name: scout-report-gen
description: Generate a full Scout Report for a given state and hunting unit. Use when creating comprehensive unit reports.
argument-hint: "<STATE> <UNIT>"
---

Generate a full Scout Report for a given state and hunting unit.

Arguments: $ARGUMENTS
(Expected format: "STATE UNIT" — e.g., `CO 85` or `WY 7` or `MT 316`)

## Your Task

Research and generate a complete Scout Report for the state and unit specified in the arguments. Use web search to find real, current data for each section. Do not hallucinate addresses, phone numbers, or distances.

## Sections to Research

### 1. Medical
Search: "nearest emergency room to [unit/area] [state]", "hospitals near [nearest town to unit]"
- Nearest ER/Emergency Room: name, address, phone, estimated drive time from unit centroid
- Nearest urgent care: name, address, phone
- Nearest trauma center (Level I or II): name, address, city

### 2. Logistics
Search: "fuel stations near [unit area] [state]", "grocery stores near [nearest town]"
- Nearest town with fuel: name, distance from unit
- Nearest grocery store: name, town, distance
- Note if any services are seasonal

### 3. Campgrounds
Search: site:recreation.gov "[state] [unit area]" campground, "[GMU/unit] hunting camp [state]"
- List developed campgrounds within ~30 miles of the unit: name, type (developed/dispersed), reservation required (Y/N), notes
- Note whether dispersed camping is available on public land in/near the unit

### 4. Meat Processors
Search: "wild game meat processing near [unit area] [state]", "deer elk processing [nearest town] [state]"
- List 2–4 processors within ~2 hour drive: name, town, phone, website if available
- Note: pack-in capable, cold storage available, appointment required

### 5. Local Game Warden
Search: "[state wildlife agency] district warden [county or unit number]", "[state] CPW/WGFD/FWP warden contact unit [X]"
- Warden name (if public record)
- Phone number
- Office location
- Unit-specific enforcement notes if any (e.g., quota check stations)

### 6. Cell Coverage
Search: "[GMU unit] [state] cell coverage hunting", "[unit area] dead zone cell signal"
- Note carriers with coverage
- Known dead zones or last reliable signal point
- Source: hunting forums (Colorado hunting forums, iSportsman, etc.) preferred over carrier maps

### 7. Road Conditions / Seasonal Closures
Search: "[state] seasonal road closure [unit area]", "CDOT [county] road closures" (or equivalent state DOT)
- Any roads in/near the unit that close seasonally (snow, muddy season)
- Typical open/close dates
- 4WD requirements

### 8. Predator Activity
Search: "[state wildlife agency] wolf bear mountain lion [unit county] news [current year]"
- Recent CPW/agency news releases mentioning predator activity near this unit
- Wolf pack presence (if applicable — relevant for CO, WY, MT, ID)
- Bear activity warnings
- Source URLs

## Output Format

Output as a structured JSON object matching the `scout_reports` table shape, plus a human-readable summary. Mark any unconfirmed data with `"[VERIFY]"`.

```json
{
  "state": "CO",
  "unit": "85",
  "generated_at": "<today's date>",
  "nearest_er": "...",
  "nearest_hospital": "...",
  "nearest_urgent_care": "...",
  "nearest_fuel": "...",
  "nearest_grocery": "...",
  "campgrounds": [...],
  "meat_processors": [...],
  "game_warden_name": "...",
  "game_warden_phone": "...",
  "game_warden_office": "...",
  "cell_coverage_notes": "...",
  "road_condition_notes": "...",
  "predator_activity_notes": "...",
  "report_data": {
    "sources": [...],
    "verify_flags": [...]
  }
}
```

## Rules
- Never invent addresses, phone numbers, or business names
- If you can't find real data for a section, write `"[VERIFY - could not confirm]"` in that field
- Always include source URLs in `report_data.sources`
- Note the date this data was gathered — Scout Reports expire and should be refreshed annually
