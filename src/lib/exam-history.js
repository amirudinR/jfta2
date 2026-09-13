// Riwayat ujian lokal (localStorage). Pelengkap cloud saveExamResult.
const KEY = 'ankichou-exam-history'

const safeGet = (k, fallback) => {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fallback }
  catch { return fallback }
}

const safeSet = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

export function getExamHistory() {
  const list = safeGet(KEY, [])
  return Array.isArray(list) ? list : []
}

export function addExamRecord(record) {
  const list = getExamHistory()
  list.unshift({ ...record, savedAt: Date.now() })
  // Batasi 200 entri terakhir agar tidak membengkak.
  safeSet(KEY, list.slice(0, 200))
  return list
}

export function clearExamHistory() {
  try { localStorage.removeItem(KEY) } catch {}
}
