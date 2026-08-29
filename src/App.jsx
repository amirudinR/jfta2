import { useEffect, useMemo, useState } from 'react'
import { byMaterial, groupListOf } from './data'
import { gradeCard, computeStats, isDue, isMastered } from './lib/srs'
import {
  getProgress,
  getPrefs,
  savePrefs,
  storeGrade,
  setCard,
  clearCard,
  resetProgress,
  storageAvailable,
} from './lib/storage'
import { ttsSupported } from './lib/tts'
import { MODES, materialOf } from './data/materials'
import Topbar from './components/Topbar'
import { MaterialBar, ModeBar } from './components/Bars'
import Controls from './components/Controls'
import Kartu from './components/Kartu'
import Kuis from './components/Kuis'
import Sprint from './components/Sprint'
import Ujian from './components/Ujian'
import DaftarHafal from './components/DaftarHafal'
import Referensi from './components/Referensi'

export default function App() {
  const [material, setMaterial] = useState('hiragana')
  const [mode, setMode] = useState(MODES[0].key)
  const [progress, setProgress] = useState(() => getProgress())
  const [prefs, setPrefsState] = useState(() => getPrefs())
  const [lessons, setLessons] = useState({}) // { [material]: null | [groupLabel] }
  const [deckVersion, setDeckVersion] = useState(0)
  const [resetArmed, setResetArmed] = useState(false)

  const storageOk = useMemo(() => storageAvailable(), [])
  const ttsOk = useMemo(() => ttsSupported(), [])

  // Dark mode → class di <html> (sn anti-flash di index.html memakai key yang sama).
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', !!prefs.darkMode)
  }, [prefs.darkMode])

  useEffect(() => {
    setMode(MODES[0].key)
  }, [material])

  const setPrefs = (partial) => {
    const next = { ...prefs, ...partial }
    setPrefsState(next)
    savePrefs(partial)
  }

  const cards = progress.perMaterial[material] || {}
  const allEntries = useMemo(() => byMaterial(material), [material])
  const selectedLessons = lessons[material] ?? null
  const entries = useMemo(() => {
    if (!selectedLessons) return allEntries
    const set = new Set(selectedLessons)
    return allEntries.filter((e) => set.has(e.groupLabel || ''))
  }, [allEntries, selectedLessons])
  const groups = useMemo(() => groupListOf(allEntries), [allEntries])

  const handleGrade = (id, grade, pre) => {
    storeGrade(material, id, gradeCard(pre, grade))
    setProgress(getProgress())
  }

  const handleToggleMastered = (id, card) => {
    if (card) setCard(material, id, card)
    else clearCard(material, id)
    setProgress(getProgress())
  }

  const handleApplyLessons = (selection) => {
    setLessons((l) => ({ ...l, [material]: selection }))
    setDeckVersion((v) => v + 1)
  }

  const info = materialOf(material)
  const stats = useMemo(() => {
    const s = computeStats(cards)
    return { total: allEntries.length, deck: entries.length, hafal: s.mastered }
  }, [cards, allEntries, entries])

  const badgeCount = useMemo(() => {
    const list = Object.entries(cards)
    const ulangi = list.filter(([, c]) => c && !isMastered(c) && isDue(c)).length
    const hafal = list.filter(([, c]) => isMastered(c)).length
    return { ulangi, hafal }
  }, [cards])

  const doReset = () => {
    if (!resetArmed) {
      setResetArmed(true)
      setTimeout(() => setResetArmed(false), 4000)
      return
    }
    resetProgress()
    setProgress(getProgress())
    setLessons({})
    setDeckVersion((v) => v + 1)
    setResetArmed(false)
  }

  const renderBody = () => {
    switch (mode) {
      case 'kartu':
        return (
          <Kartu
            entries={entries}
            cards={cards}
            onGrade={handleGrade}
            onReshuffle={() => setDeckVersion((v) => v + 1)}
            material={material}
            direction={prefs.direction}
            showRomaji={prefs.showRomaji}
            deckKey={deckVersion}
          />
        )
      case 'ulangi':
        return (
          <Kartu
            entries={entries}
            cards={cards}
            onGrade={handleGrade}
            onReshuffle={() => setDeckVersion((v) => v + 1)}
            material={material}
            direction={prefs.direction}
            showRomaji={prefs.showRomaji}
            deckKey={deckVersion + 1000}
            onlyLearning
          />
        )
      case 'kuis':
        return (
          <Kuis entries={entries} material={material} direction={prefs.direction} />
        )
      case 'sprint':
        return (
          <Sprint
            entries={entries}
            cards={cards}
            onGrade={handleGrade}
            material={material}
            direction={prefs.direction}
          />
        )
      case 'ujian':
        return <Ujian entries={allEntries} cards={cards} direction={prefs.direction} />
      case 'daftar':
        return <DaftarHafal entries={allEntries} cards={cards} />
      case 'referensi':
        return (
          <Referensi
            entries={allEntries}
            cards={cards}
            isKana={info?.kind === 'kana'}
            onToggleMastered={handleToggleMastered}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="stage">
      <Topbar
        stats={stats}
        darkMode={prefs.darkMode}
        onToggleDark={() => setPrefs({ darkMode: !prefs.darkMode })}
      />

      <MaterialBar active={material} onChange={setMaterial} />

      <ModeBar active={mode} onChange={setMode} badgeCount={badgeCount} />

      {mode === 'kartu' || mode === 'ulangi' || mode === 'kuis' || mode === 'sprint' ? (
        <Controls
          material={material}
          groups={groups}
          committed={selectedLessons}
          direction={prefs.direction}
          onDirection={(d) => setPrefs({ direction: d })}
          showRomaji={prefs.showRomaji}
          onToggleRomaji={() => setPrefs({ showRomaji: !prefs.showRomaji })}
          onApply={handleApplyLessons}
        />
      ) : null}

      {!storageOk ? (
        <div className="banner">
          <span>⚠️</span>
          <span>
            Penyimpanan lokal tidak tersedia — progres tidak akan tersimpan (private mode?).
          </span>
        </div>
      ) : null}

      {renderBody()}

      <footer className="foot">
        <span>
          Progres &amp; preferensi tersimpan otomatis di perangkat ini (localStorage).
          {!ttsOk ? ' TTS tidak didukung browser ini.' : ''}
        </span>
        <span>
          Sumber: daftar kosakata &amp; kanji JFT-Basic A2 · 暗記帳 アンキチョウ
        </span>
        <button className={`reset-btn no-print ${resetArmed ? 'armed' : ''}`} onClick={doReset}>
          {resetArmed ? 'Yakin? Klik lagi untuk reset' : 'Reset semua progres'}
        </button>
      </footer>
    </div>
  )
}
