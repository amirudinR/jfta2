import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

export function AddForm({ type, onAdd, onClose }) {
  const [front, setFront] = useState('')
  const [reading, setReading] = useState('')
  const [meaning, setMeaning] = useState('')
  const ref = useRef()
  useEffect(() => { ref.current?.focus() }, [])

  const submit = (e) => {
    e.preventDefault()
    if (!front.trim() || !meaning.trim()) return
    onAdd({ front: front.trim(), reading: reading.trim(), meaning: meaning.trim() })
    setFront(''); setReading(''); setMeaning('')
    ref.current?.focus()
  }

  return (
    <form className="hh-add-form" onSubmit={submit}>
      <div className="hh-add-title">
        Tambah {type === 'kotoba' ? 'Kotoba' : 'Kanji'} Baru
        <button type="button" className="hh-close-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="hh-add-fields">
        <input ref={ref} className="hh-input" placeholder={type === 'kotoba' ? '漢字 / ひらがな' : '漢字'} value={front} onChange={e => setFront(e.target.value)} />
        <input className="hh-input" placeholder="Cara baca" value={reading} onChange={e => setReading(e.target.value)} />
        <input className="hh-input" placeholder="Arti (Indonesia)" value={meaning} onChange={e => setMeaning(e.target.value)} />
      </div>
      <button type="submit" className="hh-add-submit" disabled={!front.trim() || !meaning.trim()}>
        <Plus size={14} /> Tambah
      </button>
    </form>
  )
}
