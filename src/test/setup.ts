import '@testing-library/jest-dom'

// Polyfill ResizeObserver for jsdom (used by Leaflet map component)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver
}
