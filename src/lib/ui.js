// Bantuan kecil untuk tampilan.

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickN(arr, n) {
  return shuffle(arr).slice(0, n)
}

export function fmtInterval(days, reps) {
  if (!reps && !days) return 'Baru'
  if (days <= 0) return 'Lupa'
  if (days < 21) return `${days} hr`
  return `${days} hr ✓`
}

export function fmtDue(dueMs) {
  const now = new Date()
  const due = new Date(dueMs)
  const diffDays = Math.ceil((due - now) / (24 * 3600 * 1000))
  if (diffDays <= 0) return 'Hari ini'
  if (diffDays === 1) return 'Besok'
  return `${diffDays} hari lagi`
}

export function clsx(...parts) {
  return parts.filter(Boolean).join(' ')
}