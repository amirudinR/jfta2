// SRS core — spaced repetition ala Anki (Again/Hard/Good/Easy).
// Rekam progres per entri: { reps, ease, interval (hari), due (ms), lapses }

export const DAY_MS = 24 * 60 * 60 * 1000

const DECIMAL_FLOOR = (x) => Math.floor(x * 10) / 10

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
  const now = Date.now()
  const firstPass = c.reps === 0

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
    case 'hard':
      return {
        ...c,
        ease: Math.max(1.3, DECIMAL_FLOOR(c.ease - 0.15)),
        interval: firstPass ? 1 : Math.max(1, Math.round(c.interval * 1.2)),
        reps: firstPass ? 0 : c.reps,
        due: now + DAY_MS * (firstPass ? 1 : Math.max(1, Math.round(c.interval * 1.2))),
      }
    case 'good':
      return {
        ...c,
        reps: firstPass ? 1 : c.reps + 1,
        interval: firstPass ? 1 : Math.round(c.interval * c.ease),
        due: now + DAY_MS * (firstPass ? 1 : Math.round(c.interval * c.ease)),
      }
    case 'easy':
      return {
        ...c,
        reps: firstPass ? 1 : c.reps + 1,
        ease: Math.min(3.0, DECIMAL_FLOOR(c.ease + 0.15)),
        interval: firstPass ? 4 : Math.round(c.interval * c.ease * 1.3),
        due: now + DAY_MS * (firstPass ? 4 : Math.round(c.interval * c.ease * 1.3)),
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
  const newCards = entries.filter(([, c]) => c && c.interval === 0 && c.reps === 0).length
  return { total, mastered, due, learning, newCards, masteryPct: total ? Math.round((mastered / total) * 100) : 0 }
}