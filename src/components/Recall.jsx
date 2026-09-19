import { useMemo, useState, useRef } from 'react'
import { buildOptions } from '../lib/quiz'
import { shuffle } from '../lib/ui'
import { availableDays, listDayItems } from '../lib/ujian-harian'
import {
  dueRecallItems, recallStats, scheduleRecallItems,
  clearRecallItems, categoryOfId, buildRecallResult,
} from '../lib/recall-queue'
import ReviewSalah from './ReviewSalah'
import RecallSetup from './recall/RecallSetup'
import RecallSession from './recall/RecallSession'
import RecallSummary from './recall/RecallSummary'

// Kategori bisa dikombinasikan (pilih satu, dua, atau ketiganya).
const CATS = [
  { key: 'kotoba', label: 'Kotoba', kanji: 'ことば' },
  { key: 'kanji', label: 'Kanji', kanji: '漢字' },
  { key: 'bunpou', label: 'Bunpou', kanji: '文法' },
]
const ALL_CATS = CATS.map((c) => c.key)
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.key, c.label]))

const MAX_Q = 40

// Recall — ulangi materi lampau: pilih tanggal + kategori, progres per kategori
// terdeteksi; yang belum hafal otomatis dijadwalkan ulang besok.
export default function Recall({ onBack, onSaveResult, onQueueChange }) {
  const days = useMemo(() => availableDays(), [])

  // Peta date → item (sekali saja) agar penggabungan tanggal murah.
  const itemsByDate = useMemo(() => {
    const m = {}
    for (const d of days) {
      m[d.date] = listDayItems(d.date).map((it) => ({ ...it, category: categoryOfId(it.id) }))
    }
    return m
  }, [days])

  // Pool pengecoh global (semua item lampau) agar soal tetap punya 4 pilihan.
  const globalPool = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const d of days) {
      for (const it of itemsByDate[d.date]) {
        if (seen.has(it.id)) continue
        seen.add(it.id)
        out.push(it)
      }
    }
    return out
  }, [days, itemsByDate])

  const [selectedDates, setSelectedDates] = useState([])
  const [cats, setCats] = useState(ALL_CATS)
  const [phase, setPhase] = useState('setup') // setup | scene | summary | review
  const [order, setOrder] = useState([])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState(null)
  const [queueTick, setQueueTick] = useState(0)
  const wrongRef = useRef([])
  const wrongEntriesRef = useRef([])
  const finishRanRef = useRef(false)

  const stats = useMemo(() => recallStats(), [queueTick, phase])
  const duePool = useMemo(
    () => dueRecallItems().filter((it) => cats.includes(it.category)),
    [queueTick, cats],
  )

  const pool = useMemo(() => {
    if (!selectedDates.length) return []
    const seen = new Set()
    const out = []
    for (const date of selectedDates) {
      for (const it of itemsByDate[date] || []) {
        if (seen.has(it.id) || !cats.includes(it.category)) continue
        seen.add(it.id)
        out.push(it)
      }
    }
    return out
  }, [selectedDates, cats, itemsByDate])

  const optionsPool = useMemo(() => {
    if (order.length >= 4) return order
    const merged = [...order]
    const seen = new Set(order.map((e) => e.id))
    for (const e of globalPool) {
      if (merged.length >= 12) break
      if (!seen.has(e.id)) { merged.push(e); seen.add(e.id) }
    }
    return merged
  }, [order, globalPool])

  const entry = order[q]
  const opts = useMemo(
    () => (entry ? buildOptions(entry, optionsPool, 'jp2id') : null),
    [entry, optionsPool],
  )

  // ── Alur sesi ──
  const startDeck = (items) => {
    const deck = shuffle(items).slice(0, MAX_Q)
    setOrder(deck)
    setQ(0)
    setChoice(null)
    setScore(0)
    setResult(null)
    wrongRef.current = []
    wrongEntriesRef.current = []
    finishRanRef.current = false
    setPhase('scene')
  }

  // "Ujian Lagi" dari review → ulangi hanya item yang sebelumnya salah.
  const retryWrong = () => {
    const deck = shuffle([...wrongEntriesRef.current])
    setOrder(deck)
    setQ(0)
    setChoice(null)
    setScore(0)
    wrongRef.current = []
    wrongEntriesRef.current = []
    finishRanRef.current = false
    setPhase('scene')
  }

  const repeatAll = () => {
    setOrder((prev) => shuffle(prev))
    setQ(0)
    setChoice(null)
    setScore(0)
    wrongRef.current = []
    wrongEntriesRef.current = []
    finishRanRef.current = false
    setPhase('scene')
  }

  const finish = () => {
    if (finishRanRef.current) return // cegah simpan/jadwal ganda (double-click/Enter)
    finishRanRef.current = true
    const wrongIds = wrongRef.current.map((w) => w.id)
    const { perCat, notPassed } = buildRecallResult(order, wrongIds, ALL_CATS)

    // Belum hafal → jadwalkan ulang besok. Sudah hafal → keluar dari antrian.
    const wrongItems = order.filter((it) => wrongIds.includes(it.id))
    if (wrongItems.length) scheduleRecallItems(wrongItems, 1)
    clearRecallItems(order.filter((it) => !wrongIds.includes(it.id)).map((it) => it.id))
    setQueueTick((t) => t + 1)
    if (onQueueChange) onQueueChange()

    const total = order.length
    const finalScore = total - wrongIds.length
    if (onSaveResult) {
      onSaveResult({
        score: finalScore,
        total,
        category: 'recall',
        difficulty: 'recall',
        difficultyLabel: 'Recall',
        level: 'recall',
        wrongCount: wrongIds.length,
        categories: Object.keys(perCat),
        date: new Date().toISOString(),
      })
    }

    setResult({ perCat, notPassed, wrongIds })
    setPhase('summary')
  }

  const pick = (opt) => {
    if (choice) return
    const { label } = opts || {}
    setChoice(opt)
    if (opt === label) {
      setScore((s) => s + 1)
      return
    }
    wrongRef.current.push({
      id: entry.id,
      question: entry.front,
      reading: entry.reading || entry.frontSub || '',
      userAnswer: opt,
      correctAnswer: label,
      explanation: entry.backFull || '',
    })
    wrongEntriesRef.current.push(entry)
  }

  const next = () => {
    setChoice(null)
    if (q + 1 >= order.length) finish()
    else setQ(q + 1)
  }

  // ══════════════════════════════════════════════════════════
  // REVIEW SALAH
  // ══════════════════════════════════════════════════════════
  if (phase === 'review') {
    return (
      <ReviewSalah
        wrongItems={wrongRef.current}
        score={order.length - wrongRef.current.length}
        total={order.length}
        difficulty="Recall"
        onRetry={retryWrong}
        onBack={() => setPhase('summary')}
      />
    )
  }

  // ══════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════
  if (phase === 'summary') {
    return (
      <RecallSummary
        result={result}
        order={order}
        onRepeatAll={repeatAll}
        onBack={onBack}
        onSetPhase={setPhase}
        ALL_CATS={ALL_CATS}
        CAT_LABEL={CAT_LABEL}
      />
    )
  }

  // ══════════════════════════════════════════════════════════
  // SCENE
  // ══════════════════════════════════════════════════════════
  if (phase === 'scene') {
    return (
      <RecallSession
        entry={entry}
        opts={opts}
        choice={choice}
        score={score}
        q={q}
        order={order}
        onPick={pick}
        onNext={next}
      />
    )
  }

  // ══════════════════════════════════════════════════════════
  // SETUP
  // ══════════════════════════════════════════════════════════
  return (
    <RecallSetup
      days={days}
      itemsByDate={itemsByDate}
      globalPool={globalPool}
      duePool={duePool}
      stats={stats}
      cats={cats}
      setCats={setCats}
      selectedDates={selectedDates}
      setSelectedDates={setSelectedDates}
      onStart={startDeck}
      onBack={onBack}
      pool={pool}
      CATS={CATS}
      ALL_CATS={ALL_CATS}
      MAX_Q={MAX_Q}
    />
  )
}
