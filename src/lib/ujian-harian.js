// Ujian Harian — merekonstruksi kumpulan item yang dicentang pada tanggal tertentu.
import { HAFALAN_MODES, todayStr, getHistory, getChecked, getCustom } from './hafalan-storage'
import { byMaterial } from '../data'

const CATEGORIES = ['kotoba', 'kanji', 'bunpou']

const CAT_LABEL = { kotoba: 'Kotoba', kanji: 'Kanji', bunpou: 'Bunpou' }

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function friendlyDate(date) {
  const d = new Date(`${date}T00:00:00`)
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function sourceKey(mode, category) {
  if (category === 'kotoba') return mode.kotobaSrc
  if (category === 'kanji') return mode.kanjiSrc
  return mode.bunpouSrc
}

function findEntry(mode, category, rawId) {
  const srcKey = sourceKey(mode, category)
  if (rawId.startsWith('c-')) {
    const idx = Number(rawId.slice(2))
    const custom = (getCustom(mode.key)[category] || [])[idx]
    if (!custom) return null
    return {
      front: custom.front,
      frontSub: '',
      reading: custom.reading || '',
      backShort: custom.meaning,
      backFull: custom.meaning,
    }
  }
  const e = byMaterial(srcKey).find((x) => String(x.id) === String(rawId.slice(2)))
  if (!e) return null
  return {
    front: e.front,
    frontSub: e.frontSub || '',
    reading: e.frontSub || e.reading || '',
    backShort: e.backShort,
    backFull: e.backFull,
  }
}

function truthyKeys(map) {
  return Object.keys(map || {}).filter((k) => map[k])
}

// Seluruh item yang dicentang pada `date` (lintas mode).
export function listDayItems(date) {
  const today = todayStr()
  const pool = []
  for (const mode of HAFALAN_MODES) {
    let ids = null
    if (date === today) {
      const c = getChecked(mode.key)
      ids = {
        kotoba: truthyKeys(c.kotoba),
        kanji: truthyKeys(c.kanji),
        bunpou: truthyKeys(c.bunpou),
      }
    } else {
      const rec = getHistory(mode.key)[date]
      if (!rec?.items) continue
      ids = rec.items
    }
    for (const category of CATEGORIES) {
      if (!sourceKey(mode, category)) continue
      const rawIds = ids[category] || []
      for (const rawId of rawIds) {
        const e = findEntry(mode, category, rawId)
        if (!e) continue
        pool.push({
          id: `${mode.key}:${category}:${rawId}`,
          ...e,
          groupLabel: `${mode.label} · ${CAT_LABEL[category]}`,
        })
      }
    }
  }
  return pool
}

// Daftar tanggal yang punya riwayat centang (terbaru dulu), beserta jumlahnya.
export function availableDays() {
  const today = todayStr()
  const counts = {}

  let todayLive = 0
  for (const mode of HAFALAN_MODES) {
    const c = getChecked(mode.key)
    todayLive += truthyKeys(c.kotoba).length + truthyKeys(c.kanji).length + truthyKeys(c.bunpou).length
    const hist = getHistory(mode.key)
    for (const [date, rec] of Object.entries(hist)) {
      if (date === today || !rec?.items) continue
      const n =
        (rec.items.kotoba?.length || 0) + (rec.items.kanji?.length || 0) + (rec.items.bunpou?.length || 0)
      if (n > 0) counts[date] = (counts[date] || 0) + n
    }
  }
  if (todayLive > 0) counts[today] = (counts[today] || 0) + todayLive

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}