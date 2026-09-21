// live-sync — engine sinkronisasi Firestore live (offline-first).
//
// localStorage tetap sumber utama (app jalan offline penuh). Saat user login
// (Google) & online:
//   - setiap perubahan lokal → push debounce ke Firestore
//   - onSnapshot tiap doc → perubahan dari perangkat lain diterapkan live,
//     tanpa reload (dispatchSyncApplied → komponen baca ulang localStorage)
//
// Anti-loop: fingerprint payload terakhir yang dikirim disimpan di
// `hh2-sync-meta`; snapshot yang cocok = tulisan kita sendiri → diabaikan.

import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { SYNC_STORES, storeByKey } from './sync-registry'
import { mergeProgress } from './cloud-sync'
import { saveProgress, invalidateProgressCache } from './storage'
import { onStoreChanged, dispatchSyncApplied } from './sync-events'

const META_KEY = 'hh2-sync-meta'
// Penanda pemilik data lokal (uid terakhir yang sinkron). Dipakai untuk
// mendeteksi pergantian akun di device yang sama → bersihkan store lokal agar
// user baru tidak melihat data user lama sebelum snapshot cloud-nya datang.
const OWNER_KEY = 'hh2-sync-owner'
const PUSH_DEBOUNCE_MS = 1500

const lsGet = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb } catch { return fb } }
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

function getMeta() { return lsGet(META_KEY, {}) }
function setMeta(m) { lsSet(META_KEY, m) }

function readLocal(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null } catch { return null }
}
function writeLocal(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
}

// Normalisasi snapshot cloud → { data, updated }.
function cloudOf(store, snap) {
  if (snap.empty || !snap.exists()) return null
  const d = snap.data() || {}
  if (store.legacy) {
    return {
      data: d,
      updated: Number(d.updated) || (d.syncedAt && d.syncedAt.toMillis ? d.syncedAt.toMillis() : 0),
    }
  }
  return { data: d.data ?? null, updated: Number(d.updated) || 0 }
}

// ── State engine (satu instance aktif) ──
let uid = null
let running = false
// P3/P4: peta key→unsub agar bisa pasang/lepas SELECTIF per scope. Sebelumnya
// `unsubs` = Set buta semua store; kini kita tahu listener mana milik store mana
// sehingga gating level/nemonik bisa melepas tanpa mengganggu yang lain.
const attached = new Map()
const dirty = new Set()
let timer = null
let stopLocalWatch = null
// Level dinamis yang sedang terpasang (a2/n3/n2/n1) & status listener nemonik.
let attachedLevel = null
let nemonikAttached = false

// Baca level aktif dari localStorage tanpa import (hindari circular dep ke
// hafalan-storage). Nilai tak dikenal → 'a2' (default app).
function readActiveLevel() {
  try {
    const r = localStorage.getItem('ankichou-level')
    const v = r ? JSON.parse(r) : null
    return ['a2', 'n3', 'n2', 'n1'].includes(v) ? v : 'a2'
  } catch { return 'a2' }
}

// Store ini termasuk scope yang sedang aktif? (static selalu.)
function isStoreActive(store) {
  const scope = store.scope || 'static'
  if (scope === 'static') return true
  if (scope === 'nemonik') return nemonikAttached
  if (scope === 'level') return store.level === attachedLevel
  return true
}

function attachStore(store) {
  if (!running || !uid) return
  if (attached.has(store.key)) return // sudah terpasang → jangan dobel
  const ref = doc(db, store.path(uid))
  const un = onSnapshot(
    ref,
    (snap) => applyCloud(store, cloudOf(store, snap)),
    (err) => console.warn('[live-sync] Snapshot error:', store.key, err?.message),
  )
  attached.set(store.key, un)
}

function detachStore(key) {
  const un = attached.get(key)
  if (!un) return
  try { un() } catch {}
  attached.delete(key)
}

// Terapkan scope store terhadap state level/nemonik saat ini: pasang yang aktif,
// lepas yang tidak. Dipanggil start & tiap setSyncLevel/setSyncNemonik.
function applyScopes() {
  for (const store of SYNC_STORES) {
    if (isStoreActive(store)) attachStore(store)
    else detachStore(store.key)
  }
}

function flushNow() {
  if (dirty.size) flushDirty()
}
const onWindowOnline = () => flushNow()
const onVisibility = () => { if (document.visibilityState === 'visible') flushNow() }

function scheduleFlush() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(flushDirty, PUSH_DEBOUNCE_MS)
}

function flushDirty() {
  timer = null
  if (!running || !uid || dirty.size === 0) return
  const keys = [...dirty]
  dirty.clear()
  for (const key of keys) {
    const store = storeByKey(key)
    if (!store) continue
    pushStore(store)
  }
}

function pushStore(store) {
  // Guard: uid bisa jadi null bila stopLiveSync() jalan di sela debounce
  // (mis. logout) — jangan push ke path `users/null/...`.
  if (!running || !uid) return
  const raw = readLocal(store.key)
  if (raw == null) return
  const meta = getMeta()
  const now = Date.now()
  const payload = store.legacy
    ? { ...raw, syncedAt: serverTimestamp() }
    : { data: raw, updated: now, syncedAt: serverTimestamp() }
  const fingerprint = JSON.stringify(raw)
  try {
    setDoc(doc(db, store.path(uid)), payload, store.legacy ? { merge: true } : {})
      .then(() => {
        meta[store.key] = {
          // Samakan dengan cloud.updated (T1) agar meta konsisten & echo rapi.
          updated: store.legacy ? raw.updated || now : now,
          fingerprint,
        }
        setMeta(meta)
      })
      .catch((e) => {
        dirty.add(store.key) // gagal kirim → coba lagi saat push berikut
        scheduleFlush()
        console.warn('[live-sync] Push gagal:', store.key, e.message)
      })
  } catch (e) {
    console.warn('[live-sync] Push error:', store.key, e.message)
  }
}

function handleLocalChange(key) {
  if (!running || !uid) return
  const store = storeByKey(key)
  if (!store) return
  const meta = getMeta()
  const m = meta[store.key] || { updated: 0, fingerprint: '' }
  const raw = readLocal(store.key)
  if (raw == null) return
  const fp = JSON.stringify(raw)
  // Data sama dengan yang terakhir terkirim → sudah sinkron, jangan push lagi.
  if (fp === m.fingerprint) return
  // Naikkan waktu lokal SEKARANG (jangan tunggu push sukses). Ini mencegah
  // snapshot cloud LAMA menang di jeda debounce — penting untuk store LWW
  // (tanpa penanda resetAt) agar "Reset semua progres" tak ter-resurrect.
  meta[store.key] = { ...m, updated: Date.now() }
  setMeta(meta)
  dirty.add(key)
  scheduleFlush()
}

function applyCloud(store, cloud) {
  const meta = getMeta()
  const m = meta[store.key] || { updated: 0, fingerprint: '' }
  const raw = readLocal(store.key)

  if (!cloud) return // doc belum ada di cloud — biarkan lokal menang

  if (store.legacy) {
    const cloudFp = cloud.data ? JSON.stringify(cloud.data) : ''
    if (cloudFp === m.fingerprint) return // echo dari push kita sendiri
    const merged = mergeProgress(raw, cloud.data)
    const mergedJson = JSON.stringify(merged)
    if (mergedJson !== JSON.stringify(raw)) {
      // Set meta DULU sebelum saveProgress: karena saveProgress publish,
      // handleLocalChange harus sudah melihat fingerprint baru (anti echo).
      meta[store.key] = { updated: cloud.updated, fingerprint: mergedJson }
      setMeta(meta)
      // saveProgress sekaligus sinkronkan cache storage.js + localStorage.
      saveProgress(merged)
      dispatchSyncApplied([store.key])
    } else if (cloud.updated > m.updated) {
      meta[store.key] = { ...m, updated: cloud.updated }
      setMeta(meta)
    }
    return
  }

  // Self-echo: payload & fingerprint cocok → tulisan kita sendiri.
  const cloudFp = cloud.data != null ? JSON.stringify(cloud.data) : ''
  if (cloudFp !== '' && cloudFp === m.fingerprint) return

  const local = { data: raw, updated: m.updated || 0 }
  const merged = store.merge(local, cloud)
  const mergedData = merged ? merged.data : null
  const mergedJson = JSON.stringify(mergedData)
  const localJson = JSON.stringify(raw)

  if (mergedJson !== localJson) {
    writeLocal(store.key, mergedData)
    meta[store.key] = {
      updated: Math.max(cloud.updated, merged.updated || 0),
      fingerprint: mergedJson,
    }
    setMeta(meta)
    dispatchSyncApplied([store.key])
  } else if (cloud.updated > m.updated) {
    meta[store.key] = { ...m, updated: cloud.updated }
    setMeta(meta)
  }
}

// ── Start / stop ──
// Bersihkan store lokal + meta (TANPA menyentuh cloud). Dipakai saat pergantian
// akun: mencegah user baru melihat data user lama sebelum snapshot-nya datang.
function resetLocalStores() {
  if (timer) { clearTimeout(timer); timer = null }
  dirty.clear()
  const keys = new Set(SYNC_STORES.map((s) => s.key))
  keys.add(META_KEY)
  // `hh2-anchor-*` bukan store yang di-sync, tapi bersifat per-akun (anchor hari
  // pertama). WAJIB dibersihkan saat ganti akun — kalau tidak, user baru memakai
  // anchor user lama → potongan item harian salah.
  for (const m of ['a2', 'n3', 'n2', 'n1']) keys.add(`hh2-anchor-${m}`)
  for (const k of keys) {
    try { localStorage.removeItem(k) } catch {}
  }
  // Cache module-level storage.js juga harus di-reset, jika tidak user baru
  // masih melihat progress user lama (getProgress membaca cache).
  invalidateProgressCache()
}

export function startLiveSync(userUid) {
  // Jika engine sudah jalan untuk uid LAIN, hentikan dulu (jangan early-return
  // buta) supaya pergantian akun selalu memicu bersih-bersih.
  if (running && uid !== userUid) stopLiveSync()
  if (running) return () => {}

  // Deteksi pergantian akun pada device yang sama. Bila data lokal dibersihkan,
  // kirim sinyal supaya UI (progress/level/riwayat) memuat ulang — dilakukan
  // SETELAH langganan dipasang agar event tidak hilang (lihat akhir fungsi).
  let accountSwitched = false
  let prevOwner = null
  try { prevOwner = localStorage.getItem(OWNER_KEY) } catch {}
  if (prevOwner && prevOwner !== userUid) {
    resetLocalStores() // data user lama disembunyikan; cloud user baru akan mengisi
    accountSwitched = true
  }
  try { localStorage.setItem(OWNER_KEY, userUid) } catch {}

  uid = userUid
  running = true

  // P3: default level dinamis mengikuti level tersimpan (rotasi item harian
  // mengikuti level aktif). applyScopes lalu memasang static + level itu +
  // (nemonik hanya bila pernah dibuka).
  attachedLevel = readActiveLevel()
  nemonikAttached = hasOpenedNemonikLocal()
  applyScopes()

  stopLocalWatch = onStoreChanged(handleLocalChange)

  window.addEventListener('online', onWindowOnline)
  document.addEventListener('visibilitychange', onVisibility)

  // Dispatch SETELAH langganan terpasang agar sinyal "store dibersihkan" tidak
  // hilang (listener onSyncApplied belum ada saat mulai).
  if (accountSwitched) {
    dispatchSyncApplied([...new Set(SYNC_STORES.map((s) => s.key))])
  }

  return () => stopLiveSync()
}

export function stopLiveSync() {
  if (!running) return
  if (timer) clearTimeout(timer)
  timer = null
  for (const un of attached.values()) { try { un() } catch {} }
  attached.clear()
  attachedLevel = null
  nemonikAttached = false
  if (stopLocalWatch) { stopLocalWatch(); stopLocalWatch = null }
  window.removeEventListener('online', onWindowOnline)
  document.removeEventListener('visibilitychange', onVisibility)
  dirty.clear()
  uid = null
  running = false
}

export function isSyncRunning() {
  return running
}

// ── P3: gating level ──
// Ganti level → lepas store dinamis level lama, pasang level baru. Race-safe:
// idempoten (attached Map mencegah dobel), dan menerima level yang sama (no-op).
// Aman dipanggil berkali-kali cepat berturut-turut: tiap panggilan menghitung
// ulang HANYA dari store yang ada di registry + state `attachedLevel` terbaru,
// jadi tak ada data "nyasar" ke level yang salah.
export function setSyncLevel(level) {
  const lv = ['a2', 'n3', 'n2', 'n1'].includes(level) ? level : 'a2'
  attachedLevel = lv
  if (running) applyScopes()
}

// ── P4: gating nemonik ──
// Store nemonik hanya disubscribe setelah user pertama membuka halaman Nemonik.
// Perangkat yang pernah membuka (flag localStorage) tetap ikut sejak awal agar
// progress yang sudah ada tidak "tertinggal" sync — hanya perangkat baru hemat.
export function setSyncNemonik(on) {
  nemonikAttached = on !== false
  if (running) applyScopes()
}

// Baca flag "pernah buka nemonik" tanpa import hafalan-storage (hindari circular).
function hasOpenedNemonikLocal() {
  try { return localStorage.getItem('hh1-nemonik-opened') === 'true' } catch { return false }
}