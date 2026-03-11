/**
 * Terrain-based thermal wind prediction for hunting applications.
 *
 * PHYSICS:
 *   Morning/night → air cools, becomes dense, flows DOWNHILL
 *   Day/afternoon → sun heats slopes, air rises UPHILL on heated faces
 *   Transition    → ~30–90 min window when direction reverses (swirling)
 *   Wind override → surface wind > 8 mph overrides thermals entirely
 *
 * All math is deterministic from terrain + time + sun position.
 * No API needed — fully offline capable.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

/** Wind speed above which surface wind fully overrides thermals (mph) */
const WIND_OVERRIDE_MPH = 8

/** Wind speed where thermals begin to be disrupted (mph) */
const WIND_DISRUPTION_MPH = 4

/** Solar altitude below which slope heating is negligible (degrees) */
const MIN_HEATING_SOLAR_ALT = 12

/** Transition duration: minutes the swirl window lasts */
const TRANSITION_MINUTES = 60

/** Wind speed below which scent pools on flat terrain (mph) */
const CALM_WIND_MPH = 3

/** Slope below which terrain is considered flat (degrees) */
const FLAT_SLOPE_DEG = 3

/** Default scent cone spread angle for pure thermals (degrees) */
const CONE_SPREAD_DEG = 55

// ─── Dynamic Cone Parameters ────────────────────────────────────────────────

/**
 * Compute scent cone range (yards) and spread (degrees) based on wind speed.
 *
 * Physics:
 *   - Calm air: scent disperses slowly in all directions → short range, wide spread
 *   - Light wind: carries scent moderately → medium range, medium spread
 *   - Strong wind: creates a tight, long plume → long range, narrow spread
 *
 * Pure thermals (no wind) use wider spreads since thermal drafts are less focused.
 */
export function getConeParams(windMph: number, mode: ThermalMode): { rangeYards: number; spreadDeg: number } {
  // Pooling has its own circle visualization — these values are fallback
  if (mode === 'pooling') return { rangeYards: 100, spreadDeg: 360 }

  // Wind-driven modes: range scales up, spread tightens
  if (mode === 'wind_override' || mode === 'wind_flat') {
    const rangeYards = Math.round(lerp(200, 700, clamp01((windMph - 3) / 12)))
    const spreadDeg = Math.round(lerp(45, 20, clamp01((windMph - 3) / 12)))
    return { rangeYards, spreadDeg }
  }

  // Blended wind+thermal: moderate scaling
  if (windMph >= WIND_DISRUPTION_MPH) {
    const rangeYards = Math.round(lerp(250, 500, clamp01((windMph - 4) / 4)))
    const spreadDeg = Math.round(lerp(50, 30, clamp01((windMph - 4) / 4)))
    return { rangeYards, spreadDeg }
  }

  // Pure thermal (calm): short range, wide spread
  return { rangeYards: 200, spreadDeg: CONE_SPREAD_DEG }
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
function clamp01(v: number): number { return Math.min(1, Math.max(0, v)) }

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThermalMode = 'heating' | 'cooling' | 'transition' | 'wind_override' | 'neutral' | 'wind_flat' | 'pooling'

export type ThermalState = {
  mode: ThermalMode
  thermalDirDeg: number
  thermalLabel: string
  confidence: 'high' | 'medium' | 'low'
  modeLabel: string
  description: string
  solarAltitudeDeg: number
  solarAzimuthDeg: number
  insolation: number
}

export type ThermalParams = {
  lat: number
  lng: number
  slopeAspectDeg?: number
  slopeDeg?: number
  datetime?: Date
  ambientTempF?: number
  cloudCoverPct?: number
  surfaceWindMph?: number
  surfaceWindDirDeg?: number
}

export type ScentConeBand = {
  coordinates: [number, number][] // [lat, lng] pairs for Leaflet
  opacity: number
}

export type GeoJSONCone = {
  type: 'Feature'
  properties: { thermalDirDeg: number; rangeYards: number; spreadDeg: number }
  geometry: { type: 'Polygon'; coordinates: [number, number][][] }
}

// ─── Solar Position ───────────────────────────────────────────────────────────

/**
 * Calculate sun azimuth and altitude for a lat/lng at a given datetime.
 * Algorithm: NOAA Solar Calculator (simplified Spencer/Michalsky)
 */
export function getSolarPosition(lat: number, lng: number, date: Date): {
  azimuthDeg: number
  altitudeDeg: number
} {
  const JD = date.getTime() / 86400000 + 2440587.5
  const n = JD - 2451545.0

  const L = (280.460 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG

  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG
  const epsilon = (23.439 - 0.0000004 * n) * DEG

  const sinDec = Math.sin(epsilon) * Math.sin(lambda)
  const dec = Math.asin(sinDec)

  const GMST = (6.697375 + 0.0657098242 * n +
    (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600)) % 24
  const LMST = (GMST + lng / 15 + 24) % 24
  const RA = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * RAD
  const HA = ((LMST * 15 - (RA + 360) % 360 + 540) % 360 - 180) * DEG

  const latR = lat * DEG

  const sinAlt = Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(HA)
  const altR = Math.asin(Math.max(-1, Math.min(1, sinAlt)))

  const cosAz = (Math.sin(dec) - Math.sin(latR) * Math.sin(altR)) / (Math.cos(latR) * Math.cos(altR))
  const azR = Math.acos(Math.max(-1, Math.min(1, cosAz)))
  const az = Math.sin(HA) > 0 ? 360 - azR * RAD : azR * RAD

  return { azimuthDeg: az, altitudeDeg: altR * RAD }
}

// ─── Slope Heating ────────────────────────────────────────────────────────────

/**
 * Estimate solar energy hitting a slope face — 0 (none) to 1 (direct).
 */
export function getSlopeInsolation(
  slopeAspectDeg: number,
  slopeDeg: number,
  solarAzimuthDeg: number,
  solarAltitudeDeg: number,
): number {
  if (solarAltitudeDeg < 0) return 0

  const slopeR = slopeDeg * DEG
  const aspectR = slopeAspectDeg * DEG
  const azR = solarAzimuthDeg * DEG
  const altR = solarAltitudeDeg * DEG

  const cosI =
    Math.cos(altR) * Math.sin(slopeR) * Math.cos(azR - aspectR) +
    Math.sin(altR) * Math.cos(slopeR)

  return Math.max(0, cosI)
}

// ─── Drainage / Uphill Direction ──────────────────────────────────────────────

function getDownhillDirection(slopeAspectDeg: number): number {
  return (slopeAspectDeg + 180) % 360
}

function getUphillDirection(slopeAspectDeg: number): number {
  return slopeAspectDeg
}

// ─── Wind/Thermal Blending ───────────────────────────────────────────────────

/**
 * Blend thermal and wind directions weighted by wind strength.
 * At WIND_DISRUPTION_MPH (4), thermal dominates (~100%).
 * At WIND_OVERRIDE_MPH (8), wind fully dominates.
 * Uses circular weighted average via vector decomposition.
 */
function blendDirections(
  thermalDirDeg: number,
  windFromDirDeg: number,
  windMph: number,
): number {
  const windTravelDeg = (windFromDirDeg + 180) % 360

  // Weight: 0 at WIND_DISRUPTION_MPH, 1 at WIND_OVERRIDE_MPH
  const windWeight = Math.min(1, Math.max(0,
    (windMph - WIND_DISRUPTION_MPH) / (WIND_OVERRIDE_MPH - WIND_DISRUPTION_MPH),
  ))

  const thermalRad = thermalDirDeg * DEG
  const windRad = windTravelDeg * DEG
  const thermalWeight = 1 - windWeight

  const x = thermalWeight * Math.sin(thermalRad) + windWeight * Math.sin(windRad)
  const y = thermalWeight * Math.cos(thermalRad) + windWeight * Math.cos(windRad)

  return ((Math.atan2(x, y) * RAD) + 360) % 360
}

// ─── Transition Timing ────────────────────────────────────────────────────────

function getTransitionWindows(lat: number, lng: number, date: Date, cloudCoverPct: number) {
  const day = new Date(date)
  day.setUTCHours(0, 0, 0, 0)

  let morningCrossing: number | null = null
  let eveningCrossing: number | null = null

  for (let h = 0; h <= 24; h += 0.25) {
    const t = new Date(day.getTime() + h * 3600000)
    const { altitudeDeg } = getSolarPosition(lat, lng, t)
    if (altitudeDeg >= MIN_HEATING_SOLAR_ALT && morningCrossing === null) {
      morningCrossing = h
    }
    if (altitudeDeg >= MIN_HEATING_SOLAR_ALT) {
      eveningCrossing = h
    }
  }

  const cloudExtension = (cloudCoverPct / 100) * 30
  const halfWindow = (TRANSITION_MINUTES + cloudExtension) / 60 / 2

  return {
    morningStart: (morningCrossing ?? 6) - halfWindow,
    morningEnd: (morningCrossing ?? 6) + halfWindow,
    eveningStart: (eveningCrossing ?? 18) - halfWindow,
    eveningEnd: (eveningCrossing ?? 18) + halfWindow,
  }
}

// ─── Core Thermal State ───────────────────────────────────────────────────────

export function getThermalState(params: ThermalParams): ThermalState {
  const {
    lat,
    lng,
    slopeAspectDeg = 180,
    slopeDeg = 10,
    datetime = new Date(),
    cloudCoverPct = 0,
    surfaceWindMph = 0,
    surfaceWindDirDeg = 0,
  } = params

  const solar = getSolarPosition(lat, lng, datetime)
  const { azimuthDeg: solarAz, altitudeDeg: solarAlt } = solar

  // ── Step 1: Strong wind override (any terrain)
  if (surfaceWindMph >= WIND_OVERRIDE_MPH) {
    const travelDir = (surfaceWindDirDeg + 180) % 360
    return {
      mode: 'wind_override',
      thermalDirDeg: travelDir,
      thermalLabel: bearingToCardinal(travelDir),
      confidence: 'high',
      modeLabel: 'WIND OVERRIDE',
      description: `Surface wind (${surfaceWindMph} mph ${bearingToCardinal(surfaceWindDirDeg)}) is overriding terrain thermals. Scent carries ${bearingToCardinal(travelDir)}.`,
      solarAltitudeDeg: solarAlt,
      solarAzimuthDeg: solarAz,
      insolation: 0,
    }
  }

  // ── Step 2: Flat terrain — wind dominates or scent pools
  if (slopeDeg < FLAT_SLOPE_DEG) {
    if (surfaceWindMph >= CALM_WIND_MPH) {
      const travelDir = (surfaceWindDirDeg + 180) % 360
      return {
        mode: 'wind_flat',
        thermalDirDeg: travelDir,
        thermalLabel: bearingToCardinal(travelDir),
        confidence: surfaceWindMph >= WIND_DISRUPTION_MPH ? 'high' : 'medium',
        modeLabel: 'WIND',
        description: `Flat terrain — wind (${surfaceWindMph} mph ${bearingToCardinal(surfaceWindDirDeg)}) is the primary scent factor. Scent carries ${bearingToCardinal(travelDir)}.`,
        solarAltitudeDeg: solarAlt,
        solarAzimuthDeg: solarAz,
        insolation: 0,
      }
    }
    return {
      mode: 'pooling',
      thermalDirDeg: 0,
      thermalLabel: 'ALL',
      confidence: 'low',
      modeLabel: 'POOLING',
      description: `Flat terrain with calm air (${surfaceWindMph} mph). Scent is pooling in all directions. Avoid lingering — move through quickly or gain elevation.`,
      solarAltitudeDeg: solarAlt,
      solarAzimuthDeg: solarAz,
      insolation: 0,
    }
  }

  // ── Step 3: Transition window (slopes only — flat already handled)
  const dayH = datetime.getUTCHours() + datetime.getUTCMinutes() / 60
  const windows = getTransitionWindows(lat, lng, datetime, cloudCoverPct)
  const inMorningTransition = dayH >= windows.morningStart && dayH <= windows.morningEnd
  const inEveningTransition = dayH >= windows.eveningStart && dayH <= windows.eveningEnd

  if (inMorningTransition || inEveningTransition) {
    // Moderate wind during transition: wind dominates swirling thermals
    if (surfaceWindMph >= WIND_DISRUPTION_MPH) {
      const travelDir = (surfaceWindDirDeg + 180) % 360
      return {
        mode: 'wind_override',
        thermalDirDeg: travelDir,
        thermalLabel: bearingToCardinal(travelDir),
        confidence: 'medium',
        modeLabel: 'WIND (TRANSITION)',
        description: `Thermals are transitioning but wind (${surfaceWindMph} mph) is dominant on this slope. Scent carries ${bearingToCardinal(travelDir)}. Direction may shift as thermals stabilize.`,
        solarAltitudeDeg: solarAlt,
        solarAzimuthDeg: solarAz,
        insolation: 0,
      }
    }
    // Light/no wind during transition: classic unpredictable swirl
    const which = inMorningTransition ? 'morning' : 'evening'
    const guessDir = inMorningTransition
      ? getDownhillDirection(slopeAspectDeg)
      : getUphillDirection(slopeAspectDeg)
    const minsLeft = Math.round(
      ((inMorningTransition ? windows.morningEnd : windows.eveningEnd) - dayH) * 60,
    )
    return {
      mode: 'transition',
      thermalDirDeg: guessDir,
      thermalLabel: bearingToCardinal(guessDir),
      confidence: 'low',
      modeLabel: 'TRANSITION',
      description: `Thermals are reversing (${which} transition). Scent direction is unreliable for ~${minsLeft} minutes. Stay put or move carefully.`,
      solarAltitudeDeg: solarAlt,
      solarAzimuthDeg: solarAz,
      insolation: 0,
    }
  }

  // ── Step 4: Slope heating calculation
  const insolation = getSlopeInsolation(slopeAspectDeg, slopeDeg, solarAz, solarAlt)
  const effectiveInsolation = insolation * (1 - cloudCoverPct / 100)
  const isHeating = effectiveInsolation > 0.25 && solarAlt > MIN_HEATING_SOLAR_ALT

  const baseThermalDir = isHeating
    ? getUphillDirection(slopeAspectDeg)
    : getDownhillDirection(slopeAspectDeg)

  // ── Step 5: Wind/thermal blending (4-8 mph on slopes)
  if (surfaceWindMph >= WIND_DISRUPTION_MPH) {
    const blendedDir = blendDirections(baseThermalDir, surfaceWindDirDeg, surfaceWindMph)
    const windTravelDir = (surfaceWindDirDeg + 180) % 360
    return {
      mode: isHeating ? 'heating' : 'cooling',
      thermalDirDeg: blendedDir,
      thermalLabel: bearingToCardinal(blendedDir),
      confidence: 'medium',
      modeLabel: isHeating ? 'RISING + WIND' : 'DROPPING + WIND',
      description: `${isHeating ? 'Upslope' : 'Downslope'} thermals blending with ${surfaceWindMph} mph wind. Scent carried ${bearingToCardinal(blendedDir)} (between thermal ${bearingToCardinal(baseThermalDir)} and wind ${bearingToCardinal(windTravelDir)}).`,
      solarAltitudeDeg: solarAlt,
      solarAzimuthDeg: solarAz,
      insolation: effectiveInsolation,
    }
  }

  // ── Step 6: Pure thermal (calm wind on slopes)
  const confidence: 'high' | 'medium' = insolation > 0.6 || solarAlt < -5
    ? 'high' : 'medium'

  if (isHeating) {
    const dir = getUphillDirection(slopeAspectDeg)
    return {
      mode: 'heating',
      thermalDirDeg: dir,
      thermalLabel: bearingToCardinal(dir),
      confidence,
      modeLabel: 'RISING',
      description: `Sun heating this ${bearingToCardinal(slopeAspectDeg)}-facing slope (${Math.round(effectiveInsolation * 100)}% insolation). Thermals rising ${bearingToCardinal(dir)}. Scent carried uphill.`,
      solarAltitudeDeg: solarAlt,
      solarAzimuthDeg: solarAz,
      insolation: effectiveInsolation,
    }
  } else {
    const dir = getDownhillDirection(slopeAspectDeg)
    const reason = solarAlt < 0
      ? 'Sun is below the horizon'
      : `This ${bearingToCardinal(slopeAspectDeg)}-facing slope is not receiving direct sun`
    return {
      mode: 'cooling',
      thermalDirDeg: dir,
      thermalLabel: bearingToCardinal(dir),
      confidence,
      modeLabel: 'DROPPING',
      description: `${reason}. Cold air draining downhill ${bearingToCardinal(dir)}. Scent carried downhill.`,
      solarAltitudeDeg: solarAlt,
      solarAzimuthDeg: solarAz,
      insolation: effectiveInsolation,
    }
  }
}

// ─── Scent Cone ───────────────────────────────────────────────────────────────

/**
 * Generate a GeoJSON polygon representing the scent cone.
 * Coordinates are [lng, lat] per GeoJSON spec.
 */
export function getScentCone(
  lat: number,
  lng: number,
  thermalDirDeg: number,
  rangeYards = 300,
  spreadDeg = CONE_SPREAD_DEG,
): GeoJSONCone {
  const rangeM = rangeYards * 0.9144
  const halfSpread = spreadDeg / 2
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * Math.cos(lat * DEG)

  const points: [number, number][] = [[lng, lat]]
  const steps = 24

  for (let i = 0; i <= steps; i++) {
    const angleDeg = thermalDirDeg - halfSpread + (spreadDeg * i) / steps
    const angleRad = angleDeg * DEG
    const dLat = (rangeM * Math.cos(angleRad)) / mPerDegLat
    const dLng = (rangeM * Math.sin(angleRad)) / mPerDegLng
    points.push([lng + dLng, lat + dLat])
  }

  points.push([lng, lat])

  return {
    type: 'Feature',
    properties: { thermalDirDeg, rangeYards, spreadDeg },
    geometry: { type: 'Polygon', coordinates: [points] },
  }
}

/**
 * Generate 3 concentric cone bands for gradient visualization.
 * Returns [lat, lng] pairs for direct Leaflet L.polygon use.
 */
export function getScentConeBands(
  lat: number,
  lng: number,
  thermalDirDeg: number,
  rangeYards = 300,
  spreadDeg = CONE_SPREAD_DEG,
): ScentConeBand[] {
  const bands: Array<{ range: number; spread: number; opacity: number }> = [
    { range: rangeYards, spread: spreadDeg, opacity: 0.18 },
    { range: rangeYards * 0.66, spread: spreadDeg * 0.8, opacity: 0.28 },
    { range: rangeYards * 0.33, spread: spreadDeg * 0.6, opacity: 0.40 },
  ]

  return bands.map(({ range, spread, opacity }) => {
    const cone = getScentCone(lat, lng, thermalDirDeg, range, spread)
    // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
    const coordinates = cone.geometry.coordinates[0].map(
      ([cLng, cLat]) => [cLat, cLng] as [number, number],
    )
    return { coordinates, opacity }
  })
}

/**
 * Generate concentric circles for pooling scent visualization (flat terrain, calm wind).
 * Returns [lat, lng] pairs for direct Leaflet L.polygon use.
 */
export function getScentPoolCircle(
  lat: number,
  lng: number,
  radiusYards = 100,
): ScentConeBand[] {
  const radiusM = radiusYards * 0.9144
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * Math.cos(lat * DEG)
  const steps = 36

  const bandDefs: Array<{ ratio: number; opacity: number }> = [
    { ratio: 1.0, opacity: 0.12 },
    { ratio: 0.66, opacity: 0.22 },
    { ratio: 0.33, opacity: 0.35 },
  ]

  return bandDefs.map(({ ratio, opacity }) => {
    const r = radiusM * ratio
    const coordinates: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
      const angle = (360 * i / steps) * DEG
      const dLat = (r * Math.cos(angle)) / mPerDegLat
      const dLng = (r * Math.sin(angle)) / mPerDegLng
      coordinates.push([lat + dLat, lng + dLng])
    }
    return { coordinates, opacity }
  })
}

// ─── Blowout Detection ───────────────────────────────────────────────────────

export function isInBlowoutZone(
  standLat: number,
  standLng: number,
  targetLat: number,
  targetLng: number,
  thermalDirDeg: number,
  rangeYards = 300,
  spreadDeg = CONE_SPREAD_DEG,
): { blown: boolean; bearing: number; distanceYards: number; reason: string } {
  const bearing = getBearing(standLat, standLng, targetLat, targetLng)
  const distM = getDistanceM(standLat, standLng, targetLat, targetLng)
  const distYards = distM / 0.9144

  if (distYards > rangeYards) {
    return {
      blown: false,
      bearing,
      distanceYards: distYards,
      reason: `${Math.round(distYards)} yds — beyond scent carry range`,
    }
  }

  const angleDiff = Math.abs(angleDelta(bearing, thermalDirDeg))
  const halfSpread = spreadDeg / 2

  if (angleDiff <= halfSpread) {
    return {
      blown: true,
      bearing,
      distanceYards: distYards,
      reason: `${Math.round(distYards)} yds ${bearingToCardinal(bearing)} — inside scent cone (${Math.round(angleDiff)}° off center)`,
    }
  }

  return {
    blown: false,
    bearing,
    distanceYards: distYards,
    reason: `${Math.round(distYards)} yds ${bearingToCardinal(bearing)} — outside scent cone`,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMPASS_MAP: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
}

/** Convert compass string ("N", "NE", etc.) to degrees. */
export function compassToDegrees(compass: string): number {
  return COMPASS_MAP[compass.toUpperCase()] ?? 0
}

/** Convert bearing degrees to cardinal direction string. */
export function bearingToCardinal(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

/** Bearing from point A to point B (degrees, 0=N, clockwise). */
export function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * DEG
  const lat1R = lat1 * DEG
  const lat2R = lat2 * DEG
  const y = Math.sin(dLng) * Math.cos(lat2R)
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng)
  return ((Math.atan2(y, x) * RAD) + 360) % 360
}

/** Distance between two lat/lng points in meters. */
export function getDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * DEG
  const dLng = (lng2 - lng1) * DEG
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Smallest signed angle between two bearings (-180 to +180). */
function angleDelta(a: number, b: number): number {
  return ((b - a) % 360 + 540) % 360 - 180
}
