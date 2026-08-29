import { pickN } from './ui'

export function answerOf(entry) {
  return entry.backShort
}

// 4 pilihan: 1 benar + 3 penggangu dari pool (backShort antar entri).
export function buildOptions(entry, pool) {
  const label = answerOf(entry)
  const distract = pickN(
    pool.filter((e) => e.id !== entry.id && answerOf(e) !== label),
    3,
  )
  const options = [...distract.map(answerOf), label]
  return {
    label,
    options: options.sort(() => Math.random() - 0.5),
  }
}