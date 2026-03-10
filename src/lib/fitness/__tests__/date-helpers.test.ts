import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseLocalDate, getWeekMonday, getCurrentWeek } from '../date-helpers'

describe('parseLocalDate', () => {
  it('parses date-only string as local midnight', () => {
    const d = parseLocalDate('2026-03-09')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2) // March = 2
    expect(d.getDate()).toBe(9)
    expect(d.getHours()).toBe(0)
  })

  it('extracts date from full ISO timestamp (avoids UTC-to-local day shift)', () => {
    // This UTC timestamp would be Sunday March 8th in US timezones
    // but the calendar date in the string is 2026-03-09
    const d = parseLocalDate('2026-03-09T00:15:08+00:00')
    expect(d.getDate()).toBe(9)
    expect(d.getMonth()).toBe(2)
  })

  it('extracts date from Supabase timestamptz with microseconds', () => {
    const d = parseLocalDate('2026-03-09T05:15:08.123456+00:00')
    expect(d.getDate()).toBe(9)
    expect(d.getMonth()).toBe(2)
  })

  it('extracts date from timestamp without timezone', () => {
    const d = parseLocalDate('2026-03-09T05:15:08')
    expect(d.getDate()).toBe(9)
  })

  it('handles December correctly (month boundary)', () => {
    const d = parseLocalDate('2026-12-31')
    expect(d.getMonth()).toBe(11) // December = 11
    expect(d.getDate()).toBe(31)
  })

  it('handles January correctly', () => {
    const d = parseLocalDate('2026-01-01')
    expect(d.getMonth()).toBe(0) // January = 0
    expect(d.getDate()).toBe(1)
  })
})

describe('getWeekMonday', () => {
  it('returns same day for a Monday', () => {
    // March 9, 2026 is a Monday
    const monday = new Date(2026, 2, 9)
    const result = getWeekMonday(monday)
    expect(result.getDate()).toBe(9)
    expect(result.getDay()).toBe(1) // Monday
  })

  it('returns previous Monday for a Wednesday', () => {
    // March 11, 2026 is a Wednesday
    const wed = new Date(2026, 2, 11)
    const result = getWeekMonday(wed)
    expect(result.getDate()).toBe(9)
    expect(result.getDay()).toBe(1)
  })

  it('returns previous Monday for a Sunday', () => {
    // March 15, 2026 is a Sunday
    const sun = new Date(2026, 2, 15)
    const result = getWeekMonday(sun)
    expect(result.getDate()).toBe(9)
    expect(result.getDay()).toBe(1)
  })

  it('returns previous Monday for a Saturday', () => {
    // March 14, 2026 is a Saturday
    const sat = new Date(2026, 2, 14)
    const result = getWeekMonday(sat)
    expect(result.getDate()).toBe(9)
    expect(result.getDay()).toBe(1)
  })

  it('handles month boundary (Monday in previous month)', () => {
    // March 1, 2026 is a Sunday → Monday is Feb 23
    const sun = new Date(2026, 2, 1)
    const result = getWeekMonday(sun)
    expect(result.getMonth()).toBe(1) // February
    expect(result.getDate()).toBe(23)
    expect(result.getDay()).toBe(1)
  })

  it('sets time to midnight', () => {
    const d = new Date(2026, 2, 11, 15, 30, 45)
    const result = getWeekMonday(d)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })
})

describe('getCurrentWeek', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns week 1 on the start date', () => {
    // Mock Date.now() to return March 9, 2026 noon local
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 2, 9, 12, 0, 0).getTime())
    expect(getCurrentWeek('2026-03-09', 8)).toBe(1)
  })

  it('returns week 2 after 7 days', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 2, 16, 12, 0, 0).getTime())
    expect(getCurrentWeek('2026-03-09', 8)).toBe(2)
  })

  it('returns week 1 on day 6 (still within first week)', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 2, 15, 12, 0, 0).getTime())
    expect(getCurrentWeek('2026-03-09', 8)).toBe(1)
  })

  it('clamps to weeksTotal when past the plan duration', () => {
    // 60 days after start = week 9, but plan only has 8 weeks
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 4, 8, 12, 0, 0).getTime())
    expect(getCurrentWeek('2026-03-09', 8)).toBe(8)
  })

  it('returns 1 as minimum even with future start dates', () => {
    // Now is before the start date
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 2, 1, 12, 0, 0).getTime())
    expect(getCurrentWeek('2026-03-09', 8)).toBe(1)
  })

  it('handles Supabase timestamptz format without day shift', () => {
    // This UTC timestamp could shift to March 8 in US timezones
    // but parseLocalDate extracts March 9 from the string
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 2, 9, 12, 0, 0).getTime())
    expect(getCurrentWeek('2026-03-09T00:15:08+00:00', 8)).toBe(1)
  })

  it('handles Supabase timestamptz without shifting to wrong week', () => {
    // 7 days after March 9 = March 16
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 2, 16, 12, 0, 0).getTime())
    // If parseLocalDate were broken, this might return week 3 instead of 2
    expect(getCurrentWeek('2026-03-09T00:15:08+00:00', 8)).toBe(2)
  })
})

describe('parseLocalDate + getWeekMonday integration', () => {
  it('Supabase timestamp gives correct Monday (the core bug fix)', () => {
    // The original bug: "2026-03-09T00:15:08+00:00" parsed as UTC →
    // Sunday March 8 in CDT → getWeekMonday → Monday March 2 (WRONG!)
    // Fixed: parseLocalDate extracts "2026-03-09" → local March 9 →
    // getWeekMonday → Monday March 9 (CORRECT)
    const parsed = parseLocalDate('2026-03-09T00:15:08+00:00')
    const monday = getWeekMonday(parsed)
    expect(monday.getDate()).toBe(9)
    expect(monday.getMonth()).toBe(2)
    expect(monday.getDay()).toBe(1)
  })

  it('date-only string gives correct Monday', () => {
    const parsed = parseLocalDate('2026-03-09')
    const monday = getWeekMonday(parsed)
    expect(monday.getDate()).toBe(9)
    expect(monday.getDay()).toBe(1)
  })

  it('mid-week timestamp gives correct Monday', () => {
    // Wednesday March 11
    const parsed = parseLocalDate('2026-03-11T14:30:00+00:00')
    const monday = getWeekMonday(parsed)
    expect(monday.getDate()).toBe(9)
    expect(monday.getDay()).toBe(1)
  })
})
