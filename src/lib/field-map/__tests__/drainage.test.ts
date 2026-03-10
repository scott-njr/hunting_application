import { describe, it, expect } from 'vitest'
import {
  buildGridFromArray,
  traceDrainageFlow,
  flowResultToBands,
  getCrossSlopeCurvature,
} from '../drainage'

// Helper: create a grid with known elevation values
// Row 0 = south, row N = north. Col 0 = west, col N = east.
const CELL_SIZE = 0.0006 // ~67m
const ORIGIN_LAT = 39.0
const ORIGIN_LNG = -105.0

// ─── traceDrainageFlow ──────────────────────────────────────────────────────

describe('traceDrainageFlow', () => {
  it('follows steepest descent on a uniform south-sloping terrain', () => {
    // Each row going north is 10m higher
    const data = Array.from({ length: 10 }, (_, row) =>
      new Array(10).fill(row * 10), // row 0 = 0m, row 9 = 90m
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    // Start in the middle (row 5, col 5) — should flow south (downhill)
    const result = traceDrainageFlow(grid, 5, 5, 500)

    expect(result.points.length).toBeGreaterThan(2)
    expect(result.totalLengthM).toBeGreaterThan(0)

    // All points after start should have decreasing row (going south)
    for (let i = 1; i < result.points.length; i++) {
      expect(result.points[i].row).toBeLessThan(result.points[i - 1].row)
    }
  })

  it('follows a V-shaped valley (drainage channel)', () => {
    // 10x10 grid with a V-shaped valley running N-S through col 5
    // Elevation: higher on edges, lowest at col 5, slopes down going south
    const data = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 10 }, (_, col) => {
        const distFromCenter = Math.abs(col - 5)
        const valleyDepth = distFromCenter * 15 // steep V shape
        const northSouthSlope = row * 5 // also slopes down to south
        return northSouthSlope + valleyDepth
      }),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    // Start at row 7, col 6 (one col east of valley floor)
    const result = traceDrainageFlow(grid, 7, 6, 800)

    expect(result.points.length).toBeGreaterThan(2)

    // Flow should move toward the valley floor (col 5) and south
    const lastPoint = result.points[result.points.length - 1]
    expect(lastPoint.col).toBeLessThanOrEqual(6) // moved toward or into valley
    expect(lastPoint.row).toBeLessThan(7) // moved south
  })

  it('stops at a basin (local minimum)', () => {
    // Bowl: center is lowest, all edges higher
    const data = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 10 }, (_, col) => {
        const dr = row - 5
        const dc = col - 5
        return dr * dr + dc * dc // parabolic bowl, minimum at (5,5)
      }),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    // Start at row 8, col 5 (north side of bowl)
    const result = traceDrainageFlow(grid, 8, 5, 1000)

    expect(result.points.length).toBeGreaterThan(1)

    // Should end near the bowl center
    const lastPoint = result.points[result.points.length - 1]
    expect(lastPoint.row).toBeCloseTo(5, 0)
    expect(lastPoint.col).toBeCloseTo(5, 0)

    // Should have a pooling zone
    expect(result.poolingZone).not.toBeNull()
    expect(result.poolingZone!.length).toBeGreaterThan(3) // circle polygon
  })

  it('traces uphill when uphill=true (heating mode)', () => {
    // Each row going north is 10m higher
    const data = Array.from({ length: 10 }, (_, row) =>
      new Array(10).fill(row * 10),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    // Start in middle, trace uphill
    const result = traceDrainageFlow(grid, 5, 5, 500, true)

    expect(result.points.length).toBeGreaterThan(2)

    // All points should go north (increasing row = uphill)
    for (let i = 1; i < result.points.length; i++) {
      expect(result.points[i].row).toBeGreaterThan(result.points[i - 1].row)
    }
  })

  it('stops on flat terrain (no gradient)', () => {
    const data = Array.from({ length: 10 }, () => new Array(10).fill(100))
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 5, 5, 500)

    // Should only have the starting point
    expect(result.points.length).toBe(1)
    expect(result.totalLengthM).toBe(0)
  })

  it('respects maxRangeM limit', () => {
    // Steep slope, but limit range to 200m
    const data = Array.from({ length: 20 }, (_, row) =>
      new Array(20).fill(row * 20),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 15, 10, 200)

    expect(result.totalLengthM).toBeLessThanOrEqual(200 + 100) // allow one step overshoot
  })

  it('does not revisit cells (prevents loops)', () => {
    // Saddle-like terrain that could cause loops
    const data = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 10 }, (_, col) => {
        return Math.sin(row * 0.5) * 10 + Math.cos(col * 0.5) * 10 + 100
      }),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 5, 5, 1000)

    // Check no duplicate positions
    const positions = result.points.map(p => `${p.row},${p.col}`)
    expect(new Set(positions).size).toBe(positions.length)
  })

  it('generates valid left and right boundaries', () => {
    const data = Array.from({ length: 10 }, (_, row) =>
      new Array(10).fill(row * 10),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 7, 5, 500)

    expect(result.leftBoundary.length).toBe(result.points.length)
    expect(result.rightBoundary.length).toBe(result.points.length)

    // Boundary points should be near but offset from centerline
    for (let i = 0; i < result.points.length; i++) {
      const p = result.points[i]
      const l = result.leftBoundary[i]
      const r = result.rightBoundary[i]
      // Left and right should differ in at least one coordinate
      const diffLat = Math.abs(l[0] - r[0])
      const diffLng = Math.abs(l[1] - r[1])
      expect(diffLat + diffLng).toBeGreaterThan(0)
      // Both should be close to the center point
      expect(Math.abs(l[0] - p.lat)).toBeLessThan(0.01)
      expect(Math.abs(r[0] - p.lat)).toBeLessThan(0.01)
    }
  })
})

// ─── getCrossSlopeCurvature ─────────────────────────────────────────────────

describe('getCrossSlopeCurvature', () => {
  it('returns positive for concave terrain (drainage — neighbors higher)', () => {
    // V-shaped: col 5 is lowest, sides are higher
    const data = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, (_, col) => Math.abs(col - 5) * 20),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    // Flow going north (0°), perpendicular is E-W — both sides higher than center
    const curvature = getCrossSlopeCurvature(grid, 5, 5, 0)
    expect(curvature).toBeGreaterThan(0) // positive = concave (drainage)
  })

  it('returns 0 for flat terrain', () => {
    const data = Array.from({ length: 10 }, () => new Array(10).fill(100))
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const curvature = getCrossSlopeCurvature(grid, 5, 5, 0)
    expect(curvature).toBe(0)
  })

  it('returns 0 for edge cells', () => {
    const data = Array.from({ length: 10 }, () => new Array(10).fill(100))
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const curvature = getCrossSlopeCurvature(grid, 0, 5, 0)
    expect(curvature).toBe(0) // can't sample both perpendicular neighbors
  })
})

// ─── flowResultToBands ──────────────────────────────────────────────────────

describe('flowResultToBands', () => {
  it('returns 3 bands with correct opacities', () => {
    const data = Array.from({ length: 10 }, (_, row) =>
      new Array(10).fill(row * 10),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 7, 5, 500)
    const bands = flowResultToBands(result)

    expect(bands).toHaveLength(3)
    expect(bands[0].opacity).toBe(0.18)
    expect(bands[1].opacity).toBe(0.28)
    expect(bands[2].opacity).toBe(0.40)
  })

  it('bands have decreasing width (outer is widest)', () => {
    const data = Array.from({ length: 10 }, (_, row) =>
      new Array(10).fill(row * 10),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 7, 5, 500)
    const bands = flowResultToBands(result)

    // Outer band should have more spread than inner
    const outerCoords = bands[0].coordinates
    const innerCoords = bands[2].coordinates

    // Compare max lateral extent (difference between first and second half)
    const outerWidth = Math.max(...outerCoords.map(c => c[1])) - Math.min(...outerCoords.map(c => c[1]))
    const innerWidth = Math.max(...innerCoords.map(c => c[1])) - Math.min(...innerCoords.map(c => c[1]))

    expect(outerWidth).toBeGreaterThan(innerWidth)
  })

  it('returns closed polygons', () => {
    const data = Array.from({ length: 10 }, (_, row) =>
      new Array(10).fill(row * 10),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 7, 5, 500)
    const bands = flowResultToBands(result)

    for (const band of bands) {
      const first = band.coordinates[0]
      const last = band.coordinates[band.coordinates.length - 1]
      expect(first[0]).toBeCloseTo(last[0], 5)
      expect(first[1]).toBeCloseTo(last[1], 5)
    }
  })

  it('returns empty array for single-point result', () => {
    const data = Array.from({ length: 10 }, () => new Array(10).fill(100))
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 5, 5, 500)
    const bands = flowResultToBands(result)

    expect(bands).toHaveLength(0) // can't make polygon from 1 point
  })

  it('returns coordinates in [lat, lng] format for Leaflet', () => {
    const data = Array.from({ length: 10 }, (_, row) =>
      new Array(10).fill(row * 10),
    )
    const grid = buildGridFromArray(data, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)

    const result = traceDrainageFlow(grid, 7, 5, 500)
    const bands = flowResultToBands(result)

    const first = bands[0].coordinates[0]
    expect(first[0]).toBeCloseTo(ORIGIN_LAT, 0) // lat
    expect(first[1]).toBeCloseTo(ORIGIN_LNG, 0) // lng
  })
})

// ─── buildGridFromArray ─────────────────────────────────────────────────────

describe('buildGridFromArray', () => {
  it('builds grid with correct dimensions', () => {
    const data = [[1, 2], [3, 4]]
    const grid = buildGridFromArray(data, 39.0, -105.0, 0.001)

    expect(grid.rows).toBe(2)
    expect(grid.cols).toBe(2)
    expect(grid.originLat).toBe(39.0)
    expect(grid.originLng).toBe(-105.0)
    expect(grid.cellSizeDeg).toBe(0.001)
    expect(grid.data).toEqual([[1, 2], [3, 4]])
  })
})

// ─── Spread narrowing in drainage ───────────────────────────────────────────

describe('spread width behavior', () => {
  it('narrows in drainage channels compared to open slope', () => {
    // Open slope: uniform south-sloping
    const openData = Array.from({ length: 15 }, (_, row) =>
      new Array(15).fill(row * 10),
    )
    const openGrid = buildGridFromArray(openData, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)
    const openResult = traceDrainageFlow(openGrid, 12, 7, 500)

    // Drainage: V-shaped valley with south slope
    const drainageData = Array.from({ length: 15 }, (_, row) =>
      Array.from({ length: 15 }, (_, col) => {
        const valleyDepth = Math.abs(col - 7) * 15
        return row * 10 + valleyDepth
      }),
    )
    const drainageGrid = buildGridFromArray(drainageData, ORIGIN_LAT, ORIGIN_LNG, CELL_SIZE)
    const drainageResult = traceDrainageFlow(drainageGrid, 12, 7, 500)

    // Compare widths at similar distances
    if (openResult.points.length > 3 && drainageResult.points.length > 3) {
      const openMidWidth = openResult.points[3].widthM
      const drainageMidWidth = drainageResult.points[3].widthM
      expect(drainageMidWidth).toBeLessThan(openMidWidth)
    }
  })
})
