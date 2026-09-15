import { isDue, isMastered } from './srs'
import { MATERIALS } from '../data/materials'

export function bucket(list, cards) {
  let started = 0
  let mastered = 0
  let learning = 0
  let newCards = 0
  const dues = []
  for (const e of list) {
    const c = cards[e.id]
    if (!c) continue
    started++
    dues.push(c.due)
    if (isMastered(c)) mastered++
    else if (c.interval > 0) learning++
    else if (c.reps === 0) newCards++
  }
  return {
    started,
    mastered,
    learning,
    newCards,
    nextDue: dues.length ? Math.min(...dues) : null,
  }
}

// Jumlah kartu yang jatuh tempo hari ini.
export function dueCount(cards) {
  return Object.values(cards || {}).filter((c) => c && isDue(c)).length
}

// Kartu yang sudah pernah dipelajari (ada rep atau interval).
export function totalStudied(cards) {
  return Object.values(cards || {}).filter((c) => c && (c.reps > 0 || c.interval > 0)).length
}

// Rata-rata ease kartu yang sudah pernah di-review.
export function avgEase(cards) {
  const a = Object.values(cards || {}).filter((c) => c && c.reps > 0)
  if (!a.length) return 0
  return Math.round((a.reduce((s, c) => s + c.ease, 0) / a.length) * 100) / 100
}

// Total ulasan yang tercatat di riwayat harian.
export function totalReviews(history) {
  const d = (history && history.days) || {}
  return Object.values(d).reduce((s, day) => s + (day.reviewed || 0), 0)
}

// Statistik per sumber materi, mengikuti urutan MATERIALS.
export function perMaterialStats(allEntries, cards, fallbackMaterial) {
  const byMat = new Map()
  for (const e of allEntries || []) {
    const m = e.material || fallbackMaterial
    if (!byMat.has(m)) byMat.set(m, [])
    byMat.get(m).push(e)
  }
  return MATERIALS.map((m) => {
    const list = byMat.get(m.key) || []
    const b = bucket(list, cards)
    return { ...m, ...b, total: list.length, pct: list.length ? Math.round((b.started / list.length) * 100) : 0 }
  })
}

// Statistik per kelompok pelajaran.
export function groupStats(entries, cards) {
  const map = new Map()
  for (const e of entries || []) {
    const g = e.groupLabel || 'Umum'
    if (!map.has(g)) map.set(g, [])
    map.get(g).push(e)
  }
  return [...map.entries()].map(([name, list]) => {
    const b = bucket(list, cards)
    return { name, total: list.length, ...b, pct: list.length ? Math.round((b.mastered / list.length) * 100) : 0 }
  })
}

// Aktivitas 7 hari terakhir dari riwayat harian.
export function weekActivity(history) {
  const d = (history && history.days) || {}
  const out = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const key =
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    const rec = d[key]
    out.push({
      key,
      label: dt.toLocaleDateString('id-ID', { weekday: 'short' }),
      count: rec ? rec.studied || 0 : 0,
    })
  }
  return out
}
