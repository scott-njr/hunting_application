import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildElevationGrid,
  traceDrainageFlow,
  flowResultToBands,
} from '@/lib/field-map/drainage'

/** Grid dimensions — 15×15 = 225 sample points */
const GRID_SIZE = 15

/** Cell spacing in degrees (~67m at mid-latitudes) */
const CELL_SIZE_DEG = 0.0006

/** USGS 3DEP ImageServer endpoint */
const USGS_3DEP_URL =
  'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples'

/**
 * GET /api/hunting/field-map/drainage?lat=X&lng=Y&range=500&uphill=false
 *
 * Fetches a DEM grid from USGS 3DEP and traces terrain-following
 * scent flow path from the given location.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const maxRange = parseFloat(searchParams.get('range') ?? '500')
  const uphill = searchParams.get('uphill') === 'true'
  const windBias = searchParams.get('windBias')
    ? parseFloat(searchParams.get('windBias')!)
    : undefined

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  try {
    // Generate grid points centered on the pin
    const halfGrid = Math.floor(GRID_SIZE / 2)
    const points: [number, number][] = []

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const ptLat = lat + (row - halfGrid) * CELL_SIZE_DEG
        const ptLng = lng + (col - halfGrid) * CELL_SIZE_DEG
        points.push([ptLng, ptLat]) // USGS expects [x, y] = [lng, lat]
      }
    }

    // Fetch all elevations in a single POST to USGS 3DEP getSamples
    const geometry = JSON.stringify({
      points,
      spatialReference: { wkid: 4326 },
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(USGS_3DEP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        geometry,
        geometryType: 'esriGeometryMultipoint',
        returnFirstValueOnly: 'true',
        f: 'json',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      // Fall back to individual EPQS queries if getSamples fails
      return await fallbackToEpqs(lat, lng, maxRange, uphill, windBias)
    }

    const data = await res.json()

    // Parse the getSamples response
    const samples = parseSamplesResponse(data, points)

    if (samples.length < GRID_SIZE * GRID_SIZE * 0.5) {
      // Too many missing values — fall back
      return await fallbackToEpqs(lat, lng, maxRange, uphill, windBias)
    }

    // Build grid and trace flow
    const grid = buildElevationGrid(samples, GRID_SIZE, lat, lng, CELL_SIZE_DEG)
    const startRow = halfGrid
    const startCol = halfGrid

    const result = traceDrainageFlow(grid, startRow, startCol, maxRange, uphill, windBias)
    const bands = flowResultToBands(result)

    const response = NextResponse.json({
      bands,
      totalLengthM: result.totalLengthM,
      elevationDropM: result.elevationDropM,
      pointCount: result.points.length,
      poolingZone: result.poolingZone,
    })

    // DEM data is static — cache aggressively
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800')
    return response
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.warn('[hunting/field-map/drainage] USGS request timed out')
    } else {
      console.error('[hunting/field-map/drainage] Error:', err)
    }
    // Return null — the client falls back to a straight cone
    return NextResponse.json({ bands: null })
  }
}

/**
 * Parse USGS getSamples response into grid-friendly format.
 */
function parseSamplesResponse(
  data: Record<string, unknown>,
  originalPoints: [number, number][],
): { x: number; y: number; value: number }[] {
  const samples: { x: number; y: number; value: number }[] = []

  // getSamples returns { samples: [{ location: {x, y}, value }, ...] }
  const rawSamples = (data as { samples?: Array<{ location?: { x: number; y: number }; value?: string | number }> }).samples

  if (Array.isArray(rawSamples)) {
    for (let i = 0; i < rawSamples.length; i++) {
      const s = rawSamples[i]
      const value = typeof s.value === 'string' ? parseFloat(s.value) : (s.value ?? 0)
      if (isNaN(value) || value === -9999) continue // USGS nodata sentinel

      const loc = s.location ?? { x: originalPoints[i]?.[0] ?? 0, y: originalPoints[i]?.[1] ?? 0 }
      samples.push({ x: loc.x, y: loc.y, value })
    }
  }

  return samples
}

/**
 * Fallback: fetch a smaller grid using individual EPQS point queries.
 * Uses a 9×9 grid (81 points) to limit API calls.
 */
async function fallbackToEpqs(
  lat: number,
  lng: number,
  maxRange: number,
  uphill: boolean,
  windBias?: number,
): Promise<NextResponse> {
  const fallbackSize = 9
  const halfGrid = Math.floor(fallbackSize / 2)
  const cellSize = CELL_SIZE_DEG * 1.5 // slightly larger cells to cover same area

  const fetches: Promise<{ x: number; y: number; value: number } | null>[] = []

  for (let row = 0; row < fallbackSize; row++) {
    for (let col = 0; col < fallbackSize; col++) {
      const ptLat = lat + (row - halfGrid) * cellSize
      const ptLng = lng + (col - halfGrid) * cellSize

      fetches.push(
        fetch(
          `https://epqs.nationalmap.gov/v1/json?x=${ptLng}&y=${ptLat}&wkid=4326&units=Meters&includeDate=false`,
        )
          .then(async (r) => {
            if (!r.ok) return null
            const d = await r.json()
            const v = parseFloat(d.value)
            return isNaN(v) ? null : { x: ptLng, y: ptLat, value: v }
          })
          .catch(() => null),
      )
    }
  }

  const results = await Promise.all(fetches)
  const samples = results.filter((s): s is { x: number; y: number; value: number } => s !== null)

  if (samples.length < fallbackSize * fallbackSize * 0.5) {
    return NextResponse.json({ bands: null })
  }

  const grid = buildElevationGrid(samples, fallbackSize, lat, lng, cellSize)
  const result = traceDrainageFlow(grid, halfGrid, halfGrid, maxRange, uphill, windBias)
  const bands = flowResultToBands(result)

  return NextResponse.json({
    bands,
    totalLengthM: result.totalLengthM,
    elevationDropM: result.elevationDropM,
    pointCount: result.points.length,
    poolingZone: result.poolingZone,
  })
}
