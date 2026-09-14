// Riwayat ujian lokal (localStorage). Pelengkap cloud saveExamResult.
const KEY = 'ankichou-exam-history'

function getExamHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function addExamRecord(record) {
  const list = getExamHistory()
  list.unshift({ ...record, savedAt: Date.now() })
  // Batasi 200 entri terakhir agar tidak membengkak.
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200))) } catch {}
  return list
}
