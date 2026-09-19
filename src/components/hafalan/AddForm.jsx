import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

const TYPE_META = {
  kotoba: { label: 'Kotoba', ph: '漢字 / ひらがな' },
  kanji: { label: 'Kanji', ph: '漢字' },
  bunpou: { label: 'Bunpou', ph: '文法' },
}

export function AddForm({ type, onAdd, onClose }) {
  const [front, setFront] = useState('')
  const [reading, setReading] = useState('')
  const [meaning, setMeaning] = useState('')
  const ref = useRef()
  useEffect(() => { ref.current?.focus() }, [])

  const meta = TYPE_META[type] || { label: type, ph: '漢字' }

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
        Tambah {meta.label} Baru
        <button type="button" className="hh-close-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="hh-add-fields">
        <input ref={ref} className="hh-input" placeholder={meta.ph} value={front} onChange={e => setFront(e.target.value)} />
        <input className="hh-input" placeholder="Cara baca" value={reading} onChange={e => setReading(e.target.value)} />
        <input className="hh-input" placeholder="Arti (Indonesia)" value={meaning} onChange={e => setMeaning(e.target.value)} />
      </div>
      <button type="submit" className="hh-add-submit" disabled={!front.trim() || !meaning.trim()}>
        <Plus size={14} /> Tambah
      </button>
    </form>
  )
}
