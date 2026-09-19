import { publishStoreChange } from './sync-events'

const KEY = 'hafalan-jft-a2-history-v1'

const emptyHistory = () => ({ days: {}, updated: 0 })

function todayStr() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function recordStudy(material, id, grade, state) {
  const history = getHistory()
  const day = todayStr()
  const entry = (history.days[day] = history.days[day] || {
    studied: 0,
    reviewed: 0,
    learned: 0,
    grades: { again: 0, hard: 0, good: 0, easy: 0 },
  })
  entry.studied += 1
  if (state) {
    if (state.reps > 1) entry.reviewed += 1
    else entry.learned += 1
  }
  if (grade && grade in entry.grades) entry.grades[grade] += 1
  history.updated = Date.now()
  try {
    localStorage.setItem(KEY, JSON.stringify(history))
  } catch (e) {
    /* abaikan */
  }
  publishStoreChange(KEY)
  return history
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const history = JSON.parse(raw)
      if (!history || typeof history !== 'object') return emptyHistory()
      history.days = (history.days && typeof history.days === 'object') ? history.days : {}
      return history
    }
  } catch (e) {
    /* abaikan */
  }
  return emptyHistory()
}

export function computeStreak(history) {
  const days = history && history.days ? history.days : {}
  const dates = Object.keys(days).filter((d) => days[d].studied > 0).sort()
  if (dates.length === 0) return { current: 0, longest: 0 }

  let current = 0
  // Parse sebagai waktu LOKAL (bukan UTC). `new Date('YYYY-MM-DD')` = UTC
  // midnight → di zona barat UTC bisa jatuh ke hari sebelumnya (streak salah).
  const cursor = parseLocalDate(todayStr())
  if (dates.includes(todayStr())) {
    current = 1
    cursor.setDate(cursor.getDate() - 1)
  }
  while (dates.includes(dayStr(cursor))) {
    current += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  let longest = 0
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = parseLocalDate(dates[i - 1])
    const cur = parseLocalDate(dates[i])
    const gap = Math.round((cur - prev) / 86400000)
    run = gap === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }
  longest = Math.max(longest, run, current)

  return { current, longest }
}

// Parse 'YYYY-MM-DD' sebagai tengah malam WAKTU LOKAL (bukan UTC).
function parseLocalDate(s) {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function dayStr(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
