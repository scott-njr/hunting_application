import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

// ─── Mock state (vi.hoisted runs before vi.mock) ──────────────────────────

const mocks = vi.hoisted(() => {
  const state = {
    mapCalls: 0,
    tileLayerCalls: [] as Array<[string, Record<string, unknown>]>,
    markerCalls: [] as Array<[number[], { icon: unknown }]>,
    divIconCalls: [] as Array<Record<string, unknown>>,
    onHandlers: {} as Record<string, Function>,
    removeCalled: false,
    invalidateSizeCalled: false,
    layerGroupAddToCalled: false,
    addLayerCount: 0,
    clearLayersCalled: false,
    bindTooltipCalls: [] as Array<[string, unknown]>,
    popupCalls: [] as Array<Record<string, unknown>>,
    popupSetLatLng: null as [number, number] | null,
    popupContent: null as string | null,
    popupOpened: false,
    popupOnHandlers: {} as Record<string, Function>,
    popupElement: null as HTMLElement | null,
    popupClosed: false,
  }

  function reset() {
    state.mapCalls = 0
    state.tileLayerCalls = []
    state.markerCalls = []
    state.divIconCalls = []
    state.onHandlers = {}
    state.removeCalled = false
    state.invalidateSizeCalled = false
    state.layerGroupAddToCalled = false
    state.addLayerCount = 0
    state.clearLayersCalled = false
    state.bindTooltipCalls = []
    state.popupCalls = []
    state.popupSetLatLng = null
    state.popupContent = null
    state.popupOpened = false
    state.popupOnHandlers = {}
    state.popupElement = null
    state.popupClosed = false
  }

  return { state, reset }
})

vi.mock('leaflet/dist/leaflet.css', () => ({}))

vi.mock('leaflet', () => {
  const mockMap = {
    setView() { return mockMap },
    on(event: string, handler: Function) {
      mocks.state.onHandlers[event] = handler
      return mockMap
    },
    remove() { mocks.state.removeCalled = true },
    invalidateSize() { mocks.state.invalidateSizeCalled = true },
    removeLayer() {},
    closePopup() { mocks.state.popupClosed = true },
    getContainer() { return document.createElement('div') },
    containerPointToLatLng() { return { lat: 39, lng: -105.5 } },
    doubleClickZoom: { disable() {} },
    createPane() {
      const el = document.createElement('div')
      el.style.zIndex = '450'
      return el
    },
  }

  const L = {
    map(_container: HTMLElement, _opts?: unknown) {
      mocks.state.mapCalls++
      return mockMap
    },
    tileLayer(url: string, opts: Record<string, unknown>) {
      mocks.state.tileLayerCalls.push([url, opts])
      const tl = { addTo() { return tl }, bringToFront() {} }
      return tl
    },
    layerGroup(_layers?: unknown, _opts?: unknown) {
      const lg = {
        addTo() {
          mocks.state.layerGroupAddToCalled = true
          return lg
        },
        clearLayers() { mocks.state.clearLayersCalled = true },
        addLayer() { mocks.state.addLayerCount++ },
        eachLayer() {},
      }
      return lg
    },
    polygon(_latlngs: unknown, _opts?: unknown) {
      return { addTo() {} }
    },
    divIcon(opts: Record<string, unknown>) {
      mocks.state.divIconCalls.push(opts)
      return opts
    },
    marker(latlng: number[], opts: { icon: unknown }) {
      mocks.state.markerCalls.push([latlng, opts])
      const m = {
        bindTooltip(text: string, tooltipOpts: unknown) {
          mocks.state.bindTooltipCalls.push([text, tooltipOpts])
          return m
        },
        on() { return m },
      }
      return m
    },
    popup(opts?: Record<string, unknown>) {
      mocks.state.popupCalls.push(opts ?? {})
      // Create a real DOM element attached to the document so events bubble
      const el = document.createElement('div')
      document.body.appendChild(el)
      mocks.state.popupElement = el
      const p = {
        setLatLng(latlng: [number, number]) {
          mocks.state.popupSetLatLng = latlng
          return p
        },
        setContent(html: string) {
          mocks.state.popupContent = html
          el.innerHTML = html
          return p
        },
        openOn() {
          mocks.state.popupOpened = true
          // Immediately trigger 'add' handlers
          if (mocks.state.popupOnHandlers['add']) {
            mocks.state.popupOnHandlers['add']()
          }
          return p
        },
        on(event: string, handler: Function) {
          mocks.state.popupOnHandlers[event] = handler
          return p
        },
        getElement() { return el },
        close() { mocks.state.popupClosed = true },
      }
      return p
    },
    point(x: number, y: number) { return { x, y } },
    DomEvent: {
      stopPropagation() {},
    },
  }

  return { default: L, ...L }
})

vi.mock('@/lib/field-map/quick-pin-html', () => ({
  buildQuickPinHTML: () => '<div><button data-pin-type="buck">Buck</button><button data-pin-type="scrape">Scrape</button></div>',
}))

vi.mock('@/lib/field-map/pin-icons', () => ({
  buildPinSVG: (pinType: string, color: string, size: number) => `<svg data-pin="${pinType}" data-color="${color}" data-size="${size}"></svg>`,
  buildSelectedPinSVG: (pinType: string, color: string, size: number) => `<svg data-pin="${pinType}" data-color="${color}" data-size="${size}" data-selected></svg>`,
}))

// ─── Import component after mocks ─────────────────────────────────────────

import { FieldMap, type FieldMapPin } from '../field-map'

// ─── Helpers ───────────────────────────────────────────────────────────────

const TEST_PINS: FieldMapPin[] = [
  { id: 'pin-1', pin_type: 'buck', lat: 39.5, lng: -105.2, label: 'Big Buck', color: null },
  { id: 'pin-2', pin_type: 'scrape', lat: 39.6, lng: -105.3, label: null, color: '#8B6914' },
]

function renderMap(overrides: Partial<React.ComponentProps<typeof FieldMap>> = {}) {
  const defaultProps = {
    pins: [] as FieldMapPin[],
    selectedId: null,
    activeLayer: 'topo' as const,
    showLandBoundaries: false,
    thermalCone: null,
    onQuickPin: vi.fn(),
    onPinSelect: vi.fn(),
  }
  return render(<FieldMap {...defaultProps} {...overrides} />)
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('FieldMap', () => {
  beforeEach(() => {
    mocks.reset()
  })

  it('renders the map container div with full dimensions', () => {
    let result: ReturnType<typeof render>
    act(() => { result = renderMap() })
    const inner = result!.container.querySelector('[style]')
    expect(inner).toBeInTheDocument()
    expect(inner?.getAttribute('style')).toContain('height: 100%')
    expect(inner?.getAttribute('style')).toContain('width: 100%')
  })

  it('initialises Leaflet map on mount', () => {
    act(() => { renderMap() })
    expect(mocks.state.mapCalls).toBe(1)
  })

  it('adds USGS topo tile layer by default', () => {
    act(() => { renderMap() })
    const topoCall = mocks.state.tileLayerCalls.find(c => c[0].includes('USGSTopo'))
    expect(topoCall).toBeDefined()
    expect(topoCall![1].maxNativeZoom).toBe(16)
    expect(topoCall![1].maxZoom).toBe(20)
  })

  it('registers mousedown handler for long-press quick-pin', () => {
    act(() => { renderMap() })
    expect(mocks.state.onHandlers['mousedown']).toBeDefined()
  })

  it('opens a quick-pin popup on long-press (500ms)', () => {
    vi.useFakeTimers()
    act(() => { renderMap() })

    const mousedownHandler = mocks.state.onHandlers['mousedown']
    act(() => { mousedownHandler({ latlng: { lat: 39.5, lng: -105.2 } }) })
    act(() => { vi.advanceTimersByTime(500) })

    expect(mocks.state.popupOpened).toBe(true)
    expect(mocks.state.popupSetLatLng).toEqual([39.5, -105.2])
    expect(mocks.state.popupContent).toContain('data-pin-type')
    vi.useRealTimers()
  })

  it('calls onQuickPin when a pin type button is clicked in popup', () => {
    vi.useFakeTimers()
    const onQuickPin = vi.fn()
    act(() => { renderMap({ onQuickPin }) })

    // Trigger long-press to open popup
    const mousedownHandler = mocks.state.onHandlers['mousedown']
    act(() => { mousedownHandler({ latlng: { lat: 39.123456789, lng: -105.987654321 } }) })
    act(() => { vi.advanceTimersByTime(500) })

    // Simulate clicking a pin type button in the popup via event dispatch
    const popupEl = mocks.state.popupElement!
    const buckBtn = popupEl.querySelector('[data-pin-type="buck"]') as HTMLElement
    expect(buckBtn).not.toBeNull()

    // Dispatch a click event that properly bubbles
    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true })
    buckBtn.dispatchEvent(clickEvt)

    expect(onQuickPin).toHaveBeenCalledWith(39.123457, -105.987654, 'buck')
    expect(mocks.state.popupClosed).toBe(true)
    vi.useRealTimers()
  })

  it('creates icon markers for each pin', () => {
    act(() => { renderMap({ pins: TEST_PINS }) })
    expect(mocks.state.markerCalls.length).toBe(2)
    expect(mocks.state.divIconCalls.length).toBe(2)
    expect(mocks.state.addLayerCount).toBe(2)
  })

  it('uses divIcon with pin-type SVG for markers', () => {
    act(() => { renderMap({ pins: TEST_PINS }) })

    // Check divIcon html contains pin type info
    const buckIcon = mocks.state.divIconCalls.find(c =>
      (c.html as string).includes('data-pin="buck"')
    )
    expect(buckIcon).toBeDefined()
    expect(buckIcon!.className).toBe('journal-pin-icon')
  })

  it('applies selected style (larger icon) to the selected pin', () => {
    act(() => { renderMap({ pins: TEST_PINS, selectedId: 'pin-1' }) })

    // Selected pin should use buildSelectedPinSVG (has data-selected attr)
    const selectedIcon = mocks.state.divIconCalls.find(c =>
      (c.html as string).includes('data-selected')
    )
    const normalIcon = mocks.state.divIconCalls.find(c =>
      !(c.html as string).includes('data-selected')
    )

    expect(selectedIcon).toBeDefined()
    expect(normalIcon).toBeDefined()
    // Selected is larger (38px vs 32px)
    expect((selectedIcon!.iconSize as number[])[0]).toBe(38)
    expect((normalIcon!.iconSize as number[])[0]).toBe(32)
  })

  it('binds tooltip only for pins with labels', () => {
    act(() => { renderMap({ pins: TEST_PINS }) })
    expect(mocks.state.bindTooltipCalls.length).toBe(1)
    expect(mocks.state.bindTooltipCalls[0][0]).toBe('Big Buck')
  })

  it('cleans up map on unmount', () => {
    let result: ReturnType<typeof render>
    act(() => { result = renderMap() })
    act(() => { result.unmount() })
    expect(mocks.state.removeCalled).toBe(true)
  })

  it('creates a marker layer group and adds to map', () => {
    act(() => { renderMap() })
    expect(mocks.state.layerGroupAddToCalled).toBe(true)
  })

  it('clears markers before re-rendering pins', () => {
    act(() => { renderMap({ pins: TEST_PINS }) })
    expect(mocks.state.clearLayersCalled).toBe(true)
  })

  it('popup has dark tactical styling class', () => {
    vi.useFakeTimers()
    act(() => { renderMap() })

    const mousedownHandler = mocks.state.onHandlers['mousedown']
    act(() => { mousedownHandler({ latlng: { lat: 39.5, lng: -105.2 } }) })
    act(() => { vi.advanceTimersByTime(500) })

    expect(mocks.state.popupCalls[0]).toEqual(
      expect.objectContaining({ className: 'journal-quickpin-popup' })
    )
    vi.useRealTimers()
  })
})
