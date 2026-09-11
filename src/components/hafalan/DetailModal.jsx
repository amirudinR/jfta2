import { useEffect } from 'react'
import { X, Volume2, CheckSquare, Square } from 'lucide-react'
import { speak } from '../../lib/hafalan-storage'

export function DetailModal({ item, isChecked, onToggle, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="hh-modal-overlay" onClick={onClose}>
      <div className="hh-modal" onClick={e => e.stopPropagation()}>
        <button className="hh-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="hh-modal-main">
          <span className="hh-modal-num">#{item.num}</span>
          <div className="hh-modal-front">{item.front}</div>
          {item.reading && <div className="hh-modal-reading">{item.reading}</div>}
          <div className="hh-modal-meaning">{item.full || item.meaning}</div>
          {item.example && <div className="hh-modal-example">例: {item.example}</div>}
        </div>

        <div className="hh-modal-actions">
          <button className="hh-modal-tts" onClick={() => speak(item.reading || item.front)} title="Dengarkan">
            <Volume2 size={20} />
          </button>
          <button className={`hh-modal-hafal ${isChecked ? 'checked' : ''}`} onClick={onToggle}>
            {isChecked ? <CheckSquare size={22} /> : <Square size={22} />}
            {isChecked ? 'Sudah Hafal' : 'Tandai Hafal'}
          </button>
        </div>
      </div>
    </div>
  )
}
