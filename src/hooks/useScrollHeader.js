import { useEffect } from 'react'

// useScrollHeader — efek "large title" ala iOS pada header.
//
// Menoggle atribut pada <html>:
//   data-scrolled="true"      → setelah scroll melewati `threshold` px
//                               (header mengecil / brand menciut).
//   data-scroll-hidden="true" → saat scroll ke BAWAH melewati `hideAfter` px
//                               (header menyembunyikan diri);
//                               saat scroll ke ATAS → muncul lagi.
//
// Dipakai CSS (topbar.css) untuk transisi halus. Semua berbasis atribut +
// CSS transition, jadi tidak memicu re-render React per frame (rAF-throttled).
export function useScrollHeader({ threshold = 72, hideAfter = 140 } = {}) {
  useEffect(() => {
    const root = document.documentElement
    let lastY = window.scrollY
    let ticking = false

    const update = () => {
      ticking = false
      const y = window.scrollY
      const delta = y - lastY

      root.dataset.scrolled = y > threshold ? 'true' : 'false'

      // Abaikan gerak kecil (jitter / momentum).
      if (Math.abs(delta) > 6) {
        if (y > hideAfter && delta > 0) {
          root.dataset.scrollHidden = 'true'
        } else if (delta < 0 || y <= hideAfter) {
          root.dataset.scrollHidden = 'false'
        }
        lastY = y
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    // Sinkronkan kondisi awal.
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      delete root.dataset.scrolled
      delete root.dataset.scrollHidden
    }
  }, [threshold, hideAfter])
}
