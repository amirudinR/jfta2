// SRS core — spaced repetition ala Anki (Again/Hard/Good/Easy).
// Rekam progres per entri: { reps, ease, interval (hari), due (ms), lapses }

export const DAY_MS = 24 * 60 * 60 * 1000

// Batas interval maksimum (hari). Tanpa ini, grade 'good'/'easy' berulang
// menumbuhkan interval secara multiplikatif → meledak (~1e47 hari) dan
// `new Date(due)` jadi Invalid Date → kartu "terkunci" (tak pernah due lagi).
// Spaced repetition praktis tak butuh > ~1 tahun.
export const MAX_INTERVAL = 365

const DECIMAL_FLOOR = (x) => Math.floor(x * 10) / 10
const capInterval = (n) => Math.min(MAX_INTERVAL, Math.max(1, Math.round(n)))

export function defaultCard() {
  return { reps: 0, ease: 2.5, interval: 0, due: 0, lapses: 0 }
}

export function isDue(card, now = Date.now()) {
  return !card || card.due <= now
}

export function isMastered(card) {
  return !!card && card.interval >= 21
}

export function gradeCard(card, grade) {
  const c = { ...defaultCard(), ...(card || {}) }
  // Clamp data lama yang mungkin sudah korup (interval raksasa / non-finite).
  if (!Number.isFinite(c.interval)) c.interval = 0
  c.interval = Math.min(c.interval, MAX_INTERVAL)
  const now = Date.now()
  // firstPass hanya benar jika kartu belum pernah dipelajari sama sekali (lapses=0 juga)
  // kartu lapsed (again) punya reps:0 tapi lapses>0 — bukan firstPass
  const firstPass = c.reps === 0 && (c.lapses ?? 0) === 0

  switch (grade) {
    case 'again':
      return {
        ...c,
        reps: 0,
        ease: Math.max(1.3, DECIMAL_FLOOR(c.ease - 0.2)),
        interval: 0,
        due: now,
        lapses: c.lapses + 1,
      }
    case 'hard': {
      const iv = firstPass ? 1 : capInterval(c.interval * 1.2)
      return { ...c, ease: Math.max(1.3, DECIMAL_FLOOR(c.ease - 0.15)), interval: iv, reps: firstPass ? 0 : c.reps, due: now + DAY_MS * iv }
    }
    case 'good': {
      const iv = firstPass ? 1 : capInterval(c.interval * c.ease)
      return { ...c, reps: firstPass ? 1 : c.reps + 1, interval: iv, due: now + DAY_MS * iv }
    }
    case 'easy': {
      const iv = firstPass ? 4 : capInterval(c.interval * c.ease * 1.3)
      return { ...c, reps: firstPass ? 1 : c.reps + 1, ease: Math.min(3.0, DECIMAL_FLOOR(c.ease + 0.15)), interval: iv, due: now + DAY_MS * iv }
    }
    default:
      return c
  }
}

// 'hard' card helper tersedia via gradeCard(..., 'hard')
export function computeStats(cards) {
  const entries = Object.entries(cards || {})
  const total = entries.length
  const mastered = entries.filter(([, c]) => isMastered(c)).length
  const due = entries.filter(([, c]) => isDue(c)).length
  const learning = entries.filter(([, c]) => c && c.interval > 0 && c.interval < 21).length
  // C5 fix: kartu lapsed (grade again) punya reps:0 interval:0 tapi lapses>0
  // bedakan dari kartu benar-benar baru (lapses:0)
  const newCards = entries.filter(([, c]) => c && c.interval === 0 && c.reps === 0 && (c.lapses ?? 0) === 0).length
  return { total, mastered, due, learning, newCards, masteryPct: total ? Math.round((mastered / total) * 100) : 0 }
}