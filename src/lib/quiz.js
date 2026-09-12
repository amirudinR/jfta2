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

// ── Ujian Harian: soal memakai satu "sumbu" pertanyaan ──
// axis 'kanji':   tanya kata Jepang (front)   → jawab arti (backShort)
// axis 'hiragana': tanya cara baca (reading)   → jawab arti (backShort)
// axis 'arti':    tanya arti (backShort)       → jawab kata (front)
export function axisQuestionOf(entry, axis) {
  if (axis === 'arti') return entry.backShort
  if (axis === 'hiragana') return entry.reading || entry.frontSub || entry.front
  return entry.front
}

export function axisAnswerOf(entry, axis) {
  if (axis === 'arti') return entry.front
  return entry.backShort
}

export function buildOptionsAxis(entry, pool, axis) {
  const label = axisAnswerOf(entry, axis)
  const distract = pickN(
    pool.filter((e) => e.id !== entry.id && axisAnswerOf(e, axis) !== label),
    3,
  )
  const options = [...distract.map((e) => axisAnswerOf(e, axis)), label]
  return {
    label,
    options: options.sort(() => Math.random() - 0.5),
  }
}
