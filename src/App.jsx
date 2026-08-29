import { useEffect, useMemo, useState } from 'react'
import { byMaterial } from './data'
import { gradeCard } from './lib/srs'
import { getProgress, storeGrade, resetProgress } from './lib/storage'
import { MATERIALS, MODES } from './data/materials'
import Topbar from './components/Topbar'
import { MaterialBar, ModeBar } from './components/Bars'
import ProgressPanel from './components/ProgressPanel'
import Kartu from './components/Kartu'
import Kuis from './components/Kuis'
import Sprint from './components/Sprint'
import Ujian from './components/Ujian'
import DaftarHafal from './components/DaftarHafal'
import Referensi from './components/Referensi'

export default function App() {
  const [material, setMaterial] = useState('hiragana')
  const [mode, setMode] = useState('kartu')
  const [progress, setProgress] = useState(() => getProgress())
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    setProgress(getProgress())
  }, [])

  const cards = useMemo(() => progress.perMaterial[material] || {}, [progress, material])
  const entries = useMemo(() => byMaterial(material), [material])

  useEffect(() => {
    // Ganti materi → kembalikan ke mode belajar kartu
    setMode(MODES[0].key)
  }, [material])

  const handleGrade = (id, grade) => {
    const state = storeGrade(material, id, gradeCard(cards[id], grade))
    setProgress({ ...state })
  }

  const totalOf = (m) => byMaterial(m).length

  const renderBody = () => {
    switch (mode) {
      case 'kartu':
        return <Kartu entries={entries} cards={cards} onGrade={handleGrade} />
      case 'ulangi':
        return <Kartu entries={entries} cards={cards} onGrade={handleGrade} onlyLearning />
      case 'kuis':
        return <Kuis material={material} cards={cards} />
      case 'sprint':
        return <Sprint material={material} />
      case 'ujian':
        return <Ujian material={material} cards={cards} onGrade={handleGrade} />
      case 'daftar':
        return <DaftarHafal entries={entries} cards={cards} material={material} />
      case 'referensi':
        return <Referensi entries={entries} cards={cards} />
      default:
        return null
    }
  }

  const doReset = () => {
    resetProgress()
    setProgress(getProgress())
    setConfirmReset(false)
  }

  return (
    <div className="app">
      <Topbar onReset={() => setConfirmReset(true)} />

      <MaterialBar active={material} onChange={setMaterial} />

      <ProgressPanel cards={cards} />

      <ModeBar active={mode} onChange={setMode} />

      {renderBody()}

      {confirmReset ? (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Reset semua progres?</div>
            <p>Seluruh kartu akan kembali ke status "Baru". Aksi ini tidak dapat dibatalkan.</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setConfirmReset(false)}>Batal</button>
              <button className="btn primary" onClick={doReset}>Ya, reset</button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="hint muted no-print">
        {MATERIALS.find((m) => m.key === material)?.label} · {totalOf(material)} kartu · progres tersimpan otomatis di perangkat ini.
      </p>
    </div>
  )
}