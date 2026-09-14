import {
  Sparkles, FileQuestion, RotateCcw, Zap,
  List, BookOpen, BarChart3, BookText,
} from 'lucide-react'
import { MATERIALS, MODES } from '../data/materials'

export function MaterialBar({ active, onChange }) {
  const list = MATERIALS.filter((m) => !m.standalone)
  return (
    <div className="materibar no-print" role="group" aria-label="Pilih materi">
      {list.map((m) => (
        <button
          key={m.key}
          className={`mat-btn ${active === m.key ? 'active' : ''}`}
          onClick={() => onChange(m.key)}
          aria-pressed={active === m.key}
        >
          <span className="mj">{m.kanji}</span>
          <span className="ml">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

const ICONS = {
  kartu:     <Sparkles size={15} />,
  kuis:      <FileQuestion size={15} />,
  ulangi:    <RotateCcw size={15} />,
  sprint:    <Zap size={15} />,
  daftar:    <List size={15} />,
  referensi: <BookOpen size={15} />,
  kemampuan: <BarChart3 size={15} />,
  materi:    <BookText size={15} />,
}

// badgeCount: { ulangi: n, hafal: n }
export function ModeBar({ active, onChange, badgeCount = {} }) {
  const latihan = MODES.filter((m) => m.group === 'latihan')
  const tools   = MODES.filter((m) => m.group === 'tools')

  const renderBtn = (m) => {
    const n = m.badge ? badgeCount[m.badge] : null
    return (
      <button
        key={m.key}
        className={`mode-btn ${active === m.key ? 'active' : ''}`}
        onClick={() => onChange(m.key)}
        aria-pressed={active === m.key}
      >
        <span className="mi" aria-hidden>{ICONS[m.key]}</span>
        <span>{m.label}</span>
        {m.badge ? (
          <span className={`mode-badge ${n ? '' : 'empty'}`}>{n || 0}</span>
        ) : null}
      </button>
    )
  }

  return (
    <div className="modebar-wrap no-print" role="group" aria-label="Pilih mode latihan">
      <div className="modebar modebar--4">
        {latihan.map(renderBtn)}
      </div>
      <div className="modebar-divider">
        <span>Alat</span>
      </div>
      <div className="modebar modebar--4">
        {tools.map(renderBtn)}
      </div>
    </div>
  )
}
