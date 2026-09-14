import { pickN, shuffle } from './ui'

// Jawaban bergantung arah: jp2id → arti (backShort); id2jp → kata Jepang (front).
export function answerOf(entry, direction = 'jp2id') {
  return direction === 'id2jp' ? entry.front : entry.backShort
}

// 4 pilihan: 1 benar + 3 penggangu dari pool.
// easyMode=true → pilih pengecoh dari grup berbeda (jawaban jelas berbeda).
export function buildOptions(entry, pool, direction = 'jp2id', easyMode = false) {
  const label = answerOf(entry, direction)
  let candidates = pool.filter((e) => e.id !== entry.id && answerOf(e, direction) !== label)
  if (easyMode) {
    // Prefer distractors from different groups so answers are obviously different
    const diffGroup = candidates.filter((e) => e.groupLabel !== entry.groupLabel)
    if (diffGroup.length >= 3) candidates = diffGroup
  }
  const distract = pickN(candidates, 3)
  const options = [...distract.map((e) => answerOf(e, direction)), label]
  return {
    label,
    options: shuffle(options),
  }
}

// ── Hard mode: pilih pengecoh yang semantik mirip ──
// Heuristik: cari entry dari grup yang sama, atau yang backShort-nya mengandung kata serupa.
export function buildOptionsHard(entry, pool, direction = 'jp2id') {
  const label = answerOf(entry, direction)
  const others = pool.filter((e) => e.id !== entry.id && answerOf(e, direction) !== label)

  // Score similarity: same group > shared words > random
  const words = label.toLowerCase().split(/[\s,/·・()（）]+/).filter((w) => w.length > 1)
  const scored = others.map((e) => {
    const ans = answerOf(e, direction).toLowerCase()
    let s = 0
    if (e.groupLabel && e.groupLabel === entry.groupLabel) s += 3
    for (const w of words) {
      if (ans.includes(w)) s += 2
    }
    // Same material category bonus
    if (e.material === entry.material) s += 1
    return { e, s }
  })

  scored.sort((a, b) => b.s - a.s)
  // Pick top 3, but ensure we have fallbacks
  const picked = scored.slice(0, 3).map((x) => x.e)
  while (picked.length < 3 && others.length > picked.length) {
    const fallback = others.find((e) => !picked.includes(e))
    if (fallback) picked.push(fallback)
    else break
  }

  const options = [...picked.map((e) => answerOf(e, direction)), label]
  return {
    label,
    options: shuffle(options),
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
    options: shuffle(options),
  }
}
