import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useExitAnimation } from '../../hooks/useExitAnimation'

// ZoomLightbox — modal/lightbox perbesar untuk elemen visual di tab "Kartu"
// (kartu kanji, ilustrasi mnemonic, kartu kosakata lengkap).
//
// Prinsip:
// - Di-portal ke <body> agar `position: fixed` benar-benar menutup viewport
//   (tak ter-pin oleh ancestor ber-transform seperti .page-transition).
// - Animasi buka/tutup memakai sistem ios-motion.css yang sudah ada
//   (ios-backdrop-in/out + ios-sheet-center-in/out) via useExitAnimation,
//   sehingga konsisten dengan modal lain & otomatis menonaktif diri saat
//   prefers-reduced-motion.
// - 3 cara tutup: tombol X, klik backdrop, tombol ESC.
// - Focus trap sederhana: fokus pindah ke tombol close saat buka, dan Tab
//   berputar hanya di dalam modal.
export default function ZoomLightbox({ open, onClose, label, children, variant }) {
  const { mounted, closing } = useExitAnimation(open, { duration: 200 })
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  // Tangkap handler ESC saat terbuka.
  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return undefined
    window.addEventListener('keydown', handleKey)
    // Kunci scroll halaman di belakang saat modal terbuka.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Fokuskan tombol close untuk aksesibilitas keyboard.
    const t = setTimeout(() => closeRef.current?.focus(), 30)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(t)
    }
  }, [open, handleKey])

  // Focus trap: jaga Tab tetap di dalam panel.
  const onTrapKeyDown = (e) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className={`zoom-lightbox ${closing ? 'ios-backdrop-out' : 'ios-backdrop-in'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label || 'Perbesar'}
    >
      <div
        ref={panelRef}
        className={`zoom-lightbox-panel${variant ? ` zoom-lightbox-panel--${variant}` : ''} ${closing ? 'ios-sheet-center-out' : 'ios-sheet-center-in'}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onTrapKeyDown}
      >
        <button
          ref={closeRef}
          type="button"
          className="zoom-lightbox-close"
          onClick={onClose}
          aria-label="Tutup"
          title="Tutup (Esc)"
        >
          <X size={20} />
        </button>
        <div className="zoom-lightbox-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
