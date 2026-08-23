export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function keyFor(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

// Builds a 6x7 grid of cells (some from adjacent months) for the given
// year/month (month is 0-indexed).
export function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) {
    const day = daysInPrevMonth - firstWeekday + 1 + i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ day, key: keyFor(y, m, day), inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, key: keyFor(year, month, day), inMonth: true })
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const idx = cells.length - firstWeekday - daysInMonth
    const day = idx + 1
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    cells.push({ day, key: keyFor(y, m, day), inMonth: false })
    if (cells.length >= 42) break
  }
  return cells
}

// Longest run of consecutive calendar days with XP > 0, and current run
// ending today-or-yesterday (mirrors the store's own grace window).
export function longestStreakFrom(dailyXp) {
  const activeDays = Object.keys(dailyXp).filter((k) => dailyXp[k] > 0).sort()
  if (activeDays.length === 0) return 0
  let longest = 1
  let run = 1
  for (let i = 1; i < activeDays.length; i++) {
    const prev = new Date(activeDays[i - 1] + 'T00:00:00')
    const cur = new Date(activeDays[i] + 'T00:00:00')
    const diff = Math.round((cur - prev) / 86400000)
    run = diff === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }
  return longest
}

export function intensityTier(xp) {
  if (!xp) return 0
  if (xp < 20) return 1
  if (xp < 50) return 2
  if (xp < 90) return 3
  return 4
}
