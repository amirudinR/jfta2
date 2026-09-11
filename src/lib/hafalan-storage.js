// Hafalan Harian — storage helpers & constants

export const HAFALAN_MODES = [
  { key: 'a2', label: 'JFT-A2', kanji: 'A2', kotobaSrc: 'kotoba', kanjiSrc: 'kanji' },
  { key: 'n3', label: 'N3', kanji: 'N3', kotobaSrc: 'kotoba-n3', kanjiSrc: null },
  { key: 'n2', label: 'N2', kanji: 'N2', kotobaSrc: 'kotoba-n2', kanjiSrc: null },
  { key: 'n1', label: 'N1', kanji: 'N1', kotobaSrc: 'kotoba-n1', kanjiSrc: null },
]

export const DEFAULT_TARGETS = {
  a2: { kotoba: 50, kanji: 25 },
  n3: { kotoba: 40, kanji: 0 },
  n2: { kotoba: 40, kanji: 0 },
  n1: { kotoba: 40, kanji: 0 },
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
}

export const getTargets = () => lsGet(`${STORAGE_PREFIX}-targets`, DEFAULT_TARGETS)
export const setTargets = (v) => lsSet(`${STORAGE_PREFIX}-targets`, v)

export const getHistory = (mode) => lsGet(`${STORAGE_PREFIX}-hist-${mode}`, {})

export function flushToHistory(mode, dayData) {
  if (!dayData?.date) return
  const targets = getTargets()
  const t = targets[mode] || DEFAULT_TARGETS[mode]
  const hist = getHistory(mode)
  const kc = Object.values(dayData.kotoba || {}).filter(Boolean).length
  const jc = Object.values(dayData.kanji || {}).filter(Boolean).length
  const targetKanji = t.kanji || 0
  hist[dayData.date] = { kotoba: kc, kanji: jc, done: kc >= t.kotoba && (targetKanji === 0 || jc >= targetKanji) }
  lsSet(`${STORAGE_PREFIX}-hist-${mode}`, hist)
}

export function saveHistoryNow(mode, checked) {
  const targets = getTargets()
  const t = targets[mode] || DEFAULT_TARGETS[mode]
  const hist = getHistory(mode)
  const kc = Object.values(checked.kotoba || {}).filter(Boolean).length
  const jc = Object.values(checked.kanji || {}).filter(Boolean).length
  const targetKanji = t.kanji || 0
  hist[checked.date] = { kotoba: kc, kanji: jc, done: kc >= t.kotoba && (targetKanji === 0 || jc >= targetKanji) }
  lsSet(`${STORAGE_PREFIX}-hist-${mode}`, hist)
}

export function getChecked(mode) {
  const data = lsGet(`${STORAGE_PREFIX}-checked-${mode}`, { date: todayStr(), kotoba: {}, kanji: {} })
  if (data.date !== todayStr()) {
    flushToHistory(mode, data)
    const fresh = { date: todayStr(), kotoba: {}, kanji: {} }
    lsSet(`${STORAGE_PREFIX}-checked-${mode}`, fresh)
    return fresh
  }
  return data
}

export const setCheckedStorage = (mode, data) => lsSet(`${STORAGE_PREFIX}-checked-${mode}`, data)

export const getCustom = (mode) => lsGet(`${STORAGE_PREFIX}-custom-${mode}`, { kotoba: [], kanji: [] })
export const setCustomStorage = (mode, data) => lsSet(`${STORAGE_PREFIX}-custom-${mode}`, data)

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

export function speak(text) {
  if (!window.speechSynthesis) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'; u.rate = 0.85
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}
