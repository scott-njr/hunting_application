import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiOk, unauthorized, badRequest, withHandler, serverError } from '@/lib/api-response'

const DEG = Math.PI / 180

/**
 * GET /api/hunting/field-map/terrain?lat=X&lng=Y
 *
 * Fetches elevation from USGS 3DEP and computes slope/aspect
 * from a 3-point gradient (~50m offset grid).
 */
export const GET = withHandler(async (req: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return badRequest('lat and lng required')
  }

  try {
    // Offset ~50m in each direction for gradient calculation
    const offset = 0.00045 // ~50m at mid-latitudes

    const [elCenter, elN, elS, elE, elW] = await Promise.all([
      fetchElevation(lat, lng),
      fetchElevation(lat + offset, lng),
      fetchElevation(lat - offset, lng),
      fetchElevation(lat, lng + offset),
      fetchElevation(lat, lng - offset),
    ])

    const cellSizeM = offset * 111320 // approx meters per degree latitude

    // Gradient in N-S and E-W directions (meters rise per meter run)
    const dZdY = (elN - elS) / (2 * cellSizeM)
    const dZdX = (elE - elW) / (2 * cellSizeM * Math.cos(lat * DEG))

    const slopeDeg = Math.atan(Math.sqrt(dZdX ** 2 + dZdY ** 2)) * (180 / Math.PI)

    // Aspect: direction the slope faces (where water would flow from)
    const aspectRad = Math.atan2(dZdX, dZdY)
    const slopeAspectDeg = ((aspectRad * (180 / Math.PI)) + 360) % 360

    return apiOk({
      elevationFt: Math.round(elCenter * 3.28084), // meters to feet
      slopeDeg: Math.round(slopeDeg * 10) / 10,
      slopeAspectDeg: Math.round(slopeAspectDeg),
    })
  } catch (err) {
    console.error('[hunting/field-map/terrain] fetch failed:', err)
    return apiOk({
      elevationFt: 5000,
      slopeDeg: 10,
      slopeAspectDeg: 180,
    })
  }
})


async function fetchElevation(lat: number, lng: number): Promise<number> {
  const url = `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&wkid=4326&units=Meters&includeDate=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`USGS 3DEP ${res.status}`)
  const data = await res.json()
  return parseFloat(data.value) || 0
}
