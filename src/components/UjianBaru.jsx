import { useMemo, useState, useRef, useEffect } from 'react'
import { byMaterial } from '../data'
import { buildOptions, buildOptionsHard } from '../lib/quiz'
import { shuffle } from '../lib/ui'
import { availableDays, listDayItems } from '../lib/ujian-harian'
import { buildExamResult } from '../lib/exam-history'
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

export default function UjianBaru({ level, onBack, onSaveResult }) {
  const [phase, setPhase] = useState('setup') // setup | scene | summary | review
  const [category, setCategory] = useState('mix')
  const [difficulty, setDifficulty] = useState('biasa')
  const [scope, setScope] = useState('all')
  const [selectedDates, setSelectedDates] = useState([])

  const days = useMemo(() => availableDays(), [])

  const availCats = useMemo(() => {
    const mats = LEVEL_MATERIALS[level] || LEVEL_MATERIALS.a2
    return CATEGORIES.filter((c) => {
      if (c.key === 'mix') return true
      return !!mats[c.key]
    })
  }, [level])

  const pool = useMemo(() => {
    if (scope === 'today' || scope === 'dates') {
      const dates = scope === 'today' ? [days[0]?.date].filter(Boolean) : selectedDates
      if (!dates.length) return []
      const items = []
      for (const d of dates) {
        items.push(...listDayItems(d))
      }
      if (category !== 'mix') {
        return items.filter((it) => {
          const id = it.id || ''
          if (category === 'kotoba') return id.includes(':kotoba:')
          if (category === 'kanji') return id.includes(':kanji:')
          if (category === 'bunpou') return id.includes(':bunpou:')
          return true
        })
      }
      return items
    }
    return getEntriesForExam(level, category)
  }, [level, category, scope, selectedDates, days])

  // Quiz state
  const [order, setOrder] = useState([])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [score, setScore] = useState(0)
  const wrongRef = useRef([]) // track wrong answers
  const finishRan = useRef(false) // guard agar finishExam hanya dieksekusi sekali

  const entry = order[q]
  const direction = 'jp2id'

  const opts = useMemo(() => {
    if (!entry) return null
    if (difficulty === 'sulit') return buildOptionsHard(entry, order, direction)
    if (difficulty === 'mudah') return buildOptions(entry, order, direction, true)
    return buildOptions(entry, order, direction)
  }, [entry, order, direction, difficulty])

  // Safety net: bila scene kehabisan kartu, selesaikan lewat efek — dilarang
  // memanggil finishExam (yang menulis hasil) saat render berlangsung.
  useEffect(() => {
    if (phase !== 'scene' || order[q] || finishRan.current) return
    finishRan.current = true
    if (q > 0) finishExam()
    else setPhase('setup')
  }, [phase, order, q])

  const start = () => {
    const deck = shuffle(pool)
    finishRan.current = false
    setOrder(deck)
    setQ(0)
    setChoice(null)
    setScore(0)
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
    setPhase('summary')
  }

  const pick = (opt) => {
    if (choice) return
    setChoice(opt)
    const { label } = opts || {}
    if (opt === label) {
      setScore((s) => s + 1)
    } else {
      wrongRef.current.push({
        question: entry.front,
        reading: entry.reading || entry.frontSub || '',
        userAnswer: opt,
        correctAnswer: label,
        explanation: entry.backFull || '',
      })
    }
  }

  const next = () => {
    setChoice(null)
    if (q + 1 >= order.length) finishExam()
    else setQ(q + 1)
  }

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
        onStart={start}
        onBack={onBack}
        DIFFICULTIES={DIFFICULTIES}
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
        onRetry={() => { setPhase('setup') }}
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
        onRetry={() => setPhase('setup')}
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
      onPick={pick}
      onNext={next}
      DIFFICULTIES={DIFFICULTIES}
    />
  )
}
