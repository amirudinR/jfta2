import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Brain, Loader2 } from 'lucide-react'
import {
  loadNemonik, getNemonikSrs, ensureSrs, gradeNemonik,
  nemonikStats, checkNemonikStreak,
} from '../../lib/nemonik'
import NemonikDashboard from './NemonikDashboard'
import NemonikStudy from './NemonikStudy'
import NemonikQuiz from './NemonikQuiz'

// Nemonik Kanji — kontainer halaman (port dari nemonik/ mandiri ke React).
// Fase internal: 'dashboard' | 'study' | 'quiz'. Layout kartu (gambar kiri/kanan)
// dipertahankan persis seperti desain aslinya.
export default function Nemonik({ onBack }) {
  const [data, setData] = useState(null)
  const [srs, setSrs] = useState(() => getNemonikSrs())
  const [streak, setStreak] = useState(0)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('dashboard')
  const [queue, setQueue] = useState([])

  // Muat data + inisialisasi SRS + streak sekali.
  useEffect(() => {
    let alive = true
    loadNemonik()
      .then((json) => {
        if (!alive) return
        setData(json)
        setSrs((prev) => {
          const { srs: next, changed } = ensureSrs(json, prev)
          return changed ? next : prev
        })
        setStreak(checkNemonikStreak())
      })
      .catch((e) => { if (alive) setError(e.message || 'Gagal memuat data nemonik.') })
    return () => { alive = false }
  }, [])

  const stats = useMemo(
    () => (data ? nemonikStats(data, srs) : null),
    [data, srs],
  )

  // Mulai sesi belajar: semua status 'baru'/'belajar' (fallback: semua kartu).
  const startStudy = useCallback((filter) => {
    if (!data) return
    let q = data.filter((k) => filter(srs[String(k.no)]))
    if (q.length === 0) q = data
    setQueue(q)
    setPhase('study')
  }, [data, srs])

  const startLearn = useCallback(
    () => startStudy((s) => !s || s.status === 'baru' || s.status === 'belajar'),
    [startStudy],
  )

  const startReview = useCallback(() => {
    if (!data) return
    const now = Date.now()
    const q = data.filter((k) => {
      const s = srs[String(k.no)]
      return s && s.status !== 'baru' && (s.nextReview || 0) <= now
    })
    if (q.length === 0) return
    setQueue(q)
    setPhase('study')
  }, [data, srs])

  const handleGrade = useCallback((id, rating) => {
    setSrs((prev) => gradeNemonik(prev, id, rating))
  }, [])

  const backToDashboard = useCallback(() => {
    setPhase('dashboard')
    setQueue([])
  }, [])

  // Loading / error states
  if (error) {
    return (
      <div className="nemo-page">
        <div className="nemo-header">
          <button className="nemo-back" onClick={onBack}>
            <ChevronLeft size={16} /> Kembali
          </button>
        </div>
        <p className="nemo-error">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="nemo-page">
        <div className="nemo-loading">
          <Loader2 size={22} className="nemo-spin" /> Memuat Nemonik Kanji…
        </div>
      </div>
    )
  }

  return (
    <div className="nemo-page">
      <div className="nemo-header no-print">
        <button className="nemo-back" onClick={phase === 'dashboard' ? onBack : backToDashboard}>
          <ChevronLeft size={16} /> {phase === 'dashboard' ? 'Kembali' : 'Dashboard'}
        </button>
        <div className="nemo-brand">
          <span className="nemo-brand-icon" aria-hidden><Brain size={18} /></span>
          <span>Nemonik Kanji</span>
        </div>
      </div>

      {phase === 'dashboard' && (
        <NemonikDashboard
          stats={stats}
          streak={streak}
          onLearn={startLearn}
          onReview={startReview}
          onQuiz={() => setPhase('quiz')}
        />
      )}

      {phase === 'study' && (
        <NemonikStudy
          queue={queue}
          onGrade={handleGrade}
          onFinish={backToDashboard}
        />
      )}

      {phase === 'quiz' && (
        <NemonikQuiz
          data={data}
          srs={srs}
          onSrsChange={setSrs}
          onFinish={backToDashboard}
        />
      )}
    </div>
  )
}
