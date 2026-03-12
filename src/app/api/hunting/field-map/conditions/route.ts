import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest } from '@/lib/api-response'

const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

function degreesToCompass(deg: number): string {
  const idx = Math.round(deg / 45) % 8
  return WIND_DIRS[idx]
}

function getMoonData(date: Date) {
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime()
  const SYNODIC = 29.53059
  const diff = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24)
  const phase = ((diff % SYNODIC) + SYNODIC) % SYNODIC
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase / SYNODIC)) / 2 * 100)

  const phaseName =
    phase < 1.85 ? 'New Moon'
    : phase < 7.38 ? 'Waxing Crescent'
    : phase < 9.23 ? 'First Quarter'
    : phase < 14.77 ? 'Waxing Gibbous'
    : phase < 16.61 ? 'Full Moon'
    : phase < 22.15 ? 'Waning Gibbous'
    : phase < 23.99 ? 'Last Quarter'
    : phase < 29.53 ? 'Waning Crescent'
    : 'New Moon'

  return { moon_phase: phaseName, moon_illumination: illumination }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return badRequest('lat and lng required')
  }

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  if (isNaN(latNum) || isNaN(lngNum)) {
    return badRequest('lat and lng must be numbers')
  }

  const moon = getMoonData(new Date())

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&current=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure&temperature_unit=fahrenheit&wind_speed_unit=mph`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)

    const data = await res.json()
    const current = data.current

    return apiOk({
      temp_f: Math.round(current.temperature_2m),
      wind_speed_mph: Math.round(current.wind_speed_10m * 10) / 10,
      wind_direction: degreesToCompass(current.wind_direction_10m),
      wind_direction_deg: Math.round(current.wind_direction_10m),
      pressure_inhg: Math.round(current.surface_pressure * 0.02953 * 100) / 100,
      pressure_trend: null,
      ...moon,
    } as Record<string, unknown>)
  } catch (err) {
    console.error('[hunting/field-map/conditions] weather fetch failed:', err)
    // Return moon data even if weather fails
    return apiOk({
      temp_f: null,
      wind_speed_mph: null,
      wind_direction: null,
      wind_direction_deg: null,
      pressure_inhg: null,
      pressure_trend: null,
      ...moon,
    } as Record<string, unknown>)
  }
}
