// SVG icon paths for each field map pin type
// Each is a 16x16 viewBox path drawn in white, rendered inside a colored pin marker

const ICON_PATHS: Record<string, string> = {
  // ─── Sightings ──────────────────────────────────────────────────────────
  // Buck — antlered deer head
  buck: `<path d="M4 6c0-2 1-4 1-4s1 2 2 2V3c0-1 1-3 1-3s1 2 1 3v1c1 0 2-2 2-2s1 2 1 4c0 1-.5 2-1 2.5V11c0 1.5-1.5 3-3 3s-3-1.5-3-3V8.5C4.5 8 4 7 4 6z" fill="white"/>`,
  // Doe — deer head without antlers
  doe: `<path d="M5 4c0-1 .5-2.5 1-3 .5 1 1 2 1.5 2h1c.5 0 1-1 1.5-2 .5.5 1 2 1 3 0 1.5-1 2.5-1.5 3v3.5c0 1.5-1 2.5-2.5 2.5s-2.5-1-2.5-2.5V7C5.5 6.5 5 5.5 5 4z" fill="white"/>`,
  // Bull Elk — large antlers
  bull_elk: `<path d="M3 5c0-2 .5-3.5 1-4 0 1 .5 1.5 1 2l1-2 .5 2h1l.5-2 1 2c.5-.5 1-1 1-2 .5.5 1 2 1 4 0 1-.5 2-1 2.5V11c0 1-1 2.5-2.5 2.5S5 12 5 11V7.5C4 7 3 6 3 5z" fill="white"/>`,
  // Cow Elk — elk without antlers
  cow_elk: `<path d="M5 3.5C5.2 2 6 1 6.5 1c.3 0 .8.5 1 1h1c.2-.5.7-1 1-1 .5 0 1.3 1 1.5 2.5.1 1-.5 2-1 2.5V10c0 1.5-1.2 3-2.5 3S5 11.5 5 10V6C4.5 5.5 4.9 4.5 5 3.5z" fill="white"/>`,
  // Turkey — turkey profile
  turkey: `<path d="M6 3c0-.5.5-1.5 1-2 .5 1 1 2 2 2.5V5c1 0 2 .5 2 1.5 0 1.5-1.5 2.5-3 3v2l1 1.5H7.5L6.5 12v-2c-1-.5-2-1.5-2-3C4.5 5 5 4 6 3z" fill="white"/>`,
  // Bear — bear paw print
  bear: `<path d="M4.5 9a2 2 0 1 1 7 0c0 1.5-1.5 3.5-3.5 3.5S4.5 10.5 4.5 9zM4 5.5a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 0 1-2.4 0zM6.8 4.5a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 0 1-2.4 0zM9.5 5.5a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 0 1-2.4 0z" fill="white"/>`,
  // Other Animal — eye/binoculars
  other_animal: `<circle cx="5.5" cy="8" r="2.5" fill="none" stroke="white" stroke-width="1.5"/><circle cx="10.5" cy="8" r="2.5" fill="none" stroke="white" stroke-width="1.5"/><path d="M8 8h0" stroke="white" stroke-width="1.5"/>`,

  // ─── Sign ───────────────────────────────────────────────────────────────
  // Scrape — scratch marks on ground
  scrape: `<path d="M4 5l3 6M6 4l3 7M8 5l3 6" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
  // Rub — tree with rub marks
  rub: `<path d="M8 2v10M6 12h4" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M5.5 5l1.5 1M5.5 7l1.5 1M10.5 4l-1.5 1M10.5 6l-1.5 1" stroke="white" stroke-width="1.2" stroke-linecap="round" fill="none"/>`,
  // Tracks — hoof print
  tracks: `<ellipse cx="6.5" cy="6" rx="1.5" ry="2.5" transform="rotate(-15 6.5 6)" fill="white"/><ellipse cx="9.5" cy="6" rx="1.5" ry="2.5" transform="rotate(15 9.5 6)" fill="white"/><circle cx="6" cy="10.5" r="1" fill="white"/><circle cx="10" cy="10.5" r="1" fill="white"/>`,
  // Scat — droppings
  scat: `<ellipse cx="8" cy="10" rx="2" ry="1.2" fill="white"/><ellipse cx="7" cy="7.5" rx="1.5" ry="1" fill="white"/><ellipse cx="9" cy="5.5" rx="1.2" ry="1" fill="white"/>`,
  // Bedding — oval bed impression
  bedding: `<ellipse cx="8" cy="8.5" rx="4" ry="2.8" fill="none" stroke="white" stroke-width="1.3" stroke-dasharray="2 1.5"/><path d="M6 7c1-2 3-2 4 0" stroke="white" stroke-width="1" fill="none"/>`,
  // Shed Antler — single antler
  shed: `<path d="M5 12c0-3 2-6 3-8 .5 1 1.5 1.5 2 1M7 7c.5.5 1.5 1 2 .5M6.5 9c.5.5 1.5.5 2 0" stroke="white" stroke-width="1.3" stroke-linecap="round" fill="none"/>`,

  // ─── Infrastructure ─────────────────────────────────────────────────────
  // Trail Camera — camera icon
  trail_cam: `<rect x="3.5" y="5" width="9" height="6.5" rx="1" fill="none" stroke="white" stroke-width="1.3"/><circle cx="8" cy="8.2" r="2" fill="none" stroke="white" stroke-width="1.2"/><rect x="5" y="3.5" width="3" height="2" rx=".5" fill="white" opacity=".7"/>`,
  // Stand / Blind — elevated platform
  stand: `<path d="M8 3v5M5 8h6M5 8l-1 5M11 8l1 5M6.5 5h3" stroke="white" stroke-width="1.3" stroke-linecap="round" fill="none"/><rect x="5.5" y="2" width="5" height="3" rx=".5" fill="none" stroke="white" stroke-width="1"/>`,
  // Food Plot — plant/seedling
  food_plot: `<path d="M8 13V7" stroke="white" stroke-width="1.3" stroke-linecap="round"/><path d="M8 7c-2-1-3-3-2-5 2 0 3 2 3 4" fill="white" opacity=".9"/><path d="M8 9c2-1 4-1 4 1-1 1-3 1-4-1z" fill="white" opacity=".7"/>`,
  // Feeder — hanging feeder
  feeder: `<path d="M8 2v3" stroke="white" stroke-width="1.3" stroke-linecap="round"/><path d="M5 5h6l1 4H4z" fill="white" opacity=".85"/><path d="M4.5 9h7l.5 1h-8z" fill="white"/><path d="M7.5 10v2M8.5 10v2" stroke="white" stroke-width="1" stroke-linecap="round"/>`,

  // ─── Terrain ────────────────────────────────────────────────────────────
  // Water — water droplet
  water: `<path d="M8 2C6 5.5 4 7.5 4 9.5a4 4 0 0 0 8 0C12 7.5 10 5.5 8 2z" fill="white" opacity=".9"/>`,
  // Crossing — X marks crossing
  crossing: `<path d="M4 4l8 8M12 4l-8 8" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  // Pinch Point — funnel/hourglass
  pinch_point: `<path d="M4 3h8L8.5 7.5v1L12 13H4l3.5-4.5v-1z" fill="none" stroke="white" stroke-width="1.3" stroke-linejoin="round"/>`,
  // Glassing Point — binoculars/eye
  glassing: `<circle cx="6" cy="8" r="2.5" fill="none" stroke="white" stroke-width="1.3"/><circle cx="10" cy="8" r="2.5" fill="none" stroke="white" stroke-width="1.3"/><path d="M8.5 8h-1" stroke="white" stroke-width="1.5"/><path d="M3 6.5l.5-.5M13 6.5l-.5-.5" stroke="white" stroke-width="1" stroke-linecap="round"/>`,
  // Access / Gate — gate icon
  access: `<path d="M4 4v8M12 4v8M4 6h8M4 10h8" stroke="white" stroke-width="1.3" stroke-linecap="round"/><path d="M7 6v4" stroke="white" stroke-width="1" stroke-dasharray="1 1"/>`,
  // Parking — P symbol
  parking: `<path d="M6 12V4h2.5a2.5 2.5 0 0 1 0 5H6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // Camp — tent
  camp: `<path d="M2 12l6-9 6 9H2z" fill="none" stroke="white" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 12l1.5-4 1.5 4" fill="none" stroke="white" stroke-width="1"/>`,

  // ─── Custom ─────────────────────────────────────────────────────────────
  // Note — pencil/note
  note: `<rect x="4" y="3" width="8" height="10" rx="1" fill="none" stroke="white" stroke-width="1.2"/><path d="M6 6h4M6 8h4M6 10h2" stroke="white" stroke-width="1" stroke-linecap="round"/>`,
}

/**
 * Build a complete pin marker SVG string.
 * Returns a teardrop-shaped pin with the icon inside.
 */
export function buildPinSVG(pinType: string, color: string, size = 32): string {
  const iconSvg = ICON_PATHS[pinType] ?? ICON_PATHS.note
  // Teardrop pin shape with icon centered in the circle portion
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.35)}" viewBox="0 0 32 43">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.4"/>
      </filter>
    </defs>
    <path d="M16 0C8 0 2 6 2 13.5c0 10 14 28 14 28s14-18 14-28C30 6 24 0 16 0z"
          fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1" filter="url(#s)"/>
    <circle cx="16" cy="13.5" r="10" fill="rgba(0,0,0,0.2)"/>
    <g transform="translate(8,5.5)">${iconSvg}</g>
  </svg>`
}

/**
 * Build a selected (highlighted) pin marker SVG.
 */
export function buildSelectedPinSVG(pinType: string, color: string, size = 38): string {
  const iconSvg = ICON_PATHS[pinType] ?? ICON_PATHS.note
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.35)}" viewBox="0 0 32 43">
    <defs>
      <filter id="gs" x="-30%" y="-15%" width="160%" height="150%">
        <feDropShadow dx="0" dy="1" stdDeviation="2.5" flood-opacity="0.5"/>
      </filter>
    </defs>
    <path d="M16 0C8 0 2 6 2 13.5c0 10 14 28 14 28s14-18 14-28C30 6 24 0 16 0z"
          fill="${color}" stroke="#f0ece4" stroke-width="2" filter="url(#gs)"/>
    <circle cx="16" cy="13.5" r="10" fill="rgba(0,0,0,0.2)"/>
    <g transform="translate(8,5.5)">${iconSvg}</g>
  </svg>`
}
