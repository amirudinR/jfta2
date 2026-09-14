import {
  FileQuestion,
  RotateCcw,
  Zap,
  List,
  BookOpen,
  Sparkles,
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

const modeIcon = (key) => {
  const icons = {
    kartu: <Sparkles size={15} />,
    kuis: <FileQuestion size={15} />,
    ulangi: <RotateCcw size={15} />,
    sprint: <Zap size={15} />,
    daftar: <List size={15} />,
    referensi: <BookOpen size={15} />,
  }
  return icons[key] || null
}

// badgeCount: { ulangi: n, hafal: n } — badge merah ala desain asli.
export function ModeBar({ active, onChange, badgeCount = {} }) {
  return (
    <div className="modebar no-print" role="group" aria-label="Pilih mode latihan">
      {MODES.map((m) => {
        const n = m.badge ? badgeCount[m.badge] : null
        return (
          <button
            key={m.key}
            className={`mode-btn ${active === m.key ? 'active' : ''}`}
            onClick={() => onChange(m.key)}
            aria-pressed={active === m.key}
          >
            <span className="mi" aria-hidden>
              {modeIcon(m.key)}
            </span>
            <span>{m.label}</span>
            {m.badge ? (
              <span className={`mode-badge ${n ? '' : 'empty'}`}>{n || 0}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
