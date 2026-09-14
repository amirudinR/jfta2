import { useMemo, useState } from 'react'
import { BookMarked, List, RotateCcw, FileQuestion, BookCopy, BookOpen } from 'lucide-react'
import { byMaterial, groupListOf } from '../data'
import Kartu from './Kartu'
import Kuis from './Kuis'
import DaftarHafal from './DaftarHafal'
import { isMastered, isDue } from '../lib/srs'

const iconMap = {
  'kotoba-n3': <BookMarked size={14} />,
  'kotoba-n2': <BookCopy size={14} />,
  'kotoba-n1': <BookOpen size={14} />,
}

const TABS = [
  { key: 'kartu', label: 'Kartu', icon: <BookMarked size={14} /> },
  { key: 'kuis', label: 'Kuis', icon: <FileQuestion size={14} /> },
  { key: 'ulangi', label: 'Ulangi', icon: <RotateCcw size={14} /> },
  { key: 'daftar', label: 'Daftar Hafal', icon: <List size={14} /> },
]

export default function KotobaLevel({ material, label, hankoText, cards, prefs, onToggleRomaji, onGrade }) {
  const allEntries = useMemo(() => byMaterial(material), [material])
  const [tab, setTab] = useState('kartu')
  const [lessons, setLessons] = useState(null)
  const [draft, setDraft] = useState(null)
  const [deckVersion, setDeckVersion] = useState(0)

  const groups = useMemo(() => groupListOf(allEntries), [allEntries])

  const entries = useMemo(() => {
    if (!lessons) return allEntries
    const set = new Set(lessons)
    return allEntries.filter((e) => set.has(e.groupLabel || ''))
  }, [allEntries, lessons])

  const toggleDraft = (g) => {
    setDraft((prev) => {
      const base = prev ? new Set(prev) : new Set(groups)
      if (base.has(g)) base.delete(g)
      else base.add(g)
      return base.size === groups.length ? null : base
    })
  }

  const selectAll = () => setDraft(null)
  const clearAll = () => setDraft(new Set())

  const apply = () => {
    setLessons(draft)
    setDeckVersion((v) => v + 1)
  }

  const hafalCount = useMemo(() => allEntries.filter((e) => isMastered(cards[e.id])).length, [allEntries, cards])
  const dueCount = useMemo(() => allEntries.filter((e) => cards[e.id] && !isMastered(cards[e.id]) && isDue(cards[e.id])).length, [allEntries, cards])

  const grade = (id, g, pre) => onGrade(material, id, g, pre)

  const body = () => {
    const common = {
      entries,
      cards,
      material,
      direction: prefs.direction,
      showRomaji: prefs.showRomaji,
    }
    switch (tab) {
      case 'kuis':
        return <Kuis {...common} />
      case 'ulangi':
        return (
          <Kartu {...common} onGrade={grade} onReshuffle={() => setDeckVersion((v) => v + 1)} deckKey={deckVersion + 1000} onlyLearning onToggleRomaji={onToggleRomaji} />
        )
      case 'daftar':
        return <DaftarHafal entries={allEntries} cards={cards} />
      default:
        return (
          <Kartu {...common} onGrade={grade} onReshuffle={() => setDeckVersion((v) => v + 1)} deckKey={deckVersion} onToggleRomaji={onToggleRomaji} />
        )
    }
  }

  return (
    <div className="kl-page">
      <div className="kl-hero">
        <div className="kl-hero-title">
          <span className={`hanko hanko-${hankoText}`}>{hankoText}</span>
          <div>
            <div className="brand">{label}</div>
            <div className="tagline">{label} · {allEntries.length} kata · {groups.length} pelajaran</div>
          </div>
        </div>
        <div className="stat-chips">
          <div className="stat">
            <span className="stat-num">{allEntries.length}</span>
            <span className="stat-lbl">Total kata</span>
          </div>
          <div className="stat">
            <span className="stat-num hafal">{hafalCount}</span>
            <span className="stat-lbl">Dikuasai</span>
          </div>
          <div className="stat">
            <span className="stat-num">{dueCount}</span>
            <span className="stat-lbl">Jatuh tempo</span>
          </div>
        </div>
      </div>

      <div className="modebar no-print" role="group" aria-label="Pilih tampilan">
        {TABS.map((t) => (
          <button key={t.key} className={`mode-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)} aria-pressed={tab === t.key}>
            <span className="mi" aria-hidden>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {groups.length > 1 ? (
        <div className="kl-lessons no-print">
          <div className="lesson-chips">
            <button className={`lchip ${draft === null ? 'on' : ''}`} onClick={selectAll}>Semua</button>
            {groups.map((g) => (
              <button key={g} className={`lchip ${draft && draft.has(g) ? 'on' : ''}`} onClick={() => toggleDraft(g)}>
                {g}
              </button>
            ))}
            {draft ? <button className="ctl-link" onClick={clearAll}>Kosongkan</button> : null}
          </div>
          <button className="apply-btn" onClick={apply}>
            Terapkan &amp; kocok ulang
          </button>
        </div>
      ) : null}

      {body()}
    </div>
  )
}