/**
 * Tests for applications grouping and display logic.
 * Tests the grouping by state+year and status badge calculations
 * used in the Applications page.
 */
import { describe, it, expect } from 'vitest'

type HuntApplication = {
  id: string
  user_id: string
  state: string
  state_name: string
  species: string
  season: string
  year: number
  status: 'applied' | 'drawn' | 'not_drawn' | 'withdrawn'
  unit: string | null
  first_choice: string | null
  second_choice: string | null
  third_choice: string | null
  date_applied: string | null
}

type StateGroup = {
  key: string
  state: string
  state_name: string
  year: number
  apps: HuntApplication[]
}

function groupApplicationsByState(applications: HuntApplication[]): StateGroup[] {
  const grouped = new Map<string, StateGroup>()
  for (const app of applications) {
    const key = `${app.state}-${app.year}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        state: app.state,
        state_name: app.state_name,
        year: app.year,
        apps: [],
      })
    }
    grouped.get(key)!.apps.push(app)
  }
  return Array.from(grouped.values())
}

function countDrawn(apps: HuntApplication[]): number {
  return apps.filter(a => a.status === 'drawn').length
}

function countPending(apps: HuntApplication[]): number {
  return apps.filter(a => a.status === 'applied').length
}

function hasAnyDrawn(apps: HuntApplication[]): boolean {
  return apps.some(a => a.status === 'drawn')
}

function hasAnyRejected(apps: HuntApplication[]): boolean {
  return apps.some(a => a.status === 'not_drawn')
}

function getHuntCodeDisplay(app: HuntApplication): string | null {
  return app.first_choice ?? app.unit ?? null
}

function countExtraChoices(app: HuntApplication): number {
  return [app.second_choice, app.third_choice].filter(Boolean).length
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const base: HuntApplication = {
  id: '1',
  user_id: 'user-1',
  state: 'CO',
  state_name: 'Colorado',
  species: 'elk',
  season: 'rifle',
  year: 2026,
  status: 'applied',
  unit: 'E-E-049-O1-R',
  first_choice: 'E-E-049-O1-R',
  second_choice: null,
  third_choice: null,
  date_applied: '2026-03-01',
}

const coElk: HuntApplication = { ...base }
const coDeer: HuntApplication = { ...base, id: '2', species: 'mule_deer', unit: null, first_choice: 'D-D-061-O1-R', status: 'drawn' }
const coMoose: HuntApplication = { ...base, id: '3', species: 'moose', unit: 'E-M-001-O1-R', first_choice: 'E-M-001-O1-R', status: 'not_drawn' }
const wyElk: HuntApplication = { ...base, id: '4', state: 'WY', state_name: 'Wyoming', species: 'elk', unit: 'WY-001', first_choice: 'WY-001', second_choice: 'WY-002', status: 'applied' }

// ── Tests ────────────────────────────────────────────────────────────────────

describe('groupApplicationsByState', () => {
  it('groups applications by state+year', () => {
    const groups = groupApplicationsByState([coElk, coDeer, wyElk])
    expect(groups.length).toBe(2)
  })

  it('all CO apps are in the same group', () => {
    const groups = groupApplicationsByState([coElk, coDeer, coMoose])
    expect(groups.length).toBe(1)
    expect(groups[0].apps.length).toBe(3)
  })

  it('different years for same state create separate groups', () => {
    const co2025 = { ...coElk, id: '99', year: 2025 }
    const groups = groupApplicationsByState([coElk, co2025])
    expect(groups.length).toBe(2)
  })

  it('returns empty array for no applications', () => {
    expect(groupApplicationsByState([])).toHaveLength(0)
  })

  it('preserves state_name on each group', () => {
    const groups = groupApplicationsByState([coElk])
    expect(groups[0].state_name).toBe('Colorado')
  })

  it('group key is state-year format', () => {
    const groups = groupApplicationsByState([coElk])
    expect(groups[0].key).toBe('CO-2026')
  })
})

describe('countDrawn', () => {
  it('returns 0 when no applications are drawn', () => {
    expect(countDrawn([coElk])).toBe(0)
  })

  it('returns correct count of drawn applications', () => {
    expect(countDrawn([coElk, coDeer, coMoose])).toBe(1)
  })

  it('returns total when all are drawn', () => {
    const allDrawn = [
      { ...coElk, status: 'drawn' as const },
      { ...coDeer, status: 'drawn' as const },
    ]
    expect(countDrawn(allDrawn)).toBe(2)
  })
})

describe('countPending', () => {
  it('returns count of applied (pending) applications', () => {
    expect(countPending([coElk, coDeer, coMoose])).toBe(1) // only coElk is 'applied'
  })

  it('returns 0 when none are pending', () => {
    expect(countPending([coDeer, coMoose])).toBe(0) // drawn + not_drawn
  })
})

describe('hasAnyDrawn', () => {
  it('returns true when at least one application is drawn', () => {
    expect(hasAnyDrawn([coElk, coDeer])).toBe(true)
  })

  it('returns false when no applications are drawn', () => {
    expect(hasAnyDrawn([coElk, coMoose])).toBe(false)
  })
})

describe('hasAnyRejected', () => {
  it('returns true when at least one application is not_drawn', () => {
    expect(hasAnyRejected([coElk, coMoose])).toBe(true) // coMoose is not_drawn
  })

  it('returns false when no applications are rejected', () => {
    expect(hasAnyRejected([coElk, coDeer])).toBe(false) // applied + drawn
  })
})

describe('getHuntCodeDisplay', () => {
  it('returns first_choice when available', () => {
    expect(getHuntCodeDisplay(coElk)).toBe('E-E-049-O1-R')
  })

  it('falls back to unit when first_choice is null', () => {
    const app = { ...coElk, first_choice: null, unit: 'fallback-unit' }
    expect(getHuntCodeDisplay(app)).toBe('fallback-unit')
  })

  it('returns null when both first_choice and unit are null', () => {
    const app = { ...coElk, first_choice: null, unit: null }
    expect(getHuntCodeDisplay(app)).toBeNull()
  })
})

describe('countExtraChoices', () => {
  it('returns 0 when no second or third choice', () => {
    expect(countExtraChoices(coElk)).toBe(0)
  })

  it('returns 1 when only second choice exists', () => {
    expect(countExtraChoices(wyElk)).toBe(1) // second_choice: 'WY-002'
  })

  it('returns 2 when both second and third choices exist', () => {
    const app = { ...coElk, second_choice: 'choice-2', third_choice: 'choice-3' }
    expect(countExtraChoices(app)).toBe(2)
  })
})

describe('full application group scenario', () => {
  const apps = [coElk, coDeer, coMoose]
  const groups = groupApplicationsByState(apps)
  const coGroup = groups[0]

  it('CO group has 3 applications', () => {
    expect(coGroup.apps.length).toBe(3)
  })

  it('CO group has 1 drawn', () => {
    expect(countDrawn(coGroup.apps)).toBe(1)
  })

  it('CO group has 1 pending', () => {
    expect(countPending(coGroup.apps)).toBe(1)
  })

  it('CO group has drawn (green border)', () => {
    expect(hasAnyDrawn(coGroup.apps)).toBe(true)
  })

  it('CO group has rejected (show rejected note)', () => {
    expect(hasAnyRejected(coGroup.apps)).toBe(true)
  })
})
