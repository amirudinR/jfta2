// Nemonik Kanji — log harian & riwayat sesi belajar.
// Store (prefix `hh2-` agar ikut cloud-sync & "Reset semua progres"):
//   - hh2-nemonik-daily-log : { 'YYYY-MM-DD': { reviewed, lupa, sulit, tahu } }
//   - hh2-nemonik-sessions  : [ { ts, dur, total, lupa, sulit, tahu, accuracy } ]

import { lsGet, lsSet, dayStr, STORAGE_PREFIX } from './hafalan-storage'

export const NEMONIK_DAILY_KEY = `${STORAGE_PREFIX}-nemonik-daily-log`
export const NEMONIK_SESSIONS_KEY = `${STORAGE_PREFIX}-nemonik-sessions`

// Batasi panjang riwayat sesi agar storage tidak membengkak.
const MAX_SESSIONS = 100

export const getDailyLog = () => lsGet(NEMONIK_DAILY_KEY, {})
export const getSessions = () => lsGet(NEMONIK_SESSIONS_KEY, [])

// Tambah hasil satu kartu ke log harian (dipanggil per penilaian).
// rating: 1 = Lupa, 2 = Sulit, 3 = Tahu.
export function logDailyReview(rating, now = new Date()) {
  const key = dayStr(now)
  const log = getDailyLog()
  const day = log[key] || { reviewed: 0, lupa: 0, sulit: 0, tahu: 0 }
  day.reviewed += 1
  if (rating === 1) day.lupa += 1
  else if (rating === 2) day.sulit += 1
  else day.tahu += 1
  log[key] = day
  lsSet(NEMONIK_DAILY_KEY, log)
  return log
}

// Simpan satu sesi belajar selesai ke riwayat.
// entry: { dur, total, lupa, sulit, tahu } — dur dalam milidetik.
export function saveSession(entry, now = new Date()) {
  const total = entry.total || 0
  const correct = (entry.tahu || 0) + (entry.sulit || 0) // "paham" = tahu + sulit
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const rec = {
    ts: now.getTime(),
    dur: Math.max(0, Math.round(entry.dur || 0)),
    total,
    lupa: entry.lupa || 0,
    sulit: entry.sulit || 0,
    tahu: entry.tahu || 0,
    accuracy,
  }
  const list = [rec, ...getSessions()].slice(0, MAX_SESSIONS)
  lsSet(NEMONIK_SESSIONS_KEY, list)
  return rec
}

// Agregat ringkas untuk ditampilkan (mis. total sesi, streak belajar, akurasi rata2).
export function sessionSummary() {
  const list = getSessions()
  const sessions = list.length
  const totalCards = list.reduce((a, s) => a + (s.total || 0), 0)
  const avgAcc = sessions > 0
    ? Math.round(list.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions)
    : 0
  const last = list[0] || null
  return { sessions, totalCards, avgAcc, last }
}

// Interval hari untuk heatmap: array { key, d, count } dari `days` hari terakhir.
export function dailySeries(days = 91, now = new Date()) {
  const log = getDailyLog()
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = dayStr(d)
    const entry = log[key]
    out.push({ key, d, count: entry?.reviewed || 0, entry })
  }
  return out
}
