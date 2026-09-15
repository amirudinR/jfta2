// Antrian Recall — item yang belum hafal otomatis dijadwalkan ulang (default: besok).
import { todayStr, lsGet, lsSet } from './hafalan-storage'

const KEY = 'hh2-recall-queue'

function dayStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Geser tanggal 'YYYY-MM-DD' sebanyak n hari.
function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return dayStr(d)
}

function getRecallQueue() {
  return lsGet(KEY, {})
}

// Tambah/segarkan item ke antrian. due = hari ini + daysFromNow (default besok).
export function scheduleRecallItems(items, daysFromNow = 1) {
  const q = getRecallQueue()
  const due = addDays(todayStr(), daysFromNow)
  for (const it of items) {
    const prev = q[it.id]
    q[it.id] = {
      item: {
        id: it.id,
        front: it.front,
        reading: it.reading || '',
        backShort: it.backShort,
        backFull: it.backFull || '',
        groupLabel: it.groupLabel || '',
        category: it.category,
      },
      due,
      wrong: (prev?.wrong || 0) + 1,
      attempts: (prev?.attempts || 0) + 1,
      lastAsked: todayStr(),
    }
  }
  lsSet(KEY, q)
  return q
}

// Buang item yang sudah hafal dari antrian.
export function clearRecallItems(ids) {
  const q = getRecallQueue()
  let changed = false
  for (const id of ids) {
    if (q[id]) { delete q[id]; changed = true }
  }
  if (changed) lsSet(KEY, q)
  return q
}

function allRecallEntries() {
  return Object.values(getRecallQueue())
}

// Item yang sudah jatuh tempo (due <= onDate), paling lama & paling sering salah dulu.
export function dueRecallItems(onDate = todayStr()) {
  return allRecallEntries()
    .filter((e) => e.due <= onDate)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : b.wrong - a.wrong))
    .map((e) => ({ ...e.item, due: e.due, wrong: e.wrong }))
}

// Ringkasan progres antrian.
export function recallStats(onDate = todayStr()) {
  const all = allRecallEntries()
  const byCat = { kotoba: 0, kanji: 0, bunpou: 0 }
  let due = 0
  for (const e of all) {
    if (e.due <= onDate) {
      due++
      byCat[e.item.category] = (byCat[e.item.category] || 0) + 1
    }
  }
  return { total: all.length, due, pending: all.length - due, byCat }
}

// Kategori sebuah id Recall disandikan setelah ':'. Contoh 'b-88:kanji' → 'kanji'.
export const categoryOfId = (id) => String(id).split(':')[1]

// Sebuah kategori dianggap "hafal" bila akurasi >= 80%.
export const PASS_RATE = 0.8

// Statistik hasil sesi per kategori + daftar kategori yang belum lulus.
// order = daftar item yang ditanyakan, ids = id item yang dijawab salah.
export function buildRecallResult(order, ids, cats) {
  const wrongSet = new Set(ids)
  const perCat = {}
  for (const c of cats) {
    const total = order.filter((it) => it.category === c).length
    if (!total) continue
    const wrong = order.filter((it) => it.category === c && wrongSet.has(it.id)).length
    const correct = total - wrong
    const rate = correct / total
    perCat[c] = { total, correct, wrong, rate, passed: rate >= PASS_RATE }
  }
  const notPassed = cats.filter((c) => perCat[c] && !perCat[c].passed)
  return { perCat, notPassed }
}
