import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Brain, Loader2, Award } from 'lucide-react'
import {
  loadNemonik, getNemonikSrs, ensureSrs, gradeNemonik,
  nemonikStats, checkNemonikStreak, predictForgetting,
} from '../../lib/nemonik'
import {
  logDailyReview, saveSession, getSessions, sessionSummary,
} from '../../lib/nemonik-sessions'
import {
  getAchievements, addXp, evaluateBadges, XP_TABLE,
} from '../../lib/nemonik-achievements'
import NemonikDashboard from './NemonikDashboard'
import NemonikStudy from './NemonikStudy'
import NemonikQuiz from './NemonikQuiz'
import NemonikBrowse from './NemonikBrowse'
import NemonikAchievements from './NemonikAchievements'

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
  // Penanda sesi study: dinaikkan tiap mulai sesi baru (termasuk "ulangi kartu
  // lemah") → dipasang sebagai `key` NemonikStudy agar state internal (index,
  // rating, dsb) ter-reset/remount, bukan mewarisi state sesi sebelumnya.
  const [studyKey, setStudyKey] = useState(0)
  // Riwayat sesi (untuk ditampilkan di Dashboard).
  const [sessions, setSessions] = useState(() => getSessions())
  // Achievement/XP.
  const [ach, setAch] = useState(() => getAchievements())
  // Notifikasi badge baru (toast kecil, auto-hilang).
  const [badgeToast, setBadgeToast] = useState(null)

  // Waktu mulai sesi study berjalan (perf.now) → untuk hitung durasi sesi.
  const sessionStartRef = useRef(0)
  // Papan skor sesi berjalan: jumlah per rating.
  const sessionTallyRef = useRef({ total: 0, lupa: 0, sulit: 0, tahu: 0 })

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
  const beginStudy = useCallback((q) => {
    sessionStartRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now())
    sessionTallyRef.current = { total: 0, lupa: 0, sulit: 0, tahu: 0 }
    setQueue(q)
    setStudyKey((k) => k + 1)
    setPhase('study')
  }, [])

  const startStudy = useCallback((filterFn) => {
    if (!data) return
    let q = data.filter((k) => filterFn(srs[String(k.no)]))
    if (q.length === 0) q = data
    beginStudy(q)
  }, [data, srs, beginStudy])

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
    beginStudy(q)
  }, [data, srs, beginStudy])

  const handleGrade = useCallback((id, rating) => {
    setSrs((prev) => gradeNemonik(prev, id, rating))
    // Log harian (per kartu) + akumulasi papan skor sesi.
    logDailyReview(rating)
    // XP per review.
    setAch(addXp(XP_TABLE.review))
    const t = sessionTallyRef.current
    t.total += 1
    if (rating === 1) t.lupa += 1
    else if (rating === 2) t.sulit += 1
    else t.tahu += 1
  }, [])

  // Hitung konteks statistik lalu evaluasi badge; tampilkan toast untuk yang baru.
  const toastTimerRef = useRef(null)
  const refreshAchievements = useCallback((srsMap) => {
    const base = data ? nemonikStats(data, srsMap || srs) : null
    const summ = sessionSummary()
    const ctx = {
      hafal: base?.hafal || 0,
      total: base?.total || 0,
      streak,
      sessions: summ.sessions,
      totalCards: summ.totalCards,
      avgAcc: summ.avgAcc,
    }
    const { state, newly } = evaluateBadges(ctx)
    setAch(state)
    if (newly.length > 0) {
      setBadgeToast(newly[newly.length - 1])
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setBadgeToast(null), 4000)
    }
  }, [data, srs, streak])

  // Bersihkan timer toast saat unmount.
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  // Simpan sesi berjalan ke riwayat lalu kembali ke dashboard.
  const finishSession = useCallback(() => {
    const t = sessionTallyRef.current
    if (t.total > 0) {
      const end = (typeof performance !== 'undefined' ? performance.now() : Date.now())
      const dur = Math.max(0, end - sessionStartRef.current)
      saveSession({ ...t, dur })
      setSessions(getSessions())
      sessionTallyRef.current = { total: 0, lupa: 0, sulit: 0, tahu: 0 }
      // XP bonus sesi tuntas + evaluasi badge.
      setAch(addXp(XP_TABLE.sessionDone))
      refreshAchievements()
    }
    setPhase('dashboard')
    setQueue([])
  }, [refreshAchievements])

  const backToDashboard = finishSession

  // Auto-lanjut sesi: bangun ulang queue dari kartu lemah (no. kanji) yang
  // dikirim Study, lalu mulai ulang fase study tanpa keluar ke dashboard.
  // Sesi pertama tetap disimpan ke riwayat sebelum sesi lanjutan dimulai.
  const repeatWeak = useCallback((weakIds) => {
    // Simpan dulu sesi yang baru selesai (kalau ada isinya).
    const t = sessionTallyRef.current
    if (t.total > 0) {
      const end = (typeof performance !== 'undefined' ? performance.now() : Date.now())
      saveSession({ ...t, dur: Math.max(0, end - sessionStartRef.current) })
      setSessions(getSessions())
      setAch(addXp(XP_TABLE.sessionDone))
      refreshAchievements()
    }
    if (!data || !weakIds || weakIds.length === 0) { finishSession(); return }
    const set = new Set(weakIds.map(String))
    const q = data.filter((k) => set.has(String(k.no)))
    if (q.length === 0) { finishSession(); return }
    beginStudy(q)
  }, [data, beginStudy, finishSession, refreshAchievements])

  // Buka layar Jelajahi (browse/search).
  const openBrowse = useCallback(() => setPhase('browse'), [])

  // Belajar satu kartu tertentu (dari Browse) → mulai sesi 1 kartu.
  const studyOne = useCallback((entry) => {
    if (!entry) return
    beginStudy([entry])
  }, [beginStudy])

  // Evaluasi badge begitu data & streak siap (menangkap progres historis).
  useEffect(() => {
    if (data) refreshAchievements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, streak])

  // Prediksi kanji berisiko lupa (untuk kartu dashboard).
  const forgetting = useMemo(
    () => (data ? predictForgetting(data, srs).slice(0, 20) : []),
    [data, srs],
  )

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
          sessions={sessions}
          ach={ach}
          forgetting={forgetting}
          onLearn={startLearn}
          onBrowseAll={openBrowse}
          onReview={startReview}
          onQuiz={() => setPhase('quiz')}
          onAchievements={() => setPhase('achievements')}
          onReviewForgetting={() => {
            const q = forgetting.map((f) => f.entry)
            if (q.length > 0) beginStudy(q)
          }}
        />
      )}

      {phase === 'achievements' && (
        <NemonikAchievements xp={ach.xp} unlocked={ach.unlocked} />
      )}

      {phase === 'browse' && (
        <NemonikBrowse
          data={data}
          srs={srs}
          onStudyOne={studyOne}
          onBack={backToDashboard}
        />
      )}

      {phase === 'study' && (
        <NemonikStudy
          key={studyKey}
          queue={queue}
          onGrade={handleGrade}
          onFinish={backToDashboard}
          onRepeatWeak={repeatWeak}
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

      {badgeToast && (
        <div className="nemo-toast" role="status" onClick={() => setBadgeToast(null)}>
          <Award size={18} />
          <div className="nemo-toast-body">
            <div className="nemo-toast-title">Badge baru: {badgeToast.label}</div>
            <div className="nemo-toast-desc">{badgeToast.desc}</div>
          </div>
        </div>
      )}
    </div>
  )
}
