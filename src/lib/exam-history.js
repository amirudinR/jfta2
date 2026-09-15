// Riwayat ujian lokal (localStorage). Pelengkap cloud saveExamResult.
import { publishStoreChange } from './sync-events'

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
  publishStoreChange(KEY)
  return list
}

// Susun objek hasil ujian siap simpan (lokal + cloud).
export function buildExamResult({
  score,
  total,
  category,
  difficulty,
  difficultyLabel = '',
  level,
  wrongCount,
}) {
  return {
    score,
    total,
    category,
    difficulty,
    difficultyLabel,
    level,
    wrongCount,
    date: new Date().toISOString(),
  }
}
