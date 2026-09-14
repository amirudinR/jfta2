import { isMastered } from './srs'

export function bucket(list, cards) {
  let started = 0
  let mastered = 0
  let learning = 0
  let newCards = 0
  const dues = []
  for (const e of list) {
    const c = cards[e.id]
    if (!c) continue
    started++
    dues.push(c.due)
    if (isMastered(c)) mastered++
    else if (c.interval > 0) learning++
    else if (c.reps === 0) newCards++
  }
  return {
    started,
    mastered,
    learning,
    newCards,
    nextDue: dues.length ? Math.min(...dues) : null,
  }
}
