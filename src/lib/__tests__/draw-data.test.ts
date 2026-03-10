/**
 * Tests for draw data logic used in the Deadlines page.
 * These test the grouping, date detection, and status logic that
 * lives in deadlines-client.tsx as pure utility functions.
 */
import { describe, it, expect } from 'vitest'

// ── Utility functions extracted for testing ─────────────────────────────────

type DrawRow = {
  id: string
  draw_state_id: string
  state_code: string
  species: string
  year: number
  deadline: string | null
  results_date: string | null
  status: 'open' | 'upcoming' | 'closed'
  note: string | null
  seasons: string[]
}

function groupByState(draws: DrawRow[]): Map<string, DrawRow[]> {
  const grouped = new Map<string, DrawRow[]>()
  for (const d of draws) {
    const rows = grouped.get(d.draw_state_id) ?? []
    rows.push(d)
    grouped.set(d.draw_state_id, rows)
  }
  return grouped
}

function hasUniformDeadlines(group: DrawRow[]): boolean {
  return new Set(group.map(d => d.deadline)).size === 1
}

function getCardStatus(group: DrawRow[]): 'open' | 'upcoming' | 'closed' {
  if (group.some(d => d.status === 'open')) return 'open'
  if (group.some(d => d.status === 'upcoming')) return 'upcoming'
  return 'closed'
}

function speciesLabel(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function appliedKey(d: { state_code: string; species: string; year: number }): string {
  return `${d.state_code}-${d.species}-${d.year}`
}

// ── Test fixtures ────────────────────────────────────────────────────────────

const CO_ELK: DrawRow = {
  id: 'co-elk',
  draw_state_id: 'co-state',
  state_code: 'CO',
  species: 'elk',
  year: 2026,
  deadline: 'Apr 7, 2026',
  results_date: 'May 26, 2026',
  status: 'open',
  note: null,
  seasons: ['archery', 'rifle', 'muzzleloader'],
}

const CO_DEER: DrawRow = {
  ...CO_ELK,
  id: 'co-deer',
  species: 'mule_deer',
  deadline: 'Apr 7, 2026',
  note: null,
}

const CO_MOOSE: DrawRow = {
  ...CO_ELK,
  id: 'co-moose',
  species: 'moose',
  deadline: 'Apr 7, 2026',
  note: null,
}

const MT_ELK: DrawRow = {
  id: 'mt-elk',
  draw_state_id: 'mt-state',
  state_code: 'MT',
  species: 'elk',
  year: 2026,
  deadline: 'Apr 1, 2026',
  results_date: 'Mid-Apr 2026',
  status: 'open',
  note: null,
  seasons: ['archery', 'rifle', 'muzzleloader'],
}

const MT_MOOSE: DrawRow = {
  ...MT_ELK,
  id: 'mt-moose',
  species: 'moose',
  deadline: 'May 1, 2026',
  results_date: 'Mid-May 2026',
  status: 'upcoming',
  note: 'Extremely limited permits.',
}

const MT_PRONGHORN: DrawRow = {
  ...MT_ELK,
  id: 'mt-pronghorn',
  species: 'pronghorn',
  deadline: 'Jun 1, 2026',
  results_date: 'Mid-Jun 2026',
  status: 'upcoming',
  note: null,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('groupByState', () => {
  it('groups draws by draw_state_id', () => {
    const draws = [CO_ELK, CO_DEER, MT_ELK]
    const grouped = groupByState(draws)
    expect(grouped.size).toBe(2)
    expect(grouped.get('co-state')?.length).toBe(2)
    expect(grouped.get('mt-state')?.length).toBe(1)
  })

  it('returns empty map for empty input', () => {
    expect(groupByState([]).size).toBe(0)
  })

  it('preserves draw order within each group', () => {
    const draws = [CO_ELK, CO_DEER, CO_MOOSE]
    const grouped = groupByState(draws)
    const coGroup = grouped.get('co-state')!
    expect(coGroup[0].species).toBe('elk')
    expect(coGroup[1].species).toBe('mule_deer')
    expect(coGroup[2].species).toBe('moose')
  })
})

describe('hasUniformDeadlines', () => {
  it('returns true when all species share the same deadline (CO pattern)', () => {
    expect(hasUniformDeadlines([CO_ELK, CO_DEER, CO_MOOSE])).toBe(true)
  })

  it('returns false when species have different deadlines (MT pattern)', () => {
    expect(hasUniformDeadlines([MT_ELK, MT_MOOSE, MT_PRONGHORN])).toBe(false)
  })

  it('returns true for a single species', () => {
    expect(hasUniformDeadlines([CO_ELK])).toBe(true)
  })

  it('returns false when two species have different deadlines', () => {
    expect(hasUniformDeadlines([MT_ELK, MT_MOOSE])).toBe(false)
  })

  it('handles null deadlines consistently', () => {
    const noDeadline1 = { ...CO_ELK, deadline: null }
    const noDeadline2 = { ...CO_DEER, deadline: null }
    expect(hasUniformDeadlines([noDeadline1, noDeadline2])).toBe(true)
  })
})

describe('getCardStatus', () => {
  it('returns open when any species is open', () => {
    expect(getCardStatus([MT_ELK, MT_MOOSE])).toBe('open')
  })

  it('returns open when all species are open', () => {
    expect(getCardStatus([CO_ELK, CO_DEER, CO_MOOSE])).toBe('open')
  })

  it('returns upcoming when all species are upcoming', () => {
    expect(getCardStatus([MT_MOOSE, MT_PRONGHORN])).toBe('upcoming')
  })

  it('returns closed when all species are closed', () => {
    const closed = [
      { ...CO_ELK, status: 'closed' as const },
      { ...CO_DEER, status: 'closed' as const },
    ]
    expect(getCardStatus(closed)).toBe('closed')
  })

  it('returns open when mix of open and upcoming', () => {
    expect(getCardStatus([MT_ELK, MT_PRONGHORN])).toBe('open') // MT_ELK is open
  })
})

describe('speciesLabel', () => {
  it('converts snake_case to Title Case', () => {
    expect(speciesLabel('elk')).toBe('Elk')
    expect(speciesLabel('mule_deer')).toBe('Mule Deer')
    expect(speciesLabel('bighorn_sheep')).toBe('Bighorn Sheep')
    expect(speciesLabel('mountain_goat')).toBe('Mountain Goat')
    expect(speciesLabel('black_bear')).toBe('Black Bear')
    expect(speciesLabel('pronghorn')).toBe('Pronghorn')
  })

  it('handles single-word species', () => {
    expect(speciesLabel('moose')).toBe('Moose')
    expect(speciesLabel('bison')).toBe('Bison')
  })
})

describe('appliedKey', () => {
  it('generates consistent keys', () => {
    expect(appliedKey({ state_code: 'CO', species: 'elk', year: 2026 })).toBe('CO-elk-2026')
    expect(appliedKey({ state_code: 'MT', species: 'moose', year: 2026 })).toBe('MT-moose-2026')
  })

  it('keys are unique per state/species/year combination', () => {
    const co_elk = appliedKey({ state_code: 'CO', species: 'elk', year: 2026 })
    const mt_elk = appliedKey({ state_code: 'MT', species: 'elk', year: 2026 })
    const co_deer = appliedKey({ state_code: 'CO', species: 'mule_deer', year: 2026 })
    const co_elk_2025 = appliedKey({ state_code: 'CO', species: 'elk', year: 2025 })

    const keys = [co_elk, mt_elk, co_deer, co_elk_2025]
    const unique = new Set(keys)
    expect(unique.size).toBe(4)
  })
})

describe('Colorado 2026 draw structure', () => {
  const coDraws = [CO_ELK, CO_DEER, CO_MOOSE]

  it('all CO species have the same deadline', () => {
    expect(hasUniformDeadlines(coDraws)).toBe(true)
  })

  it('CO card status is open (at least one species open)', () => {
    expect(getCardStatus(coDraws)).toBe('open')
  })

  it('CO has 3 species in the group', () => {
    const grouped = groupByState(coDraws)
    expect(grouped.get('co-state')?.length).toBe(3)
  })
})

describe('Montana 2026 draw structure', () => {
  const mtDraws = [MT_ELK, MT_MOOSE, MT_PRONGHORN]

  it('MT species have different deadlines', () => {
    expect(hasUniformDeadlines(mtDraws)).toBe(false)
  })

  it('MT card status is open because elk is open', () => {
    expect(getCardStatus(mtDraws)).toBe('open')
  })

  it('MT has 3 species in the group', () => {
    const grouped = groupByState(mtDraws)
    expect(grouped.get('mt-state')?.length).toBe(3)
  })

  it('MT moose has a note', () => {
    expect(MT_MOOSE.note).toBeTruthy()
  })
})
