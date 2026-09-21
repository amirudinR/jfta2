import { useMemo, useState, useRef, useEffect } from 'react'
import { byMaterial } from '../data'
import { buildOptions, buildOptionsHard } from '../lib/quiz'
import { shuffle } from '../lib/ui'
import { availableDays, listDayItems } from '../lib/ujian-harian'
import { todayStr } from '../lib/hafalan-storage'
import { buildExamResult } from '../lib/exam-history'
import {
  loadUjianSession,
  saveUjianSession,
  clearUjianSession,
  encodeOrder,
  decodeOrder,
} from '../lib/ujian-session-store'
import { playResult } from '../lib/sfx'
import ReviewSalah from './ReviewSalah'
import UjianSetup from './ujian/UjianSetup'
import UjianSession from './ujian/UjianSession'
import UjianSummary from './ujian/UjianSummary'

const CATEGORIES = [
  { key: 'kotoba', label: 'Kotoba', icon: 'ことば' },
  { key: 'kanji', label: 'Kanji', icon: '漢字' },
  { key: 'bunpou', label: 'Bunpou', icon: '文法' },
  { key: 'mix', label: 'Campuran', icon: '混合' },
]

const DIFFICULTIES = [
  { key: 'mudah', label: 'Mudah', desc: 'Pilihan jawaban jelas berbeda', icon: '○' },
  { key: 'biasa', label: 'Biasa', desc: 'Pilihan jawaban acak standar', icon: '◎' },
  { key: 'sulit', label: 'Sulit', desc: 'Pilihan jawaban mirip & membingungkan', icon: '◉' },
]

const LEVEL_MATERIALS = {
  a2: { kotoba: 'kotoba', kanji: 'kanji', bunpou: 'bunpo' },
  n3: { kotoba: 'kotoba-n3', kanji: 'kanji-n3', bunpou: 'bunpo-n3' },
  n2: { kotoba: 'kotoba-n2', kanji: 'kanji-n2', bunpou: 'bunpo-n2' },
  n1: { kotoba: 'kotoba-n1', kanji: 'kanji-n1', bunpou: 'bunpo-n1' },
}

function getEntriesForExam(level, category) {
  const mats = LEVEL_MATERIALS[level] || LEVEL_MATERIALS.a2
  if (category === 'mix') {
    const all = []
    for (const cat of ['kotoba', 'kanji', 'bunpou']) {
      const src = mats[cat]
      if (src) all.push(...byMaterial(src))
    }
    return all
  }
  const src = mats[category]
  return src ? byMaterial(src) : []
}

// Jeda sebelum auto-next (ms). Cukup untuk melihat feedback benar/salah.
const AUTO_NEXT_DELAY = 800

export default function UjianBaru({ level, onBack, onSaveResult, prefs = {}, onPrefs = () => {} }) {
  // Auto-next: begitu jawaban dipilih, otomatis lanjut setelah jeda singkat.
  // Default aktif; bisa dimatikan dari halaman setup Ujian (disimpan permanen).
  const autoNext = prefs.autoNext !== false
  // Snapshot sesi yang tersimpan (dibaca SEKALI lewat initializer lazy).
  // Dipakai untuk memulihkan konfigurasi + state quiz saat refresh (F5).
  const [restored] = useState(() => loadUjianSession())

  const [phase, setPhase] = useState(restored ? 'scene' : 'setup') // setup | scene | summary | review
  const [category, setCategory] = useState(restored?.category ?? 'mix')
  const [difficulty, setDifficulty] = useState(restored?.difficulty ?? 'biasa')
  const [scope, setScope] = useState(restored?.scope ?? 'all')
  const [selectedDates, setSelectedDates] = useState(
    Array.isArray(restored?.selectedDates) ? restored.selectedDates : [],
  )

  const days = useMemo(() => availableDays(level), [level])

  const availCats = useMemo(() => {
    const mats = LEVEL_MATERIALS[level] || LEVEL_MATERIALS.a2
    return CATEGORIES.filter((c) => {
      if (c.key === 'mix') return true
      return !!mats[c.key]
    })
  }, [level])

  const pool = useMemo(() => {
    if (scope === 'today' || scope === 'dates') {
      const dates = scope === 'today' ? [todayStr()].filter(Boolean) : selectedDates
      if (!dates.length) return []
      const items = []
      for (const d of dates) {
        // Batasi persis ke level aktif → materi ujian tidak tercampur antar-level.
        items.push(...listDayItems(d, level))
      }
      if (category !== 'mix') {
        // Filter pakai field eksplisit `category` (bukan parsing string id).
        return items.filter((it) => it.category === category)
      }
      return items
    }
    return getEntriesForExam(level, category)
  }, [level, category, scope, selectedDates, days])

  // Quiz state
  const [order, setOrder] = useState([])
  const [q, setQ] = useState(restored?.q ?? 0)
  const [choice, setChoice] = useState(restored?.choice ?? null)
  const [score, setScore] = useState(restored?.score ?? 0)
  const [streak, setStreak] = useState(restored?.streak ?? 0) // jawaban benar berturut-turut
  const [bestStreak, setBestStreak] = useState(restored?.bestStreak ?? 0)
  // startedAt valid → hitung elapsed awal agar timer tak balik ke 0 saat resume.
  const restoredStartedAt =
    typeof restored?.startedAt === 'number' && restored.startedAt > 0
      ? restored.startedAt
      : 0
  const [elapsed, setElapsed] = useState(() =>
    restoredStartedAt ? Math.floor((Date.now() - restoredStartedAt) / 1000) : 0,
  )
  const startedAtRef = useRef(restoredStartedAt || Date.now())
  const wrongRef = useRef(Array.isArray(restored?.wrong) ? restored.wrong : []) // track wrong answers
  const finishRan = useRef(false) // guard agar finishExam hanya dieksekusi sekali
  // True selama menunggu order di-decode → cegah safety-net mem-finish dini.
  const restoringRef = useRef(!!restored)
  const restoreRanRef = useRef(false) // guard efek decode agar jalan sekali
  const advanceTimerRef = useRef(null) // timeout auto-next yang sedang berjalan
  const advancedRef = useRef(false) // cegah lanjut dobel (auto + klik manual)

  const entry = order[q]
  const direction = 'jp2id'

  const opts = useMemo(() => {
    if (!entry) return null
    if (difficulty === 'sulit') return buildOptionsHard(entry, order, direction)
    if (difficulty === 'mudah') return buildOptions(entry, order, direction, true)
    return buildOptions(entry, order, direction)
  }, [entry, order, direction, difficulty])

  // Pulihkan `order` sesi tersimpan: dilakukan sekali setelah `pool` siap,
  // karena pool bergantung pada konfigurasi yang baru saja direstorasi.
  useEffect(() => {
    if (restoreRanRef.current) return
    if (!restored) return
    if (order.length > 0) { restoreRanRef.current = true; restoringRef.current = false; return }
    if (!pool) return // tunggu pool terbentuk
    const decoded = decodeOrder(restored.order, pool)
    restoreRanRef.current = true
    if (decoded && decoded.length > 0) {
      setOrder(decoded)
      restoringRef.current = false
    } else {
      // Data berubah / level berganti → batalkan resume dengan rapi.
      clearUjianSession()
      restoringRef.current = false
      setPhase('setup')
    }
  }, [restored, pool, order])

  // Simpan progres sesi setiap state relevan berubah selama fase 'scene'.
  // Tidak menyimpan saat non-scene → ujian selesai tak bisa di-resume.
  useEffect(() => {
    if (phase !== 'scene' || order.length === 0 || restoringRef.current) return
    saveUjianSession({
      level,
      category,
      difficulty,
      scope,
      selectedDates,
      phase,
      order: encodeOrder(order),
      q,
      choice,
      score,
      streak,
      bestStreak,
      startedAt: startedAtRef.current,
      wrong: wrongRef.current,
    })
  }, [
    phase,
    order,
    q,
    choice,
    score,
    streak,
    bestStreak,
    level,
    category,
    difficulty,
    scope,
    selectedDates,
  ])

  // Safety net: bila scene kehabisan kartu, selesaikan lewat efek — dilarang
  // memanggil finishExam (yang menulis hasil) saat render berlangsung.
  // DILEWATI selama restore pending (order masih [] sementara phase='scene').
  useEffect(() => {
    if (phase !== 'scene' || restoringRef.current || order.length === 0) return
    if (order[q] || finishRan.current) return
    finishRan.current = true
    if (q > 0) finishExam()
    else setPhase('setup')
  }, [phase, order, q])

  // Timer sesi: berjalan selama fase 'scene' (hanya detik, ringan).
  useEffect(() => {
    if (phase !== 'scene') return
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const start = () => {
    const deck = shuffle(pool)
    finishRan.current = false
    // Ujian baru menimpa snapshot lama; hapus dulu agar tidak ada sisa sesi.
    clearUjianSession()
    setOrder(deck)
    setQ(0)
    setChoice(null)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setElapsed(0)
    startedAtRef.current = Date.now()
    wrongRef.current = []
    setPhase('scene')
  }

  const toggleDate = (d) => {
    setSelectedDates((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    )
  }

  const finishExam = () => {
    const diffLabel = DIFFICULTIES.find((d) => d.key === difficulty)?.label || ''
    if (onSaveResult) {
      onSaveResult(buildExamResult({
        score,
        total: order.length,
        category,
        difficulty,
        difficultyLabel: diffLabel,
        level,
        wrongCount: wrongRef.current.length,
      }))
    }
    // Ujian selesai → snapshot scene dihapus agar tidak ikut ter-resume.
    clearUjianSession()
    setPhase('summary')
  }

  // Kembali ke setup (retry) → pastikan tak ada snapshot scene yang tersisa.
  const backToSetup = () => {
    clearUjianSession()
    setPhase('setup')
  }

  // Lanjut ke soal berikutnya (atau selesaikan ujian). Dijaga `advancedRef`
  // agar auto-next & klik manual TIDAK pernah lanjut dua kali untuk soal sama.
  const advance = () => {
    if (advancedRef.current) return
    advancedRef.current = true
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null }
    setChoice(null)
    if (q + 1 >= order.length) finishExam()
    else setQ(q + 1)
  }

  const pick = (opt) => {
    if (choice) return
    setChoice(opt)
    const { label } = opts || {}
    playResult(opt === label)
    if (opt === label) {
      setScore((s) => s + 1)
      setStreak((prev) => {
        const nextStreak = prev + 1
        setBestStreak((b) => (nextStreak > b ? nextStreak : b))
        return nextStreak
      })
    } else {
      setStreak(0)
      wrongRef.current.push({
        question: entry.front,
        reading: entry.reading || entry.frontSub || '',
        userAnswer: opt,
        correctAnswer: label,
        explanation: entry.backFull || '',
      })
    }
    // Auto-next: jadwalkan lanjut otomatis setelah jeda singkat, kecuali
    // dimatikan. Soal terakhir → langsung tampilkan hasil.
    advancedRef.current = false
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null }
    if (autoNext) {
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null
        advance()
      }, AUTO_NEXT_DELAY)
    }
  }

  // Tombol "Lanjut" manual — membatalkan timer auto-next yang tertunda.
  const next = () => advance()

  // Bersihkan timer auto-next saat unmount (cegah setState di komponen hilang).
  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  if (phase === 'setup') {
    return (
      <UjianSetup
        availCats={availCats}
        category={category}
        setCategory={setCategory}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        scope={scope}
        setScope={setScope}
        days={days}
        selectedDates={selectedDates}
        toggleDate={toggleDate}
        pool={pool}
        level={level}
        onStart={start}
        onBack={onBack}
        DIFFICULTIES={DIFFICULTIES}
        autoNext={autoNext}
        onToggleAutoNext={() => onPrefs({ autoNext: !autoNext })}
      />
    )
  }

  if (phase === 'review') {
    const diffLabel = DIFFICULTIES.find((d) => d.key === difficulty)?.label || ''
    return (
      <ReviewSalah
        wrongItems={wrongRef.current}
        score={score}
        total={order.length}
        difficulty={diffLabel}
        onRetry={backToSetup}
        onBack={onBack}
      />
    )
  }

  if (phase === 'summary') {
    return (
      <UjianSummary
        score={score}
        order={order}
        wrongRef={wrongRef}
        difficulty={difficulty}
        onRetry={backToSetup}
        onBack={onBack}
        onShowReview={() => setPhase('review')}
        DIFFICULTIES={DIFFICULTIES}
      />
    )
  }

  // scene
  return (
    <UjianSession
      entry={entry}
      opts={opts}
      choice={choice}
      score={score}
      q={q}
      order={order}
      difficulty={difficulty}
      category={category}
      streak={streak}
      bestStreak={bestStreak}
      elapsed={elapsed}
      onPick={pick}
      onNext={next}
      DIFFICULTIES={DIFFICULTIES}
    />
  )
}
