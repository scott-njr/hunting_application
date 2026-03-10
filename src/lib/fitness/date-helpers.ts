/** Parse a date string as local midnight on its calendar date.
 *  Supabase timestamptz like "2026-03-09T00:15:08+00:00" can shift to the
 *  previous local day near midnight. We extract the YYYY-MM-DD portion and
 *  treat it as local midnight so the calendar always shows the correct day. */
export function parseLocalDate(dateStr: string): Date {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return new Date(dateStr)
}

/** Get the Monday of the week containing the given date */
export function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Calculate which week of a plan the user is currently in */
export function getCurrentWeek(startedAt: string, weeksTotal: number): number {
  const start = parseLocalDate(startedAt).getTime()
  const now = Date.now()
  const week = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(week, weeksTotal))
}
