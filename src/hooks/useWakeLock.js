// useWakeLock — jaga layar tetap menyala (Screen Wake Lock API).
// Berguna saat belajar/hafalan agar layar tidak mati di tengah sesi.
//
// Catatan:
//  • API butuh HTTPS + browser modern (Chrome/Edge/Safari 16.4+).
//  • Lock otomatis dilepas OS saat tab disembunyikan → kita re-acquire
//    saat tab kembali terlihat, selama fitur masih aktif.
//  • Sentinel global (singleton) → boleh dipakai di beberapa komponen tanpa
//    saling berebut lock; hanya menghitung pemakai aktif.

import { useEffect, useState } from 'react'

export function wakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

// ── State global (module-level) ──
let sentinel = null
let users = 0
const listeners = new Set()
const notify = () => { const active = !!(sentinel && !sentinel.released); listeners.forEach((fn) => fn(active)) }

async function acquire() {
  if (!wakeLockSupported()) return
  if (sentinel && !sentinel.released) return
  try {
    sentinel = await navigator.wakeLock.request('screen')
    sentinel.addEventListener('release', () => { notify() })
    notify()
  } catch {
    // gagal (mis. izin/energi rendah) — biarkan nonaktif
    notify()
  }
}

function release() {
  if (sentinel && !sentinel.released) {
    try { sentinel.release() } catch {}
  }
  sentinel = null
  notify()
}

// Re-acquire saat tab kembali terlihat (OS melepas lock saat hidden).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && users > 0) acquire()
  })
}

export function useWakeLock(enabled) {
  const [active, setActive] = useState(() => !!(sentinel && !sentinel.released))

  useEffect(() => {
    if (!enabled || !wakeLockSupported()) return
    users += 1
    acquire()
    const listener = (a) => setActive(a)
    listeners.add(listener)
    listener(!!(sentinel && !sentinel.released))

    return () => {
      users = Math.max(0, users - 1)
      listeners.delete(listener)
      if (users === 0) release()
    }
  }, [enabled])

  return { active, supported: wakeLockSupported() }
}
