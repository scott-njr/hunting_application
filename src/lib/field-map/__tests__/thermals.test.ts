import { describe, it, expect } from 'vitest'
import {
  getThermalState,
  getScentCone,
  getScentConeBands,
  getScentPoolCircle,
  getConeParams,
  isInBlowoutZone,
  getSolarPosition,
  compassToDegrees,
  bearingToCardinal,
  getBearing,
  getDistanceM,
} from '../thermals'

// ─── compassToDegrees ─────────────────────────────────────────────────────────

describe('compassToDegrees', () => {
  it('converts 8-point compass strings', () => {
    expect(compassToDegrees('N')).toBe(0)
    expect(compassToDegrees('NE')).toBe(45)
    expect(compassToDegrees('E')).toBe(90)
    expect(compassToDegrees('SE')).toBe(135)
    expect(compassToDegrees('S')).toBe(180)
    expect(compassToDegrees('SW')).toBe(225)
    expect(compassToDegrees('W')).toBe(270)
    expect(compassToDegrees('NW')).toBe(315)
  })

  it('converts 16-point compass strings', () => {
    expect(compassToDegrees('NNE')).toBe(22.5)
    expect(compassToDegrees('ENE')).toBe(67.5)
    expect(compassToDegrees('SSW')).toBe(202.5)
    expect(compassToDegrees('WNW')).toBe(292.5)
  })

  it('is case insensitive', () => {
    expect(compassToDegrees('ne')).toBe(45)
    expect(compassToDegrees('Sw')).toBe(225)
  })

  it('returns 0 for unknown strings', () => {
    expect(compassToDegrees('X')).toBe(0)
    expect(compassToDegrees('')).toBe(0)
  })
})

// ─── bearingToCardinal ────────────────────────────────────────────────────────

describe('bearingToCardinal', () => {
  it('converts degrees to cardinal directions', () => {
    expect(bearingToCardinal(0)).toBe('N')
    expect(bearingToCardinal(90)).toBe('E')
    expect(bearingToCardinal(180)).toBe('S')
    expect(bearingToCardinal(270)).toBe('W')
    expect(bearingToCardinal(45)).toBe('NE')
    expect(bearingToCardinal(225)).toBe('SW')
  })

  it('handles negative and overflow degrees', () => {
    expect(bearingToCardinal(360)).toBe('N')
    expect(bearingToCardinal(-90)).toBe('W')
    expect(bearingToCardinal(720)).toBe('N')
  })
})

// ─── getBearing ───────────────────────────────────────────────────────────────

describe('getBearing', () => {
  it('returns ~0 for due north', () => {
    const b = getBearing(39.0, -105.0, 40.0, -105.0)
    expect(b).toBeCloseTo(0, 0)
  })

  it('returns ~90 for due east', () => {
    const b = getBearing(39.0, -105.0, 39.0, -104.0)
    expect(b).toBeCloseTo(90, 0)
  })

  it('returns ~180 for due south', () => {
    const b = getBearing(40.0, -105.0, 39.0, -105.0)
    expect(b).toBeCloseTo(180, 0)
  })

  it('returns ~270 for due west', () => {
    const b = getBearing(39.0, -104.0, 39.0, -105.0)
    expect(b).toBeCloseTo(270, 0)
  })
})

// ─── getDistanceM ─────────────────────────────────────────────────────────────

describe('getDistanceM', () => {
  it('returns 0 for same point', () => {
    expect(getDistanceM(39.0, -105.0, 39.0, -105.0)).toBe(0)
  })

  it('returns reasonable distance for known points', () => {
    // Denver to Colorado Springs ~100km
    const d = getDistanceM(39.7392, -104.9903, 38.8339, -104.8214)
    expect(d).toBeGreaterThan(90000)
    expect(d).toBeLessThan(110000)
  })

  it('returns ~111km for 1 degree latitude', () => {
    const d = getDistanceM(39.0, -105.0, 40.0, -105.0)
    expect(d).toBeGreaterThan(110000)
    expect(d).toBeLessThan(112000)
  })
})

// ─── getSolarPosition ─────────────────────────────────────────────────────────

describe('getSolarPosition', () => {
  it('returns positive altitude during daytime', () => {
    // Noon in Colorado, summer solstice
    const date = new Date('2026-06-21T18:00:00Z') // ~noon MDT
    const pos = getSolarPosition(39.0, -105.0, date)
    expect(pos.altitudeDeg).toBeGreaterThan(50)
  })

  it('returns negative altitude at night', () => {
    // Midnight in Colorado
    const date = new Date('2026-06-21T06:00:00Z') // ~midnight MDT
    const pos = getSolarPosition(39.0, -105.0, date)
    expect(pos.altitudeDeg).toBeLessThan(0)
  })

  it('returns azimuth between 0 and 360', () => {
    const date = new Date('2026-06-21T18:00:00Z')
    const pos = getSolarPosition(39.0, -105.0, date)
    expect(pos.azimuthDeg).toBeGreaterThanOrEqual(0)
    expect(pos.azimuthDeg).toBeLessThan(360)
  })
})

// ─── getThermalState ──────────────────────────────────────────────────────────

describe('getThermalState', () => {
  it('returns wind_override when wind > 8 mph', () => {
    const state = getThermalState({
      lat: 39.0, lng: -105.0,
      surfaceWindMph: 15,
      surfaceWindDirDeg: 180, // from south
    })
    expect(state.mode).toBe('wind_override')
    expect(state.confidence).toBe('high')
    // Wind from south → scent travels north
    expect(state.thermalDirDeg).toBe(0)
    expect(state.thermalLabel).toBe('N')
  })

  it('returns cooling mode at night on a slope', () => {
    const state = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeAspectDeg: 180, // south-facing
      slopeDeg: 15,
      datetime: new Date('2026-06-21T06:00:00Z'), // midnight MDT
      surfaceWindMph: 2,
    })
    expect(state.mode).toBe('cooling')
    // South-facing slope → downhill = north (180+180=360→0)
    expect(state.thermalDirDeg).toBe(0)
    expect(state.modeLabel).toBe('DROPPING')
  })

  it('returns heating mode on a sun-facing slope during midday', () => {
    const state = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeAspectDeg: 180, // south-facing
      slopeDeg: 20,
      datetime: new Date('2026-06-21T18:00:00Z'), // noon MDT
      surfaceWindMph: 2,
      cloudCoverPct: 0,
    })
    expect(state.mode).toBe('heating')
    expect(state.thermalDirDeg).toBe(180)
    expect(state.modeLabel).toBe('RISING')
  })

  it('returns wind_flat for flat terrain with moderate wind', () => {
    const state = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeDeg: 1,
      surfaceWindMph: 5,
      surfaceWindDirDeg: 180, // from south
    })
    expect(state.mode).toBe('wind_flat')
    expect(state.modeLabel).toBe('WIND')
    expect(state.thermalDirDeg).toBe(0) // scent travels north
    expect(state.confidence).not.toBe('low')
  })

  it('returns pooling for flat terrain with calm wind', () => {
    const state = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeDeg: 1,
      surfaceWindMph: 1,
    })
    expect(state.mode).toBe('pooling')
    expect(state.modeLabel).toBe('POOLING')
    expect(state.thermalLabel).toBe('ALL')
    expect(state.confidence).toBe('low')
  })

  it('returns wind_flat with high confidence when wind >= 4 mph on flat', () => {
    const state = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeDeg: 2,
      surfaceWindMph: 5,
      surfaceWindDirDeg: 270, // from west
    })
    expect(state.mode).toBe('wind_flat')
    expect(state.confidence).toBe('high')
    expect(state.thermalDirDeg).toBe(90) // scent travels east
  })

  it('blends thermal and wind direction at 4-8 mph on slope', () => {
    const state = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeAspectDeg: 180, // south-facing
      slopeDeg: 15,
      datetime: new Date('2026-06-21T06:00:00Z'), // night — cooling/drainage north (0°)
      surfaceWindMph: 6,
      surfaceWindDirDeg: 270, // from west → scent travels east (90°)
    })
    // Thermal = north (0°), wind travel = east (90°)
    // At 6 mph, wind weight = (6-4)/(8-4) = 0.5
    // Blended should be roughly NE (between N and E)
    expect(state.thermalDirDeg).toBeGreaterThan(20)
    expect(state.thermalDirDeg).toBeLessThan(70)
    expect(state.confidence).toBe('medium')
    expect(state.modeLabel).toContain('WIND')
  })

  it('reduces confidence with moderate wind on slope', () => {
    const calm = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeAspectDeg: 180, slopeDeg: 15,
      datetime: new Date('2026-06-21T06:00:00Z'),
      surfaceWindMph: 1,
    })
    const windy = getThermalState({
      lat: 39.0, lng: -105.0,
      slopeAspectDeg: 180, slopeDeg: 15,
      datetime: new Date('2026-06-21T06:00:00Z'),
      surfaceWindMph: 6,
    })
    const confidenceRank = { high: 3, medium: 2, low: 1 }
    expect(confidenceRank[windy.confidence]).toBeLessThanOrEqual(confidenceRank[calm.confidence])
  })

  it('always returns required fields', () => {
    const state = getThermalState({ lat: 39.0, lng: -105.0 })
    expect(state.mode).toBeDefined()
    expect(state.thermalDirDeg).toBeDefined()
    expect(state.thermalLabel).toBeDefined()
    expect(state.confidence).toBeDefined()
    expect(state.modeLabel).toBeDefined()
    expect(state.description).toBeTruthy()
    expect(typeof state.solarAltitudeDeg).toBe('number')
    expect(typeof state.solarAzimuthDeg).toBe('number')
    expect(typeof state.insolation).toBe('number')
  })
})

// ─── getScentCone ─────────────────────────────────────────────────────────────

describe('getScentCone', () => {
  it('returns valid GeoJSON Feature', () => {
    const cone = getScentCone(39.0, -105.0, 90, 300)
    expect(cone.type).toBe('Feature')
    expect(cone.geometry.type).toBe('Polygon')
    expect(cone.geometry.coordinates).toHaveLength(1)
    expect(cone.geometry.coordinates[0].length).toBeGreaterThan(3)
  })

  it('starts and ends at the pin location', () => {
    const cone = getScentCone(39.0, -105.0, 90, 300)
    const coords = cone.geometry.coordinates[0]
    // First and last point should be at pin
    expect(coords[0]).toEqual([-105.0, 39.0])
    expect(coords[coords.length - 1]).toEqual([-105.0, 39.0])
  })

  it('extends in the thermal direction', () => {
    // Thermal going east (90°)
    const cone = getScentCone(39.0, -105.0, 90, 300)
    const coords = cone.geometry.coordinates[0]
    // Middle points should be east of origin (higher lng)
    const midIdx = Math.floor(coords.length / 2)
    expect(coords[midIdx][0]).toBeGreaterThan(-105.0) // lng increased = east
  })

  it('stores properties', () => {
    const cone = getScentCone(39.0, -105.0, 90, 300)
    expect(cone.properties.thermalDirDeg).toBe(90)
    expect(cone.properties.rangeYards).toBe(300)
  })
})

// ─── getScentConeBands ────────────────────────────────────────────────────────

describe('getScentConeBands', () => {
  it('returns exactly 3 bands', () => {
    const bands = getScentConeBands(39.0, -105.0, 90, 300)
    expect(bands).toHaveLength(3)
  })

  it('bands have decreasing opacity from outer to inner', () => {
    const bands = getScentConeBands(39.0, -105.0, 90, 300)
    // Bands ordered outer→inner: 0.18, 0.28, 0.40
    expect(bands[0].opacity).toBeLessThan(bands[1].opacity)
    expect(bands[1].opacity).toBeLessThan(bands[2].opacity)
  })

  it('returns coordinates in [lat, lng] format for Leaflet', () => {
    const bands = getScentConeBands(39.0, -105.0, 90, 300)
    const first = bands[0].coordinates[0]
    // First point should be near the pin: lat ~39, lng ~-105
    expect(first[0]).toBeCloseTo(39.0, 1) // lat
    expect(first[1]).toBeCloseTo(-105.0, 1) // lng
  })

  it('accepts custom spreadDeg parameter', () => {
    const wide = getScentConeBands(39.0, -105.0, 90, 300, 55)
    const narrow = getScentConeBands(39.0, -105.0, 90, 300, 25)
    // Narrow cone should have less lateral extent
    const wideCoords = wide[0].coordinates
    const narrowCoords = narrow[0].coordinates
    // Compare max lat deviation from center (lateral spread)
    const wideLats = wideCoords.map(c => Math.abs(c[0] - 39.0))
    const narrowLats = narrowCoords.map(c => Math.abs(c[0] - 39.0))
    expect(Math.max(...narrowLats)).toBeLessThan(Math.max(...wideLats))
  })
})

// ─── getScentPoolCircle ──────────────────────────────────────────────────────

describe('getScentPoolCircle', () => {
  it('returns 3 concentric bands', () => {
    const bands = getScentPoolCircle(39.0, -105.0, 100)
    expect(bands).toHaveLength(3)
  })

  it('forms a closed circle (first ~= last coordinate)', () => {
    const bands = getScentPoolCircle(39.0, -105.0, 100)
    const coords = bands[0].coordinates
    expect(coords[0][0]).toBeCloseTo(coords[coords.length - 1][0], 5)
    expect(coords[0][1]).toBeCloseTo(coords[coords.length - 1][1], 5)
  })

  it('bands have increasing opacity from outer to inner', () => {
    const bands = getScentPoolCircle(39.0, -105.0, 100)
    expect(bands[0].opacity).toBeLessThan(bands[1].opacity)
    expect(bands[1].opacity).toBeLessThan(bands[2].opacity)
  })

  it('returns coordinates in [lat, lng] format', () => {
    const bands = getScentPoolCircle(39.0, -105.0, 100)
    const first = bands[0].coordinates[0]
    expect(first[0]).toBeCloseTo(39.0, 2) // lat
    expect(first[1]).toBeCloseTo(-105.0, 2) // lng
  })
})

// ─── getConeParams ───────────────────────────────────────────────────────────

describe('getConeParams', () => {
  it('returns short range and wide spread for calm thermals', () => {
    const { rangeYards, spreadDeg } = getConeParams(1, 'cooling')
    expect(rangeYards).toBe(200)
    expect(spreadDeg).toBe(55)
  })

  it('returns longer range and tighter spread for wind_flat at 6 mph', () => {
    const { rangeYards, spreadDeg } = getConeParams(6, 'wind_flat')
    expect(rangeYards).toBeGreaterThan(200)
    expect(rangeYards).toBeLessThan(500)
    expect(spreadDeg).toBeLessThan(45)
    expect(spreadDeg).toBeGreaterThan(20)
  })

  it('returns long range and narrow spread for strong wind_override', () => {
    const { rangeYards, spreadDeg } = getConeParams(15, 'wind_override')
    expect(rangeYards).toBeGreaterThan(500)
    expect(spreadDeg).toBeLessThanOrEqual(25)
  })

  it('returns moderate params for blended wind+thermal on slope', () => {
    const { rangeYards, spreadDeg } = getConeParams(6, 'heating')
    expect(rangeYards).toBeGreaterThan(200)
    expect(rangeYards).toBeLessThanOrEqual(500)
    expect(spreadDeg).toBeLessThan(55)
    expect(spreadDeg).toBeGreaterThan(25)
  })

  it('returns 360° spread and small radius for pooling', () => {
    const { rangeYards, spreadDeg } = getConeParams(1, 'pooling')
    expect(rangeYards).toBe(100)
    expect(spreadDeg).toBe(360)
  })

  it('range increases with wind speed', () => {
    const light = getConeParams(4, 'wind_flat')
    const moderate = getConeParams(8, 'wind_flat')
    const strong = getConeParams(15, 'wind_flat')
    expect(light.rangeYards).toBeLessThan(moderate.rangeYards)
    expect(moderate.rangeYards).toBeLessThan(strong.rangeYards)
  })

  it('spread decreases with wind speed', () => {
    const light = getConeParams(4, 'wind_flat')
    const strong = getConeParams(15, 'wind_flat')
    expect(light.spreadDeg).toBeGreaterThan(strong.spreadDeg)
  })
})

// ─── isInBlowoutZone ──────────────────────────────────────────────────────────

describe('isInBlowoutZone', () => {
  it('detects target downwind as blown', () => {
    // Stand at origin, thermal going east (90°), target east
    const result = isInBlowoutZone(39.0, -105.0, 39.0, -104.999, 90, 300)
    expect(result.blown).toBe(true)
  })

  it('detects target upwind as safe', () => {
    // Thermal going east, target to the west
    const result = isInBlowoutZone(39.0, -105.0, 39.0, -105.001, 90, 300)
    expect(result.blown).toBe(false)
  })

  it('detects target beyond range as safe', () => {
    // Target very far east
    const result = isInBlowoutZone(39.0, -105.0, 39.0, -104.0, 90, 300)
    expect(result.blown).toBe(false)
    expect(result.reason).toContain('beyond')
  })

  it('includes distance and bearing info', () => {
    const result = isInBlowoutZone(39.0, -105.0, 39.001, -105.0, 0, 300)
    expect(result.distanceYards).toBeGreaterThan(0)
    expect(result.bearing).toBeDefined()
    expect(result.reason).toBeTruthy()
  })
})
