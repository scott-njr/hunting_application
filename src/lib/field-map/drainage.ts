/**
 * Terrain-following scent flow algorithm.
 *
 * Traces the path scent takes across real terrain by following steepest
 * descent (cooling/night) or ascent (heating/day) from a pin location.
 * Produces a polygon that curves with terrain features — narrowing in
 * drainages, widening on open slopes.
 *
 * All functions are pure (no API calls, no side effects) for testability.
 */

import type { ScentConeBand } from './thermals'

const DEG = Math.PI / 180

// ─── Types ──────────────────────────────────────────────────────────────────

export type ElevationGrid = {
  data: number[][]     // [row][col] elevation in meters, row 0 = south
  rows: number
  cols: number
  originLat: number    // SW corner latitude
  originLng: number    // SW corner longitude
  cellSizeDeg: number  // grid spacing in degrees
}

export type FlowPoint = {
  row: number
  col: number
  lat: number
  lng: number
  elevM: number
  widthM: number
  distFromOriginM: number
}

export type DrainageFlowResult = {
  points: FlowPoint[]
  leftBoundary: [number, number][]   // [lat, lng]
  rightBoundary: [number, number][]  // [lat, lng]
  poolingZone: [number, number][] | null
  totalLengthM: number
  elevationDropM: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Base scent spread width at the origin (meters) */
const BASE_WIDTH_M = 30

/** Maximum scent spread width (meters) */
const MAX_WIDTH_M = 150

/** Distance over which spread grows to maximum (meters) */
const SPREAD_DISTANCE_M = 400

/** Minimum gradient (m rise / m run) to continue tracing (~0.6° slope) */
const MIN_GRADIENT_M = 0.01

// D8 neighbor offsets: [dRow, dCol] for 8 directions
// Ordered: N, NE, E, SE, S, SW, W, NW
const D8_OFFSETS: [number, number][] = [
  [1, 0], [1, 1], [0, 1], [-1, 1],
  [-1, 0], [-1, -1], [0, -1], [1, -1],
]

// Distance multiplier for diagonal neighbors (√2)
const D8_DIST: number[] = [1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2]

// ─── Grid Builder ───────────────────────────────────────────────────────────

/**
 * Build an ElevationGrid from an array of {lat, lng, elevation} samples
 * arranged in a regular grid.
 */
export function buildElevationGrid(
  samples: { x: number; y: number; value: number }[],
  gridSize: number,
  centerLat: number,
  centerLng: number,
  cellSizeDeg: number,
): ElevationGrid {
  const halfGrid = Math.floor(gridSize / 2)
  const originLat = centerLat - halfGrid * cellSizeDeg
  const originLng = centerLng - halfGrid * cellSizeDeg

  // Initialize grid
  const data: number[][] = Array.from({ length: gridSize }, () =>
    new Array(gridSize).fill(0),
  )

  // Map samples back to grid positions
  for (const sample of samples) {
    const col = Math.round((sample.x - originLng) / cellSizeDeg)
    const row = Math.round((sample.y - originLat) / cellSizeDeg)
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      data[row][col] = sample.value
    }
  }

  return { data, rows: gridSize, cols: gridSize, originLat, originLng, cellSizeDeg }
}

/**
 * Build an ElevationGrid directly from a 2D array (for testing).
 */
export function buildGridFromArray(
  data: number[][],
  originLat: number,
  originLng: number,
  cellSizeDeg: number,
): ElevationGrid {
  return {
    data,
    rows: data.length,
    cols: data[0]?.length ?? 0,
    originLat,
    originLng,
    cellSizeDeg,
  }
}

// ─── Flow Tracing ───────────────────────────────────────────────────────────

/**
 * Trace scent flow path across terrain following steepest descent (or ascent).
 *
 * @param grid - Elevation grid
 * @param startRow - Starting row in grid
 * @param startCol - Starting column in grid
 * @param maxRangeM - Maximum distance to trace (meters)
 * @param uphill - If true, trace uphill (heating mode); default false (cooling)
 * @param windBiasDeg - Optional wind direction bias (degrees, 0=N). Breaks ties.
 */
export function traceDrainageFlow(
  grid: ElevationGrid,
  startRow: number,
  startCol: number,
  maxRangeM: number,
  uphill = false,
  windBiasDeg?: number,
): DrainageFlowResult {
  const cellSizeM = grid.cellSizeDeg * 111320
  const points: FlowPoint[] = []
  let totalDist = 0
  let currentRow = startRow
  let currentCol = startCol

  // Track visited cells to prevent loops
  const visited = new Set<string>()

  // Starting point
  const startElev = grid.data[startRow]?.[startCol] ?? 0
  points.push({
    row: startRow,
    col: startCol,
    lat: grid.originLat + startRow * grid.cellSizeDeg,
    lng: grid.originLng + startCol * grid.cellSizeDeg,
    elevM: startElev,
    widthM: BASE_WIDTH_M,
    distFromOriginM: 0,
  })
  visited.add(`${startRow},${startCol}`)

  while (totalDist < maxRangeM) {
    const currentElev = grid.data[currentRow]?.[currentCol] ?? 0
    let bestIdx = -1
    let bestGradient = MIN_GRADIENT_M // minimum gradient to continue

    // Evaluate all 8 neighbors
    for (let i = 0; i < 8; i++) {
      const [dr, dc] = D8_OFFSETS[i]
      const nr = currentRow + dr
      const nc = currentCol + dc

      // Bounds check
      if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue
      if (visited.has(`${nr},${nc}`)) continue

      const neighborElev = grid.data[nr][nc]
      const dist = cellSizeM * D8_DIST[i]
      const drop = uphill ? (neighborElev - currentElev) : (currentElev - neighborElev)
      const gradient = drop / dist

      if (gradient > bestGradient) {
        bestGradient = gradient
        bestIdx = i
      } else if (gradient === bestGradient && windBiasDeg !== undefined && bestIdx >= -1) {
        // Tie-break using wind direction bias
        const neighborAngle = getD8Angle(i)
        const bestAngle = bestIdx >= 0 ? getD8Angle(bestIdx) : 0
        const neighborDiff = Math.abs(angleDelta(neighborAngle, windBiasDeg))
        const bestDiff = Math.abs(angleDelta(bestAngle, windBiasDeg))
        if (neighborDiff < bestDiff) {
          bestIdx = i
        }
      }
    }

    // No suitable neighbor — scent pools here
    if (bestIdx < 0) break

    const [dr, dc] = D8_OFFSETS[bestIdx]
    currentRow += dr
    currentCol += dc
    visited.add(`${currentRow},${currentCol}`)

    const stepDist = cellSizeM * D8_DIST[bestIdx]
    totalDist += stepDist

    const elev = grid.data[currentRow][currentCol]
    const flowDirDeg = getD8Angle(bestIdx)
    const width = computeSpreadWidth(grid, currentRow, currentCol, flowDirDeg, totalDist)

    points.push({
      row: currentRow,
      col: currentCol,
      lat: grid.originLat + currentRow * grid.cellSizeDeg,
      lng: grid.originLng + currentCol * grid.cellSizeDeg,
      elevM: elev,
      widthM: width,
      distFromOriginM: totalDist,
    })
  }

  // Generate polygon boundaries
  const { left, right } = generateBoundaries(points)

  // Check if path ended in a basin (last point had no lower neighbor)
  const lastPoint = points[points.length - 1]
  const endedInBasin = totalDist < maxRangeM && points.length > 1
  const poolingZone = endedInBasin
    ? generatePoolCircle(lastPoint.lat, lastPoint.lng, lastPoint.widthM * 0.5)
    : null

  return {
    points,
    leftBoundary: left,
    rightBoundary: right,
    poolingZone,
    totalLengthM: totalDist,
    elevationDropM: Math.abs(startElev - (lastPoint?.elevM ?? startElev)),
  }
}

// ─── Spread Width ───────────────────────────────────────────────────────────

/**
 * Compute scent spread width at a point based on terrain shape and distance.
 * Narrower in drainages (concave), wider on open slopes.
 */
function computeSpreadWidth(
  grid: ElevationGrid,
  row: number,
  col: number,
  flowDirDeg: number,
  distFromOriginM: number,
): number {
  const distanceFactor = Math.min(1, distFromOriginM / SPREAD_DISTANCE_M)

  // Cross-slope curvature: sample elevations perpendicular to flow
  const curvature = getCrossSlopeCurvature(grid, row, col, flowDirDeg)

  // Positive curvature = concave (drainage, neighbors higher) → narrow
  // Negative curvature = convex (ridge, neighbors lower) → wider
  // Zero = uniform slope
  const curvatureFactor = curvature > 0.5
    ? 0.4   // strong drainage — very channeled
    : curvature > 0.1
      ? 0.6 // mild drainage
      : 1.0 // open slope or ridge

  // Local slope: steeper = more channeled
  const localSlope = getLocalSlopeDeg(grid, row, col)
  const slopeFactor = Math.max(0.4, 1 - localSlope / 40)

  return BASE_WIDTH_M + (MAX_WIDTH_M - BASE_WIDTH_M) * distanceFactor * slopeFactor * curvatureFactor
}

/**
 * Compute cross-slope curvature at a grid cell.
 * Negative = concave (drainage), Positive = convex (ridge/spur).
 */
export function getCrossSlopeCurvature(
  grid: ElevationGrid,
  row: number,
  col: number,
  flowDirDeg: number,
): number {
  const centerElev = grid.data[row]?.[col] ?? 0

  // Get perpendicular direction (90° to flow)
  const perpDeg = (flowDirDeg + 90) % 360
  const perpRad = perpDeg * DEG

  // Sample 1 cell in each perpendicular direction
  const dr1 = Math.round(Math.cos(perpRad))
  const dc1 = Math.round(Math.sin(perpRad))
  const dr2 = -dr1
  const dc2 = -dc1

  const r1 = row + dr1
  const c1 = col + dc1
  const r2 = row + dr2
  const c2 = col + dc2

  // Bounds check — if either is out of bounds, assume flat
  if (r1 < 0 || r1 >= grid.rows || c1 < 0 || c1 >= grid.cols) return 0
  if (r2 < 0 || r2 >= grid.rows || c2 < 0 || c2 >= grid.cols) return 0

  const e1 = grid.data[r1][c1]
  const e2 = grid.data[r2][c2]

  // Second derivative: (e1 + e2 - 2*center) / dx²
  // Positive = convex (ridge), Negative = concave (drainage)
  const cellSizeM = grid.cellSizeDeg * 111320
  return (e1 + e2 - 2 * centerElev) / (cellSizeM * cellSizeM) * 1000 // scale for readability
}

/**
 * Compute local slope steepness in degrees at a grid cell.
 */
function getLocalSlopeDeg(grid: ElevationGrid, row: number, col: number): number {
  const cellSizeM = grid.cellSizeDeg * 111320

  // N-S gradient
  const elN = grid.data[Math.min(row + 1, grid.rows - 1)]?.[col] ?? 0
  const elS = grid.data[Math.max(row - 1, 0)]?.[col] ?? 0
  const dZdY = (elN - elS) / (2 * cellSizeM)

  // E-W gradient
  const elE = grid.data[row]?.[Math.min(col + 1, grid.cols - 1)] ?? 0
  const elW = grid.data[row]?.[Math.max(col - 1, 0)] ?? 0
  const lat = grid.originLat + row * grid.cellSizeDeg
  const dZdX = (elE - elW) / (2 * cellSizeM * Math.cos(lat * DEG))

  return Math.atan(Math.sqrt(dZdX ** 2 + dZdY ** 2)) / DEG
}

// ─── Polygon Generation ────────────────────────────────────────────────────

/**
 * Generate left and right boundary coordinates from flow points.
 * Offsets each point perpendicular to the flow direction by its width.
 */
function generateBoundaries(points: FlowPoint[]): {
  left: [number, number][]
  right: [number, number][]
} {
  if (points.length < 2) {
    const p = points[0]
    if (!p) return { left: [], right: [] }
    return {
      left: [[p.lat, p.lng]],
      right: [[p.lat, p.lng]],
    }
  }

  const left: [number, number][] = []
  const right: [number, number][] = []
  const mPerDegLat = 111320

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const mPerDegLng = 111320 * Math.cos(p.lat * DEG)

    // Compute flow direction at this point
    let flowDirDeg: number
    if (i < points.length - 1) {
      const next = points[i + 1]
      flowDirDeg = Math.atan2(next.lng - p.lng, next.lat - p.lat) / DEG
    } else {
      const prev = points[i - 1]
      flowDirDeg = Math.atan2(p.lng - prev.lng, p.lat - prev.lat) / DEG
    }

    // Perpendicular offset
    const perpRad = (flowDirDeg + 90) * DEG
    const halfWidth = p.widthM / 2
    const dLat = (halfWidth * Math.cos(perpRad)) / mPerDegLat
    const dLng = (halfWidth * Math.sin(perpRad)) / mPerDegLng

    left.push([p.lat + dLat, p.lng + dLng])
    right.push([p.lat - dLat, p.lng - dLng])
  }

  return { left, right }
}

/**
 * Generate a small circle for pooling zone at flow terminus.
 */
function generatePoolCircle(lat: number, lng: number, radiusM: number): [number, number][] {
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * Math.cos(lat * DEG)
  const steps = 16
  const coords: [number, number][] = []

  for (let i = 0; i <= steps; i++) {
    const angle = (360 * i / steps) * DEG
    coords.push([
      lat + (radiusM * Math.cos(angle)) / mPerDegLat,
      lng + (radiusM * Math.sin(angle)) / mPerDegLng,
    ])
  }

  return coords
}

// ─── Band Generation ────────────────────────────────────────────────────────

/**
 * Convert a DrainageFlowResult into 3 ScentConeBand layers for map rendering.
 * Matches the same type used by getScentConeBands() for seamless integration.
 */
export function flowResultToBands(result: DrainageFlowResult): ScentConeBand[] {
  if (result.points.length < 2) return []

  const bandDefs = [
    { widthScale: 1.0, opacity: 0.18 },
    { widthScale: 0.66, opacity: 0.28 },
    { widthScale: 0.33, opacity: 0.40 },
  ]

  return bandDefs.map(({ widthScale, opacity }) => {
    // Scale the width of each flow point
    const scaledPoints = result.points.map(p => ({
      ...p,
      widthM: p.widthM * widthScale,
    }))

    const { left, right } = generateBoundaries(scaledPoints)

    // Build closed polygon: left boundary → reversed right boundary → close
    const coordinates: [number, number][] = [
      ...left,
      ...right.reverse(),
    ]
    // Close the polygon
    if (coordinates.length > 0) {
      coordinates.push(coordinates[0])
    }

    // Add pooling zone if present and this is the outer band
    if (result.poolingZone && widthScale === 1.0) {
      // Pooling zone is rendered separately by the map if needed
    }

    return { coordinates, opacity }
  })
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get compass angle (degrees, 0=N clockwise) for a D8 direction index. */
function getD8Angle(idx: number): number {
  // N=0, NE=45, E=90, SE=135, S=180, SW=225, W=270, NW=315
  return idx * 45
}

/** Smallest signed angle between two bearings (-180 to +180). */
function angleDelta(a: number, b: number): number {
  return ((b - a) % 360 + 540) % 360 - 180
}
