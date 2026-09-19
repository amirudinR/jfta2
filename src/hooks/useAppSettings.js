// useAppSettings — handle tema & font dari prefs.
// Dipisah agar App.jsx tidak campur aduk antara UI side-effect dan routing.

import { useEffect, useState } from 'react'
import { kanjiFontOf } from '../lib/fonts'

// Resolusi tema: 'system' → ikut preferensi OS (prefers-color-scheme),
// 'dark'/'light' → paksa salah satu.
function resolveDark(themeMode) {
  if (themeMode === 'dark') return true
  if (themeMode === 'light') return false
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function useAppSettings(prefs) {
  // Lacak preferensi skema warna OS agar mode 'system' ikut berubah live.
  const [systemDark, setSystemDark] = useState(() => {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
  })

  useEffect(() => {
    let mq
    try { mq = window.matchMedia('(prefers-color-scheme: dark)') } catch { return }
    const onChange = (e) => setSystemDark(e.matches)
    // Safari lama pakai addListener.
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  // Terapkan tema. `darkMode` legacy dihormati bila themeMode belum ada.
  const themeMode = prefs.themeMode || (prefs.darkMode ? 'dark' : 'light')
  useEffect(() => {
    const dark = resolveDark(themeMode)
    document.documentElement.classList.toggle('dark-mode', dark)
    // Meta theme-color (warna bar browser di mobile) ikut tema.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', dark ? '#0c1f2f' : '#f6f1e2')
  }, [themeMode, systemDark])

  // Font kanji
  useEffect(() => {
    const f = kanjiFontOf(prefs.font)
    const el = document.documentElement.style
    el.setProperty('--font-jp', f.jp)
    el.setProperty('--font-serif-jp', f.serif)
  }, [prefs.font])
}
