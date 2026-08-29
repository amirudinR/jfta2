import { pickN } from './ui'

// Jawaban bergantung arah: jp2id → arti (backShort); id2jp → kata Jepang (front).
export function answerOf(entry, direction = 'jp2id') {
  return direction === 'id2jp' ? entry.front : entry.backShort
}

// 4 pilihan: 1 benar + 3 penggangu dari pool.
export function buildOptions(entry, pool, direction = 'jp2id') {
  const label = answerOf(entry, direction)
  const distract = pickN(
    pool.filter((e) => e.id !== entry.id && answerOf(e, direction) !== label),
    3,
  )
  const options = [...distract.map((e) => answerOf(e, direction)), label]
  return {
    label,
    options: options.sort(() => Math.random() - 0.5),
  }
}
