// useAppSettings — handle tema & font dari prefs.
// Dipisah agar App.jsx tidak campur aduk antara UI side-effect dan routing.

import { useEffect } from 'react'
import { kanjiFontOf } from '../lib/fonts'

export function useAppSettings(prefs) {
  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', !!prefs.darkMode)
  }, [prefs.darkMode])

  // Font kanji
  useEffect(() => {
    const f = kanjiFontOf(prefs.font)
    const el = document.documentElement.style
    el.setProperty('--font-jp', f.jp)
    el.setProperty('--font-serif-jp', f.serif)
  }, [prefs.font])
}
