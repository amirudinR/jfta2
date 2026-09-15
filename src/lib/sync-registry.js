// sync-registry — daftar "store" yang ikut disinkronkan Firestore.
// Offline-first: localStorage tetap sumber utama; cloud = mirror live.
//
// Setiap store = { key, path(uid), merge(local, cloud, meta) }
// Doc cloud punya bentuk { data, updated (epoch ms), syncedAt (server) }.
// Doc progress/main memakai bentuk lamanya (perMaterial/prefs/tombstone/...)
// dan merge lama (mergeProgress).

import { HAFALAN_MODES } from './hafalan-storage'

// ── Merge helpers ──
// Last-writer-wins utuh: dokumen dgn `updated` terbaru menang.
function lww(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  return (cloud.updated || 0) > (local.updated || 0) ? cloud : local
}

// checked{date,kotoba,kanji,bunpou}: kalau tanggal sama → gabung per id (aman
// dipakai 2 perangkat sekaligus). Kalau tanggal beda → yg lebih baru menang
// (menghormati reset tengah malam).
function mergeChecked(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  if ((local.date || '') !== (cloud.date || '')) return lww(local, cloud)
  const merge = (a, b) => ({ ...(a || {}), ...(b || {}) })
  return {
    ...lww(local, cloud),
    date: local.date,
    kotoba: merge(local.kotoba, cloud.kotoba),
    kanji: merge(local.kanji, cloud.kanji),
    bunpou: merge(local.bunpou, cloud.bunpou),
    updated: Math.max(local.updated || 0, cloud.updated || 0),
  }
}

// custom{kotoba[],kanji[],bunpou[]}: gabung per id (item custom punya id
// stabil `cc-*`), urutan lokal dipertahankan lalu tambahan dari cloud disisip.
function mergeCustom(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  const byId = (list) => new Map((list || []).map((it) => [it.id, it]))
  const mergeList = (a, b) => {
    const m = byId(a)
    for (const it of b || []) if (!m.has(it.id)) a.push(it)
    return a
  }
  return {
    kotoba: mergeList([...(local.kotoba || [])], cloud.kotoba),
    kanji: mergeList([...(local.kanji || [])], cloud.kanji),
    bunpou: mergeList([...(local.bunpou || [])], cloud.bunpou),
    updated: Math.max(local.updated || 0, cloud.updated || 0),
  }
}

// history / hari `{ 'YYYY-MM-DD': record }`: gabung union semua hari; hari yg
// bentrok → sisi dokumen dengan `updated` terbaru menang. Hari yang cuma ada
// di sisi lama tetap dipertahankan (append-mostly).
function mergeDays(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  const cloudNewer = (cloud.updated || 0) > (local.updated || 0)
  const winner = cloudNewer ? cloud : local
  const loser = cloudNewer ? local : cloud
  const out = { ...loser }
  for (const [k, v] of Object.entries(winner)) {
    if (k === 'updated') continue
    out[k] = v
  }
  out.updated = Math.max(local.updated || 0, cloud.updated || 0)
  return out
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
  ...dynamic(
    (m) => `hh2-checked-${m}`,
    (m) => `users/${uid}/hh/checked/${m}`,
    mergeChecked,
  ),
  ...dynamic(
    (m) => `hh2-hist-${m}`,
    (m) => `users/${uid}/hh/history/${m}`,
    mergeDays,
  ),
  ...dynamic(
    (m) => `hh2-custom-${m}`,
    (m) => `users/${uid}/hh/custom/${m}`,
    mergeCustom,
  ),
]

export function storeByKey(key) {
  return SYNC_STORES.find((s) => s.key === key)
}