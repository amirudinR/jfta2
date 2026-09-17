// Hafalan Harian — storage helpers & constants

import { publishStoreChange } from './sync-events'

export const HAFALAN_MODES = [
  { key: 'a2', label: 'JFT-A2', kanji: 'A2', kotobaSrc: 'kotoba', kanjiSrc: 'kanji', bunpouSrc: 'bunpo' },
  { key: 'n3', label: 'N3', kanji: 'N3', kotobaSrc: 'kotoba-n3', kanjiSrc: 'kanji-n3', bunpouSrc: 'bunpo-n3' },
  { key: 'n2', label: 'N2', kanji: 'N2', kotobaSrc: 'kotoba-n2', kanjiSrc: 'kanji-n2', bunpouSrc: 'bunpo-n2' },
  { key: 'n1', label: 'N1', kanji: 'N1', kotobaSrc: 'kotoba-n1', kanjiSrc: 'kanji-n1', bunpouSrc: 'bunpo-n1' },
]

export const modeInfoOf = (key) => HAFALAN_MODES.find((m) => m.key === key)

export const DEFAULT_TARGETS = {
  a2: { kotoba: 50, kanji: 25, bunpou: 5 },
  // N3: kosakata lebih banyak, kanji & bunpou mulai intens (level menengah).
  n3: { kotoba: 40, kanji: 20, bunpou: 5 },
  // N2: beban kanji lebih besar, bunpou lebih padat.
  n2: { kotoba: 40, kanji: 25, bunpou: 6 },
  // N1: kanji & kosakata paling berat.
  n1: { kotoba: 45, kanji: 30, bunpou: 6 },
}

// Aturan backfill: mundur maksimal sekian hari untuk melengkapi tanggal lampau.
// Streak dihitung dari tanggal asli (bukan kapan dikerjakan), jadi batas ini
// mencegah "curang" mengisi semua tanggal kosong jauh ke belakang.
export const MAX_BACKFILL_DAYS = 7
// Batas mencicil ke depan (mengerjakan jatah hari mendatang).
export const MAX_FORWARD_DAYS = 7

export const STORAGE_PREFIX = 'hh2'
export const REMINDER_HOUR = 21

export function dayStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayStr() {
  return dayStr(new Date())
}

// Geser tanggal 'YYYY-MM-DD' sebanyak n hari (boleh negatif).
export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return dayStr(d)
}

// Selisih hari (b - a) untuk dua string 'YYYY-MM-DD'.
export function diffDays(a, b) {
  return Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000)
}

// Tanggal relatif terhadap hari ini: -1 kemarin, 0 hari ini, 1 besok, dst.
export const relDate = (offset) => addDays(todayStr(), offset)

export const isToday = (dateStr) => dateStr === todayStr()
export const isPast = (dateStr) => dateStr < todayStr()
export const isFuture = (dateStr) => dateStr > todayStr()

export const lsGet = (k, fallback) => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fallback }
  catch { return fallback }
}

export const lsSet = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
  // Beri sinyal perubahan lokal → engine live-sync kirim ke cloud (kalau online).
  publishStoreChange(k)
}

export const getTargets = () => lsGet(`${STORAGE_PREFIX}-targets`, DEFAULT_TARGETS)
export const setTargets = (v) => lsSet(`${STORAGE_PREFIX}-targets`, v)

export const getHistory = (mode) => lsGet(`${STORAGE_PREFIX}-hist-${mode}`, {})

function isDone(dayData, t) {
  const kc = Object.values(dayData.kotoba || {}).filter(Boolean).length
  const jc = Object.values(dayData.kanji || {}).filter(Boolean).length
  const bc = Object.values(dayData.bunpou || {}).filter(Boolean).length
  return kc >= t.kotoba
    && ((!t.kanji) || jc >= t.kanji)
    && ((!t.bunpou) || bc >= t.bunpou)
}

function idsOf(map) {
  return Object.keys(map || {}).filter((k) => map[k])
}

function historyRecord(dayData) {
  const targets = getTargets()
  const t = targets[dayData.mode] || DEFAULT_TARGETS[dayData.mode]
  return {
    kotoba: Object.values(dayData.kotoba || {}).filter(Boolean).length,
    kanji: Object.values(dayData.kanji || {}).filter(Boolean).length,
    bunpou: Object.values(dayData.bunpou || {}).filter(Boolean).length,
    done: isDone(dayData, t),
    items: {
      kotoba: idsOf(dayData.kotoba),
      kanji: idsOf(dayData.kanji),
      bunpou: idsOf(dayData.bunpou),
    },
  }
}

export function flushToHistory(mode, dayData) {
  if (!dayData?.date) return
  const hist = getHistory(mode)
  hist[dayData.date] = historyRecord({ ...dayData, mode })
  lsSet(`${STORAGE_PREFIX}-hist-${mode}`, hist)
}

export function saveHistoryNow(mode, checked) {
  const hist = getHistory(mode)
  hist[checked.date] = historyRecord({ ...checked, mode })
  lsSet(`${STORAGE_PREFIX}-hist-${mode}`, hist)
}

export function getChecked(mode) {
  const data = lsGet(`${STORAGE_PREFIX}-checked-${mode}`, { date: todayStr(), kotoba: {}, kanji: {}, bunpou: {} })
  if (data.date !== todayStr()) {
    flushToHistory(mode, data)
    const fresh = { date: todayStr(), kotoba: {}, kanji: {}, bunpou: {} }
    lsSet(`${STORAGE_PREFIX}-checked-${mode}`, fresh)
    return fresh
  }
  // ponytail: migrate old checked without bunpou key
  if (!data.bunpou) data.bunpou = {}
  return data
}

export const setCheckedStorage = (mode, data) => lsSet(`${STORAGE_PREFIX}-checked-${mode}`, data)

const emptyDay = (date) => ({ date, kotoba: {}, kanji: {}, bunpou: {} })

// Ambil data centang untuk tanggal mana pun (fleksibel: kemarin/besok).
// - hari ini  → bucket hidup `hh2-checked-*`
// - masa lalu → entri riwayat (`hh2-hist-*`), boleh diperbaiki lagi (melengkapi)
// - masa depan→ entri riwayat (dicicil lebih awal), dibuatkan bila belum ada
export function getCheckedForDate(mode, date) {
  if (date === todayStr()) {
    const c = getChecked(mode)
    return { date, kotoba: { ...c.kotoba }, kanji: { ...c.kanji }, bunpou: { ...c.bunpou } }
  }
  const rec = getHistory(mode)[date]
  if (!rec?.items) return emptyDay(date)
  return { date, ...itemsToMaps(rec.items) }
}

// items riwayat berupa daftar id → ubah ke bentuk map {id:true}.
function itemsToMaps(items) {
  const toMap = (list) => Object.fromEntries((list || []).map((id) => [id, true]))
  return { kotoba: toMap(items.kotoba), kanji: toMap(items.kanji), bunpou: toMap(items.bunpou) }
}

// Simpan centang untuk tanggal tertentu.
// - hari ini  → tulis live bucket + segarkan riwayat hari ini.
// - tanggal lain (kemarin/besok) → tulis entri riwayat tanggal tsb.
// Guard terakhir: tolak tanggal di luar rentang backfill/maju yang diizinkan,
// agar streak & heatmap tetap akurat dan tidak bisa dimanipulasi jauh.
export function setCheckedForDate(mode, data) {
  if (!isEditableDate(data?.date)) return
  if (data.date === todayStr()) {
    setCheckedStorage(mode, data)
    saveHistoryNow(mode, data)
    return
  }
  const hist = getHistory(mode)
  hist[data.date] = historyRecord({ ...data, mode })
  lsSet(`${STORAGE_PREFIX}-hist-${mode}`, hist)
}

export const getCustom = (mode) => lsGet(`${STORAGE_PREFIX}-custom-${mode}`, { kotoba: [], kanji: [], bunpou: [] })
export const setCustomStorage = (mode, data) => lsSet(`${STORAGE_PREFIX}-custom-${mode}`, data)

// Id custom yang stabil — tidak berbasis indeks, jadi hapus item di tengah
// daftar tidak menggeser referensi centang/riwayat/ujian harian.
let customSeq = 0
export function newCustomId() {
  customSeq += 1
  return `cc-${Date.now().toString(36)}-${customSeq}`
}

// Reset semua data harian/riwayat (checked, history, custom, targets, mastery,
// recall queue, exam history, study history, meta sync) — dipanggil saat
// "Reset semua progres". SRS card & preferensi di-reset terpisah oleh
// resetProgress() di lib/storage.
// Catatan: `hh2-*` (termasuk `hh2-sync-meta`) ikut terhapus lewat prefix, jadi
// fingerprint anti-echo tidak stale dan state bersih ikut ter-push ke cloud.
export function resetDailyProgress() {
  const removals = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    if (k.startsWith(`${STORAGE_PREFIX}-`)) removals.push(k) // hh2-*
    else if (k === 'ankichou-exam-history') removals.push(k)
    else if (k === 'hafalan-jft-a2-history-v1') removals.push(k)
    else if (k === 'ankichou-level') removals.push(k)
  }
  for (const k of removals) {
    try { localStorage.removeItem(k) } catch {}
  }
}

// Streak dihitung dari TANGGAL ASLI (bukan kapan pengerjaan) — konsisten dengan
// riwayat/heatmap. Karena melengkapi mundur dibatasi MAX_BACKFILL_DAYS, orang
// tidak bisa "curang" mengisi seluruh tanggal kosong jauh ke belakang.
export function computeStreak(history) {
  const today = todayStr()
  if (!history[today]?.done) {
    // Hari ini belum dituntaskan — streak yang masih "hidup" = kemarin dst.
    // (Tidak menghitung hari ini supaya angka tidak terlihat dobel.)
    let past = 0
    for (let i = 1; i <= 365; i++) {
      if (history[addDays(today, -i)]?.done) past++
      else break
    }
    return past
  }
  // Hari ini done → hitung mundur dari hari ini memakai basis tanggal yang sama
  // (`todayStr`/`addDays`) agar tak beda zona/midnight dengan sumber lain.
  let streak = 1
  for (let i = 1; i <= 365; i++) {
    if (history[addDays(today, -i)]?.done) streak++
    else break
  }
  return streak
}

// Bolehkah menulis centang untuk tanggal `date`? Hari ini bebas; masa lalu
// dibatasi MAX_BACKFILL_DAYS; masa depan dibatasi MAX_FORWARD_DAYS.
export function isEditableDate(date) {
  if (!date) return false
  const rel = diffDays(todayStr(), date)
  return rel >= -MAX_BACKFILL_DAYS && rel <= MAX_FORWARD_DAYS
}

// ── Persistent mastery (shared between Hafalan Harian & Daftar Materi) ──
// Key: hh2-mastered  Value: { [modeKey]: { kotoba: {id: true}, kanji: {}, bunpou: {} } }
export const getMastered = () => lsGet(`${STORAGE_PREFIX}-mastered`, {})
export const setMasteredStorage = (v) => lsSet(`${STORAGE_PREFIX}-mastered`, v)

export function toggleMastered(modeKey, category, id) {
  const all = getMastered()
  if (!all[modeKey]) all[modeKey] = {}
  if (!all[modeKey][category]) all[modeKey][category] = {}
  if (all[modeKey][category][id]) delete all[modeKey][category][id]
  else all[modeKey][category][id] = true
  setMasteredStorage(all)
  return all
}

export function countMastered(modeKey, category) {
  const all = getMastered()
  return Object.keys(all[modeKey]?.[category] || {}).length
}
