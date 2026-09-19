import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Volume2, CheckSquare, Square } from 'lucide-react'
import { speak } from '../../lib/tts'
import { useExitAnimation } from '../../hooks/useExitAnimation'

export function DetailModal({ item, isChecked, onToggle, onClose }) {
  const panelRef = useRef(null)
  const open = !!item
  const { mounted, closing } = useExitAnimation(open, { duration: 220 })
  // Simpan item terakhir agar panel tetap punya konten selama animasi keluar.
  const lastItemRef = useRef(null)
  if (item) lastItemRef.current = item
  const shown = item || lastItemRef.current

  // Simpan onClose di ref: parent sering membuat fungsi baru tiap render
  // (mis. `() => setDetailItem(null)`), sehingga bila dipakai langsung sebagai
  // dependency efek, efek akan re-run tiap render → fokus loncat & scroll-lock
  // "churn". Dengan ref, efek hanya bergantung pada status buka + item.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!mounted) return
    const panel = panelRef.current
    const first = panel?.querySelector('.hh-modal-close')
    // preventScroll: jangan biarkan browser scroll dokumen saat focus
    // (modal masih animasi slide-up / di bawah viewport pada saat mount).
    first?.focus({ preventScroll: true })

    // Kunci scroll body selama modal terbuka (bottom-sheet mobile).
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handler = (e) => { if (e.key === 'Escape') onCloseRef.current?.() }
    const trap = (e) => {
      if (e.key !== 'Tab' || !panel) return
      const focusables = [...panel.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      if (!focusables.length) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    window.addEventListener('keydown', handler)
    panel?.addEventListener('keydown', trap)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
      panel?.removeEventListener('keydown', trap)
    }
    // deps sengaja tanpa `item`: efek hanya perlu re-run saat modal dibuka/ditutup,
    // bukan tiap ganti item. `item?.id` memicu reset fokus bila item berganti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, item?.id])

  if (!mounted || !shown) return null

  return createPortal(
    <div
      className={`hh-modal-overlay ${closing ? 'ios-backdrop-out' : 'ios-backdrop-in'}`}
      onClick={onClose}
    >
      <div
        className={`hh-modal ${closing ? 'ios-sheet-out' : 'ios-sheet-in'}`}
        role="dialog"
        aria-modal="true"
        aria-label={shown.front}
        ref={panelRef}
        onClick={e => e.stopPropagation()}
      >
        <button className="hh-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="hh-modal-main">
          <span className="hh-modal-num">#{shown.num}</span>
          <div className="hh-modal-front">{shown.front}</div>
          {shown.reading && <div className="hh-modal-reading">{shown.reading}</div>}
          <div className="hh-modal-meaning">{shown.full || shown.meaning}</div>
          {shown.example && <div className="hh-modal-example">例: {shown.example}</div>}
        </div>

        <div className="hh-modal-actions">
          <button className={`hh-modal-hafal ${isChecked ? 'checked' : ''}`} onClick={onToggle}>
            {isChecked ? <CheckSquare size={22} /> : <Square size={22} />}
            {isChecked ? 'Sudah Hafal' : 'Tandai Hafal'}
          </button>
          <button className="hh-modal-tts" onClick={() => speak(shown.reading || shown.front)} title="Dengarkan">
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
