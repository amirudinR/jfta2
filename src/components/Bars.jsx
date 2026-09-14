import {
  FileQuestion,
  RotateCcw,
  Zap,
  Target,
  List,
  BookOpen,
  Sparkles,
  BarChart3,
  BookMarked,
  BookCopy,
  Book,
  CalendarCheck,
  BookText,
  FlaskConical,
  History,
} from 'lucide-react'
import { MATERIALS, MODES } from '../data/materials'

export function MaterialBar({ active, onChange }) {
  const list = MATERIALS.filter((m) => !m.standalone)
  return (
    <div className="materibar no-print" role="tablist">
      {list.map((m) => (
        <button
          key={m.key}
          className={`mat-btn ${active === m.key ? 'active' : ''}`}
          onClick={() => onChange(m.key)}
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
    harian: <CalendarCheck size={14} />,
    materi: <BookText size={14} />,
    kartu: <Sparkles size={14} />,
    kuis: <FileQuestion size={14} />,
    ulangi: <RotateCcw size={14} />,
    sprint: <Zap size={14} />,
    ujian: <Target size={14} />,
    'ujian-baru': <FlaskConical size={14} />,
    recall: <History size={14} />,
    daftar: <List size={14} />,
    kemampuan: <BarChart3 size={14} />,
    'kotoba-n3': <BookMarked size={14} />,
    'kotoba-n2': <BookCopy size={14} />,
    'kotoba-n1': <Book size={14} />,
    referensi: <BookOpen size={14} />,
  }
  return icons[key] || null
}

// badgeCount: { ulangi: n, hafal: n } — badge merah ala desain asli.
export function ModeBar({ active, onChange, badgeCount = {} }) {
  return (
    <div className="modebar no-print" role="tablist">
      {MODES.map((m) => {
        const n = m.badge ? badgeCount[m.badge] : null
        return (
          <button
            key={m.key}
            className={`mode-btn ${active === m.key ? 'active' : ''}`}
            onClick={() => onChange(m.key)}
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
