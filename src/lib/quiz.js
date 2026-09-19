import { shuffle } from './ui'

// Jawaban bergantung arah: jp2id → arti (backShort); id2jp → kata Jepang (front).
export function answerOf(entry, direction = 'jp2id') {
  return direction === 'id2jp' ? entry.front : entry.backShort
}

// Ambil hingga `n` entri pengecoh dengan LABEL UNIK (tak ada label yang sama
// dengan jawaban benar maupun antar-pengecoh). Ini mencegah opsi duplikat →
// tombol ganda & key React tabrakan. Mengembalikan objek entri terpilih.
function pickDistinct(candidates, n, labelOf, excludeLabel) {
  const seen = new Set([excludeLabel])
  const out = []
  for (const e of shuffle(candidates)) {
    const lab = labelOf(e)
    if (lab == null || seen.has(lab)) continue
    seen.add(lab)
    out.push(e)
    if (out.length >= n) break
  }
  return out
}

// 4 pilihan: 1 benar + hingga 3 penggangu unik dari pool.
// easyMode=true → prefer pengecoh dari grup berbeda (jawaban jelas berbeda).
export function buildOptions(entry, pool, direction = 'jp2id', easyMode = false) {
  const label = answerOf(entry, direction)
  const labelOf = (e) => answerOf(e, direction)
  let candidates = pool.filter((e) => e.id !== entry.id && labelOf(e) !== label)
  if (easyMode) {
    const diffGroup = candidates.filter((e) => e.groupLabel !== entry.groupLabel)
    if (diffGroup.length >= 3) candidates = diffGroup
  }
  const distract = pickDistinct(candidates, 3, labelOf, label)
  const options = [...distract.map(labelOf), label]
  return {
    label,
    options: shuffle(options),
  }
}

// ── Hard mode: pilih pengecoh yang semantik mirip ──
// Heuristik: cari entry dari grup yang sama, atau yang backShort-nya mengandung kata serupa.
export function buildOptionsHard(entry, pool, direction = 'jp2id') {
  const label = answerOf(entry, direction)
  const labelOf = (e) => answerOf(e, direction)
  const others = pool.filter((e) => e.id !== entry.id && labelOf(e) !== label)

  // Score similarity: same group > shared words > random
  const words = label.toLowerCase().split(/[\s,/·・()（）]+/).filter((w) => w.length > 1)
  const scored = others.map((e) => {
    const ans = labelOf(e).toLowerCase()
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
  const distract = pickDistinct(scored.map((x) => x.e), 3, labelOf, label)
  const options = [...distract.map(labelOf), label]
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
  const labelOf = (e) => axisAnswerOf(e, axis)
  const distract = pickDistinct(
    pool.filter((e) => e.id !== entry.id && labelOf(e) !== label),
    3,
    labelOf,
    label,
  )
  const options = [...distract.map(labelOf), label]
  return {
    label,
    options: shuffle(options),
  }
}
