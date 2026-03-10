import { PIN_TYPES, PIN_GROUPS } from './pin-types'

/**
 * Generates the HTML content for the Leaflet quick-pin popup.
 * Each pin type is a button with `data-pin-type` attribute for event delegation.
 */
export function buildQuickPinHTML(): string {
  const groups = PIN_GROUPS.map(group => {
    const items = PIN_TYPES.filter(p => p.group === group)
    if (items.length === 0) return ''

    const buttons = items.map(pin =>
      `<button data-pin-type="${pin.value}" style="
        display:inline-flex;align-items:center;gap:5px;
        padding:3px 8px;border-radius:4px;border:1px solid rgba(200,190,170,0.18);
        background:rgba(30,30,26,0.8);color:#f0ece4;font-size:11px;
        cursor:pointer;white-space:nowrap;transition:border-color 0.15s;
      " onmouseover="this.style.borderColor='#7c9a6e'"
        onmouseout="this.style.borderColor='rgba(200,190,170,0.18)'">
        <span style="width:8px;height:8px;border-radius:50%;background:${pin.color};flex-shrink:0;"></span>
        ${pin.label}
      </button>`
    ).join('')

    return `
      <div style="margin-bottom:6px;">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#a09880;margin-bottom:4px;">${group}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${buttons}</div>
      </div>
    `
  }).join('')

  return `<div style="min-width:240px;max-width:300px;">${groups}</div>`
}
