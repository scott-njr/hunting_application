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

/** Training day mapping: daysPerWeek → which days of the week (1=Mon, 5=Fri, etc.) */
const TRAINING_DAYS: Record<number, number[]> = {
  1: [1],
  2: [2, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
}

/** Get today's day-of-week as 1=Mon..7=Sun */
function getTodayDayNumber(): number {
  const jsDay = new Date().getDay() // 0=Sun
  return jsDay === 0 ? 7 : jsDay
}

/**
 * Returns session numbers (1-based) in the current week whose scheduled
 * calendar day has already passed (i.e. before today). These should be
 * preserved during plan adjustments regardless of whether the user logged them.
 */
export function getPassedSessionNumbers(daysPerWeek: number): number[] {
  const todayDay = getTodayDayNumber()
  const trainingDays = TRAINING_DAYS[daysPerWeek] ?? TRAINING_DAYS[3]
  const passed: number[] = []
  for (let i = 0; i < trainingDays.length; i++) {
    if (trainingDays[i] < todayDay) {
      passed.push(i + 1) // 1-based session number
    }
  }
  return passed
}

/**
 * For "Catch Up": find the first uncompleted session from the current week onward.
 * Returns { week, sessionIndex } (both 1-based) or null if fully complete.
 */
export function findNextUncompletedSession(
  weeksData: Array<{ sessions: unknown[] }>,
  completedLogs: Set<string>, // "week:session" keys like "2:1"
  currentWeek: number,
  daysPerWeek: number,
): { week: number; sessionIndex: number } | null {
  const todayDay = getTodayDayNumber()
  const trainingDays = TRAINING_DAYS[daysPerWeek] ?? TRAINING_DAYS[3]

  for (let w = currentWeek - 1; w < weeksData.length; w++) {
    const weekNum = w + 1
    const sessions = weeksData[w]?.sessions ?? []

    for (let s = 0; s < sessions.length; s++) {
      const sessionNum = s + 1
      // Skip sessions in the current week that are today or in the future (not missed)
      if (weekNum === currentWeek) {
        const scheduledDay = trainingDays[s]
        if (scheduledDay !== undefined && scheduledDay >= todayDay) continue
      }
      if (!completedLogs.has(`${weekNum}:${sessionNum}`)) {
        return { week: weekNum, sessionIndex: sessionNum }
      }
    }
  }
  return null
}
