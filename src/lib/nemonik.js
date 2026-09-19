// Nemonik Kanji — logika murni (data, SRS, statistik, streak).
// Port dari nemonik/app.js (mandiri) ke sistem app:
// - Data dari /nemonik/data.json (aset statis di public/, bukan bundle JS).
// - State SRS/store disimpan lewat lsGet/lsSet → ikut publishStoreChange
//   sehingga ikut live-sync (cloud) & ikut "Reset semua progres".
// Catatan: SRS nemonik TERPISAH dari SRS utama A2 (model data beda:
// status baru/belajar/hafal/ulang vs reps/ease/interval/due).

import { lsGet, lsSet, STORAGE_PREFIX } from './hafalan-storage'

// Key store (prefix `hh2-` agar ikut terhapus oleh resetDailyProgress).
export const NEMONIK_SRS_KEY = `${STORAGE_PREFIX}-nemonik-srs`
export const NEMONIK_STREAK_KEY = `${STORAGE_PREFIX}-nemonik-streak`

const ONE_DAY = 24 * 60 * 60 * 1000

// ── Data ──
// Cache in-module: data.json ~640KB, cukup di-fetch sekali per sesi.
let _dataPromise = null

export function loadNemonik() {
  if (_dataPromise) return _dataPromise
  _dataPromise = fetch('nemonik/data.json')
    .then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat data nemonik (${r.status})`)
      return r.json()
    })
    .catch((e) => {
      // Biar tidak menyimpan promise gagal selamanya → bisa retry.
      _dataPromise = null
      throw e
    })
  return _dataPromise
}

// Path di data.json relatif (mis. "selesai_potong_opt/001_...webp").
// Aset disajikan dari public/nemonik/ → prefix "nemonik/".
export function imgUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `nemonik/${String(path).replace(/^\/+/, '')}`
}

// ── SRS ──
// Selalu kembalikan objek (tahan localStorage korup: null/array/string).
export const getNemonikSrs = () => {
  const v = lsGet(NEMONIK_SRS_KEY, {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}

const saveNemonikSrs = (srs) => lsSet(NEMONIK_SRS_KEY, srs)

export function defaultSrsEntry() {
  return { status: 'baru', nextReview: 0, interval: 1, ease: 2.5 }
}

// Pastikan setiap entri data punya record SRS. Mengembalikan salinan baru
// (bukan mutasi) supaya aman dipakai React state.
export function ensureSrs(data, srs = getNemonikSrs()) {
  const next = { ...srs }
  let changed = false
  for (const k of data || []) {
    const id = String(k.no)
    if (!next[id]) {
      next[id] = defaultSrsEntry()
      changed = true
    }
  }
  return { srs: next, changed }
}

// Batas interval maksimum (hari) agar interval tak meledak (grade-3 berulang
// bisa mencapai 1e48 hari → kanji "terkunci" selamanya). Spaced-repetition
// praktis tak butuh > ~1 tahun.
const MAX_INTERVAL = 365

// Rating: 1 = Lupa, 2 = Sulit, 3 = Tahu/Mudah (sama seperti app.js asli).
export function gradeNemonik(srs, id, rating) {
  const key = String(id)
  const cur = { ...defaultSrsEntry(), ...(srs[key] || {}) }
  const r = Number(rating)

  if (r === 1) {
    cur.status = 'ulang'
    cur.interval = 1
    cur.ease = Math.max(1.3, cur.ease - 0.2)
  } else if (r === 2) {
    cur.status = 'belajar'
    cur.interval = Math.min(MAX_INTERVAL, Math.max(1, cur.interval * 1.2))
    cur.ease = Math.max(1.3, cur.ease - 0.15)
  } else if (r === 3) {
    cur.status = 'hafal'
    cur.interval = Math.min(MAX_INTERVAL, Math.max(1, cur.interval * cur.ease))
    cur.ease = Math.min(3.5, cur.ease + 0.15)
  } else {
    // Rating tak dikenal → jangan ubah apa pun (hindari interval 'baru' aneh).
    return srs
  }

  cur.nextReview = Date.now() + cur.interval * ONE_DAY
  const next = { ...srs, [key]: cur }
  saveNemonikSrs(next)
  return next
}

// Penalti internal saat salah kuis: turunkan ke 'ulang' (port dari app.js).
export function penalizeNemonik(srs, id) {
  const key = String(id)
  const cur = { ...defaultSrsEntry(), ...(srs[key] || {}) }
  if (cur.status !== 'hafal' && cur.status !== 'belajar') return srs
  cur.status = 'ulang'
  cur.ease = Math.max(1.3, cur.ease - 0.2)
  const next = { ...srs, [key]: cur }
  saveNemonikSrs(next)
  return next
}

// ── Statistik ──
export function nemonikStats(data, srs) {
  const now = Date.now()
  const counts = { baru: 0, belajar: 0, hafal: 0, ulang: 0 }
  let reviewCount = 0
  for (const k of data || []) {
    const s = srs[String(k.no)] || defaultSrsEntry()
    if (s.status in counts) counts[s.status]++
    if (s.status !== 'baru' && (s.nextReview || 0) <= now) reviewCount++
  }
  return { total: (data || []).length, ...counts, reviewCount }
}

// Prediksi kanji "berisiko lupa" dari model SRS yang ada (tanpa data baru).
// Skor risiko naik bila: ease rendah, status 'ulang', dan waktu review lewat.
// Mengembalikan daftar { entry, score } terurut menurun (skor > 0 saja).
export function predictForgetting(data, srs, now = Date.now()) {
  const scored = []
  for (const k of data || []) {
    const s = srs[String(k.no)]
    if (!s || s.status === 'baru') continue
    const ease = s.ease ?? 2.5
    const interval = s.interval ?? 1
    const overdueDays = Math.max(0, (now - (s.nextReview || now)) / ONE_DAY)
    // Risiko dasar: ease rendah + status ulang.
    let score = Math.max(0, 2.5 - ease) * 10
    if (s.status === 'ulang') score += 8
    else if (s.status === 'belajar') score += 3
    // Tambah bila sudah lewat jadwal (makin lama makin berisiko).
    score += Math.min(overdueDays, 14) * 0.8
    // Interval panjang = retensi rapuh (bonus kecil).
    if (interval >= 7) score += 2
    if (score > 0) scored.push({ entry: k, score: Math.round(score * 10) / 10 })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored
}

// ── Streak ──
// Streak Nemonik = jumlah HARI BERTURUT-TURUT ada aktivitas review (bukan sekadar
// membuka halaman). Dihitung dari tanggal log harian. `checkNemonikStreak`
// menyinkronkan streak tersimpan dengan riwayat log (bisa naik/turun-mundur),
// dan di-INJECT `hasToday` agar tak bergantung impor silang.
export function computeNemonikStreak(log, now = new Date()) {
  const today = dayKey(now)
  const has = (d) => (log?.[d]?.reviewed || 0) > 0
  // Mulai dari hari ini bila ada review; kalau belum, mulai dari kemarin
  // (streak tetap "hidup" sampai hari ini dituntaskan).
  const start = has(today) ? 0 : 1
  let streak = 0
  for (let i = start; i <= 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (has(dayKey(d))) streak++
    else break
  }
  return streak
}

// Baca & sinkronkan streak tersimpan dengan riwayat log (`log` dari
// getDailyLog()). Menulis hanya bila nilainya berubah.
export function checkNemonikStreak(log) {
  const streak = computeNemonikStreak(log)
  const saved = lsGet(NEMONIK_STREAK_KEY, null)
  if (saved !== streak) {
    lsSet(NEMONIK_STREAK_KEY, streak)
    return streak
  }
  return streak
}

// ── Util tanggal (lokal file ini, hindari impor berlebih) ──
function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
