// Hafalan Harian — storage helpers & constants

import { publishStoreChange } from './sync-events'

export const HAFALAN_MODES = [
  { key: 'a2', label: 'JFT-A2', kanji: 'A2', kotobaSrc: 'kotoba', kanjiSrc: 'kanji', bunpouSrc: 'bunpo' },
  { key: 'n3', label: 'N3', kanji: 'N3', kotobaSrc: 'kotoba-n3', kanjiSrc: null, bunpouSrc: null },
  { key: 'n2', label: 'N2', kanji: 'N2', kotobaSrc: 'kotoba-n2', kanjiSrc: null, bunpouSrc: null },
  { key: 'n1', label: 'N1', kanji: 'N1', kotobaSrc: 'kotoba-n1', kanjiSrc: null, bunpouSrc: null },
]

export const DEFAULT_TARGETS = {
  a2: { kotoba: 50, kanji: 25, bunpou: 5 },
  n3: { kotoba: 40, kanji: 0, bunpou: 0 },
  n2: { kotoba: 40, kanji: 0, bunpou: 0 },
  n1: { kotoba: 40, kanji: 0, bunpou: 0 },
}

export const STORAGE_PREFIX = 'hh2'
export const REMINDER_HOUR = 21

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
// recall queue, exam history, study history) — dipanggil saat "Reset semua progres".
// SRS card & preferensi di-reset terpisah oleh resetProgress() di lib/storage.
export function resetDailyProgress() {
  const removals = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    if (k.startsWith(`${STORAGE_PREFIX}-`)) removals.push(k) // hh2-*
    else if (k === 'ankichou-exam-history') removals.push(k)
    else if (k === 'hafalan-jft-a2-history-v1') removals.push(k)
  }
  for (const k of removals) {
    try { localStorage.removeItem(k) } catch {}
  }
}

export function computeStreak(history) {
  let streak = 0
  const d = new Date()
  for (let i = 1; i <= 365; i++) {
    const check = new Date(d)
    check.setDate(check.getDate() - i)
    const key = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`
    if (history[key]?.done) streak++
    else break
  }
  const todayEntry = history[todayStr()]
  if (todayEntry?.done) streak++
  return streak
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
