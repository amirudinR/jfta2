import { useMemo, useState, useRef, useEffect } from 'react'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { byMaterial } from '../data'
import { buildOptions, buildOptionsHard } from '../lib/quiz'
import { shuffle } from '../lib/ui'
import { availableDays, listDayItems, friendlyDate } from '../lib/ujian-harian'
import ReviewSalah from './ReviewSalah'

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
  n3: { kotoba: 'kotoba-n3', kanji: null, bunpou: null },
  n2: { kotoba: 'kotoba-n2', kanji: null, bunpou: null },
  n1: { kotoba: 'kotoba-n1', kanji: null, bunpou: null },
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
    const maxQ = Math.min(pool.length, 30)
    const deck = shuffle(pool).slice(0, maxQ)
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
    // Save exam result to cloud if callback provided
    if (onSaveResult) {
      const diffLabel = DIFFICULTIES.find((d) => d.key === difficulty)?.label || ''
      onSaveResult({
        score,
        total: order.length,
        category,
        difficulty,
        difficultyLabel: diffLabel,
        level,
        wrongCount: wrongRef.current.length,
        date: new Date().toISOString(),
      })
    }
    setPhase('summary')
  }

  // ── Setup ──
  if (phase === 'setup') {
    const canStart = pool.length >= 4
    return (
      <div className="ujian-setup">
        <button className="ujian-setup-back" onClick={onBack} title="Kembali">
          <ArrowLeft size={18} />
        </button>

        <div className="ujian-setup-header">
          <Settings2 size={22} className="ujian-setup-icon" />
          <h2>Ujian Baru</h2>
          <p>Atur ujianmu sebelum mulai</p>
        </div>

        <div className="ujian-section">
          <label className="ujian-section-label">Kategori Materi</label>
          <div className="ujian-chips">
            {availCats.map((c) => (
              <button
                key={c.key}
                className={`ujian-chip ${category === c.key ? 'active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                <span className="ujian-chip-icon">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ujian-section">
          <label className="ujian-section-label">Tingkat Kesulitan</label>
          <div className="ujian-diff-grid">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                className={`ujian-diff ${difficulty === d.key ? 'active' : ''}`}
                onClick={() => setDifficulty(d.key)}
              >
                <span className="ujian-diff-icon">{d.icon}</span>
                <span className="ujian-diff-label">{d.label}</span>
                <span className="ujian-diff-desc">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ujian-section">
          <label className="ujian-section-label">Cakupan Materi</label>
          <div className="ujian-chips">
            <button className={`ujian-chip ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>
              Semua materi
            </button>
            <button className={`ujian-chip ${scope === 'today' ? 'active' : ''}`} onClick={() => setScope('today')}>
              Hari ini saja
            </button>
            <button className={`ujian-chip ${scope === 'dates' ? 'active' : ''}`} onClick={() => setScope('dates')}>
              Pilih tanggal
            </button>
          </div>

          {scope === 'dates' && (
            <div className="ujian-date-pick">
              {days.length ? (
                days.map((d) => (
                  <button
                    key={d.date}
                    className={`ujian-date-chip ${selectedDates.includes(d.date) ? 'active' : ''}`}
                    onClick={() => toggleDate(d.date)}
                  >
                    <span>{d.date === days[0]?.date ? 'Hari Ini' : friendlyDate(d.date)}</span>
                    <span className="ujian-date-count">{d.count}</span>
                  </button>
                ))
              ) : (
                <p className="ujian-no-dates">Belum ada riwayat belajar.</p>
              )}
            </div>
          )}
        </div>

        <div className="ujian-start-row">
          <p className="ujian-pool-info">
            {canStart ? (
              <>Soal tersedia: <span className="kin-count">{pool.length}</span> (maks 30 soal per sesi)</>
            ) : (
              'Minimal 4 soal diperlukan. Ubah filter di atas.'
            )}
          </p>
          <button className="primary-btn" disabled={!canStart} onClick={start}>
            Mulai Ujian
          </button>
        </div>
      </div>
    )
  }

  // ── Review Salah ──
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

  // ── Summary ──
  if (phase === 'summary') {
    const total = order.length
    const pct = total ? Math.round((score / total) * 100) : 0
    const emoji = pct >= 85 ? '🏆' : pct >= 70 ? '👍' : '📚'
    const note = pct >= 85
      ? 'Luar biasa! Kamu benar-benar paham.'
      : pct >= 70
        ? 'Bagus, sedikit lagi sempurna!'
        : 'Masih perlu latihan. Ulangi materinya ya.'
    const diffLabel = DIFFICULTIES.find((d) => d.key === difficulty)?.label || ''
    const hasWrong = wrongRef.current.length > 0
    return (
      <div className="panel">
        <div className="big-emoji">{emoji}</div>
        <h3>
          {score}/{total} ({pct}%)
        </h3>
        <p>{note}</p>
        <p className="muted" style={{ fontSize: 12 }}>Kesulitan: {diffLabel}</p>
        <div className="row mt no-print" style={{ flexDirection: 'column', alignItems: 'center' }}>
          {hasWrong ? (
            <button className="primary-btn" onClick={() => setPhase('review')}>
              Lihat Jawaban Salah ({wrongRef.current.length})
            </button>
          ) : null}
          <button className={hasWrong ? 'link-btn' : 'primary-btn'} onClick={() => setPhase('setup')}>
            Ujian lagi
          </button>
          <button className="link-btn" onClick={onBack}>
            Kembali
          </button>
        </div>
      </div>
    )
  }

  // ── Scene ──
  if (!entry) return null

  const { label, options } = opts || { label: '', options: [] }
  const question = entry.front
  const diffTag = difficulty === 'sulit' ? ' · Sulit' : difficulty === 'mudah' ? ' · Mudah' : ''

  const pick = (opt) => {
    if (choice) return
    setChoice(opt)
    if (opt === label) {
      setScore((s) => s + 1)
    } else {
      // Track wrong answer
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

  return (
    <>
      <div className="quiz-stats no-print">
        <span className="qstat">
          Soal <b>{q + 1}</b>/{order.length}
        </span>
        <span className="qstat ok">
          Benar <b>{score}</b>
        </span>
        <span className="qstat err">
          Salah <b>{q - score}</b>
        </span>
        <span className="qstat" style={{ marginLeft: 'auto', fontSize: 11 }}>
          {diffTag}
        </span>
      </div>

      <div className="quiz-card">
        <div className="card-top">
          Ujian · {entry.groupLabel || entry.material || 'Umum'}
        </div>
        <div className="card-body" style={{ padding: '14px 4px 8px' }}>
          <div className="word" style={{ fontSize: 'clamp(1.9rem, 8vw, 2.6rem)' }}>
            {question}
          </div>
          {entry.reading ? <div className="word-reading">{entry.reading}</div> : null}
          {entry.frontSub ? <div className="meaning-sub">{entry.frontSub}</div> : null}
        </div>
      </div>

      <div className="opt-grid">
        {options.map((opt) => {
          let tone = ''
          if (choice) {
            if (opt === label) tone = 'correct'
            else if (opt === choice) tone = 'wrong'
          }
          return (
            <button key={opt} className={`opt ${tone}`} disabled={!!choice} onClick={() => pick(opt)}>
              {opt}
            </button>
          )
        })}
      </div>

      {choice ? (
        <>
          <p className={`mt ${choice === label ? 'feedback-ok' : 'feedback-err'}`}>
            {choice === label ? 'Benar!' : `Salah — jawaban: ${label}`}
          </p>
          <div className="next-row no-print">
            <button className="primary-btn" onClick={next}>
              {q + 1 >= order.length ? 'Lihat hasil' : 'Lanjut'}
            </button>
          </div>
        </>
      ) : null}
    </>
  )
}
