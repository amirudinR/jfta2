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
  if (rawId.startsWith('c-') || rawId.startsWith('cc-')) {
    const customs = getCustom(mode.key)[category] || []
    // Id stabil (baru) dicari pas; id lama berbasis indeks c-0/c-1 sebagai fallback.
    const custom = customs.find((c) => c.id === rawId) || customs[Number(rawId.slice(2))]
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
// `modeKey` (opsional) membatasi hasil ke SATU mode/level saja — dipakai fitur
// Ujian agar materi tidak tercampur antar-level (mis. level N3 hanya N3).
// Tanpa `modeKey`, perilaku lama (gabung semua mode) tetap dipertahankan agar
// pemakai lain tidak rusak.
export function listDayItems(date, modeKey) {
  const today = todayStr()
  const modes = modeKey ? HAFALAN_MODES.filter((m) => m.key === modeKey) : HAFALAN_MODES
  const pool = []
  for (const mode of modes) {
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
          mode: mode.key,
          category,
          groupLabel: `${mode.label} · ${CAT_LABEL[category]}`,
        })
      }
    }
  }
  return pool
}

// Apakah ADA materi tercatat pada `date` (untuk `modeKey` bila diberikan)?
// Dipakai UI untuk membedakan "tanggal kosong" vs "belum ada riwayat".
export function dayHasItems(date, modeKey) {
  return listDayItems(date, modeKey).length > 0
}

// Daftar tanggal yang punya riwayat centang (terbaru dulu), beserta jumlahnya.
// `modeKey` (opsional) membatasi hitungan ke satu mode/level saja.
export function availableDays(modeKey) {
  const today = todayStr()
  const modes = modeKey ? HAFALAN_MODES.filter((m) => m.key === modeKey) : HAFALAN_MODES
  const counts = {}

  let todayLive = 0
  for (const mode of modes) {
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