import { useEffect, useRef } from 'react'
import { X, Volume2, CheckSquare, Square } from 'lucide-react'
import { speak } from '../../lib/hafalan-storage'

export function DetailModal({ item, isChecked, onToggle, onClose }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const panel = panelRef.current
    const first = panel?.querySelector('.hh-modal-close')
    first?.focus()

    const handler = (e) => { if (e.key === 'Escape') onClose() }
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
      window.removeEventListener('keydown', handler)
      panel?.removeEventListener('keydown', trap)
    }
  }, [onClose])

  return (
    <div className="hh-modal-overlay" onClick={onClose}>
      <div className="hh-modal" role="dialog" aria-modal="true" aria-label={item.front} ref={panelRef} onClick={e => e.stopPropagation()}>
        <button className="hh-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="hh-modal-main">
          <span className="hh-modal-num">#{item.num}</span>
          <div className="hh-modal-front">{item.front}</div>
          {item.reading && <div className="hh-modal-reading">{item.reading}</div>}
          <div className="hh-modal-meaning">{item.full || item.meaning}</div>
          {item.example && <div className="hh-modal-example">例: {item.example}</div>}
        </div>

        <div className="hh-modal-actions">
          <button className={`hh-modal-hafal ${isChecked ? 'checked' : ''}`} onClick={onToggle}>
            {isChecked ? <CheckSquare size={22} /> : <Square size={22} />}
            {isChecked ? 'Sudah Hafal' : 'Tandai Hafal'}
          </button>
          <button className="hh-modal-tts" onClick={() => speak(item.reading || item.front)} title="Dengarkan">
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
