// sync-registry — daftar "store" yang ikut disinkronkan Firestore.
// Offline-first: localStorage tetap sumber utama; cloud = mirror live.
//
// Setiap store = { key, path(uid), merge(local, cloud) }.
// Doc cloud punya bentuk { data, updated (epoch ms), syncedAt (server) }.
// `merge(local, cloud)` menerima & mengembalikan wrapper `{ data, updated }`
// (lihat kontrak di bawah) — hasilnya dibaca live-sync lewat `.data`.
// Doc progress/main memakai bentuk lamanya (perMaterial/prefs/tombstone/...)
// dan merge lama (mergeProgress).

import { HAFALAN_MODES } from './hafalan-storage'

// ── Merge helpers ──
// KONTRAK (dipakai live-sync.js applyCloud):
//   store.merge(local, cloud) dengan local = { data, updated } & cloud = { data, updated },
//   dan WAJIB mengembalikan { data, updated } — live-sync membaca hasilnya via `.data`
//   lalu menulis `data` itu ke localStorage. Jangan kembalikan bentuk mentah store
//   (mis. { kotoba, kanji }) atau kontraknya rusak dan data bisa tertimpa `undefined`.
//
// Helper internal `unwrap`/`wrap` menjaga kontrak ini seragam untuk semua store.

// Terima wrapper { data, updated } atau nilai mentah → { data, updated }.
function unwrap(v) {
  if (v && typeof v === 'object' && 'data' in v) {
    return { data: v.data, updated: v.updated || 0 }
  }
  return { data: v, updated: 0 }
}

function wrap(data, updated) {
  return { data, updated }
}

// Last-writer-wins utuh: sisi dengan `updated` terbaru menang.
function lww(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  const l = unwrap(local)
  const c = unwrap(cloud)
  return (c.updated || 0) > (l.updated || 0) ? wrap(c.data, c.updated) : wrap(l.data, l.updated)
}

// checked{date,kotoba,kanji,bunpou}: kalau tanggal sama → gabung per id (aman
// dipakai 2 perangkat sekaligus). Kalau tanggal beda → yg lebih baru menang
// (menghormati reset tengah malam).
function mergeChecked(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  const l = unwrap(local)
  const c = unwrap(cloud)
  // Reset menang: bucket lokal punya `resetAt` lebih baru dari cloud → buang
  // centang lama cloud (jangan dihidupkan lagi).
  if (l.data?.resetAt && l.data.resetAt >= (c.updated || 0)) {
    const { resetAt, ...clean } = l.data
    return wrap(clean, l.updated || resetAt)
  }
  if ((l.data?.date || '') !== (c.data?.date || '')) {
    return (c.updated || 0) > (l.updated || 0) ? wrap(c.data, c.updated) : wrap(l.data, l.updated)
  }
  const merge = (a, b) => ({ ...(a || {}), ...(b || {}) })
  const updated = Math.max(l.updated || 0, c.updated || 0)
  const winner = (c.updated || 0) > (l.updated || 0) ? c.data : l.data
  return wrap({
    ...(winner || {}),
    date: l.data?.date,
    kotoba: merge(l.data?.kotoba, c.data?.kotoba),
    kanji: merge(l.data?.kanji, c.data?.kanji),
    bunpou: merge(l.data?.bunpou, c.data?.bunpou),
  }, updated)
}

// custom{kotoba[],kanji[],bunpou[]}: gabung per id (item custom punya id
// stabil `cc-*`), urutan lokal dipertahankan lalu tambahan dari cloud disisip.
function mergeCustom(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  const l = unwrap(local)
  const c = unwrap(cloud)
  // Reset menang: lokal punya `resetAt` lebih baru → jangan sisipkan item lama cloud.
  if (l.data?.resetAt && l.data.resetAt >= (c.updated || 0)) {
    return wrap({ kotoba: [], kanji: [], bunpou: [] }, l.updated || l.data.resetAt)
  }
  const byId = (list) => new Map((list || []).map((it) => [it.id, it]))
  const mergeList = (a, b) => {
    const m = byId(a)
    for (const it of b || []) if (!m.has(it.id)) a.push(it)
    return a
  }
  const updated = Math.max(l.updated || 0, c.updated || 0)
  return wrap({
    kotoba: mergeList([...(l.data?.kotoba || [])], c.data?.kotoba),
    kanji: mergeList([...(l.data?.kanji || [])], c.data?.kanji),
    bunpou: mergeList([...(l.data?.bunpou || [])], c.data?.bunpou),
  }, updated)
}

// history / hari `{ 'YYYY-MM-DD': record }`: gabung union semua hari; hari yg
// bentrok → sisi dokumen dengan `updated` terbaru menang. Hari yang cuma ada
// di sisi lama tetap dipertahankan (append-mostly).
function mergeDays(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  const l = unwrap(local)
  const c = unwrap(cloud)
  // Reset menang: lokal punya `resetAt` lebih baru → buang seluruh hari lama
  // cloud (unìon tak bisa menghapus key, jadi harus eksplisit).
  if (l.data?.resetAt && l.data.resetAt >= (c.updated || 0)) {
    const { resetAt, ...clean } = l.data
    return wrap(clean, l.updated || resetAt)
  }
  const cloudNewer = (c.updated || 0) > (l.updated || 0)
  const winner = cloudNewer ? c.data : l.data
  const loser = cloudNewer ? l.data : c.data
  const out = { ...(loser || {}) }
  for (const [k, v] of Object.entries(winner || {})) out[k] = v
  return wrap(out, Math.max(l.updated || 0, c.updated || 0))
}

// ── Registry ──
// Semua key localStorage yang disync. dynamic() memperluas mode a2/n3/n2/n1.
const dynamic = (key, path, merge) =>
  HAFALAN_MODES.map((m) => ({ key: key(m.key), path: (uid) => path(uid, m.key), merge }))

export const SYNC_STORES = [
  // progres SRS (bentuk lama, merge lama) — diurus mergeProgress dari cloud-sync
  {
    key: 'hafalan-jft-a2-progress-v2',
    path: (uid) => `users/${uid}/progress/main`,
    // handler khusus di live-sync (mergeProgress), path berbasis dokumen.
    legacy: true,
  },
  { key: 'hh2-targets', path: (uid) => `users/${uid}/hh/targets`, merge: lww },
  { key: 'hh2-mastered', path: (uid) => `users/${uid}/hh/mastered`, merge: lww },
  { key: 'hh2-recall-queue', path: (uid) => `users/${uid}/hh/recall-queue`, merge: lww },
  { key: 'ankichou-exam-history', path: (uid) => `users/${uid}/hh/exam-history`, merge: lww },
  { key: 'hafalan-jft-a2-history-v1', path: (uid) => `users/${uid}/hh/study-history`, merge: lww },
  { key: 'ankichou-level', path: (uid) => `users/${uid}/hh/level`, merge: lww },
  // Nemonik Kanji (SRS terpisah dari SRS utama) — LWW: doc dengan `updated`
  // terbaru menang (paling sering hanya 1 perangkat yang belajar nemonik).
  { key: 'hh2-nemonik-srs', path: (uid) => `users/${uid}/hh/nemonik-srs`, merge: lww },
  { key: 'hh2-nemonik-streak', path: (uid) => `users/${uid}/hh/nemonik-streak`, merge: lww },
  // Log harian (union per tanggal) & riwayat sesi (daftar; sisi terbaru menang).
  { key: 'hh2-nemonik-daily-log', path: (uid) => `users/${uid}/hh/nemonik-daily-log`, merge: mergeDays },
  { key: 'hh2-nemonik-sessions', path: (uid) => `users/${uid}/hh/nemonik-sessions`, merge: lww },
  // Achievement/XP Nemonik.
  { key: 'hh2-nemonik-achievements', path: (uid) => `users/${uid}/hh/nemonik-achievements`, merge: lww },
  ...dynamic(
    (m) => `hh2-checked-${m}`,
    (u, mk) => `users/${u}/hh/checked-${mk}`,
    mergeChecked,
  ),
  ...dynamic(
    (m) => `hh2-hist-${m}`,
    (u, mk) => `users/${u}/hh/history-${mk}`,
    mergeDays,
  ),
  ...dynamic(
    (m) => `hh2-custom-${m}`,
    (u, mk) => `users/${u}/hh/custom-${mk}`,
    mergeCustom,
  ),
]

export function storeByKey(key) {
  return SYNC_STORES.find((s) => s.key === key)
}
