import { useMemo, useState, useRef } from 'react'
import { ArrowLeft, History, RotateCcw } from 'lucide-react'
import { buildOptions } from '../lib/quiz'
import { shuffle } from '../lib/ui'
import { availableDays, listDayItems, friendlyDate } from '../lib/ujian-harian'
import ReviewSalah from './ReviewSalah'

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'kotoba', label: 'Kotoba' },
  { key: 'kanji', label: 'Kanji' },
  { key: 'bunpou', label: 'Bunpou' },
]

const categoryOfId = (id) => String(id).split(':')[1]

// Recall — ulangi/uji materi dari tanggal-tanggal lampau (multi-select).
export default function Recall({ onBack, onSaveResult }) {
  const days = useMemo(() => availableDays(), [])
  const [selectedDates, setSelectedDates] = useState([])
  const [category, setCategory] = useState('all')
  const [phase, setPhase] = useState('setup') // setup | scene | summary | review
  const [order, setOrder] = useState([])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [score, setScore] = useState(0)
  const wrongRef = useRef([])

  const pool = useMemo(() => {
    if (!selectedDates.length) return []
    const seen = new Set()
    const out = []
    for (const d of selectedDates) {
      for (const it of listDayItems(d)) {
        if (seen.has(it.id)) continue
        seen.add(it.id)
        out.push(it)
      }
    }
    if (category === 'all') return out
    return out.filter((it) => categoryOfId(it.id) === category)
  }, [selectedDates, category])

  const entry = order[q]
  const opts = useMemo(() => (entry ? buildOptions(entry, order, 'jp2id') : null), [entry, order])

  const toggleDate = (d) => {
    setSelectedDates((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  const selectRecent = (n) => setSelectedDates(days.slice(0, n).map((d) => d.date))

  const start = () => {
    const deck = shuffle(pool).slice(0, 30)
    setOrder(deck)
    setQ(0)
    setChoice(null)
    setScore(0)
    wrongRef.current = []
    setPhase('scene')
  }

  const finish = () => {
    if (onSaveResult) {
      onSaveResult({
        score,
        total: order.length,
        category: 'recall-' + category,
        difficulty: 'recall',
        difficultyLabel: 'Recall',
        level: 'recall',
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
      <div className="recall-root">
        <button className="ujian-setup-back" onClick={onBack} title="Kembali">
          <ArrowLeft size={18} />
        </button>

        <div className="ujian-setup-header">
          <History size={22} className="ujian-setup-icon" />
          <h2>Recall</h2>
          <p>Ulangi materi dari tanggal lampau</p>
        </div>

        <div className="ujian-section">
          <label className="ujian-section-label">Pilih Tanggal</label>

          {days.length ? (
            <>
              <div className="recall-quick">
                <button className="ujian-chip" onClick={() => selectRecent(3)}>3 hari terakhir</button>
                <button className="ujian-chip" onClick={() => selectRecent(7)}>7 hari terakhir</button>
                <button className="ujian-chip" onClick={() => setSelectedDates(days.map((d) => d.date))}>
                  Semua
                </button>
                <button className="ujian-chip" onClick={() => setSelectedDates([])}>Kosongkan</button>
              </div>

              <div className="ujian-date-pick">
                {days.map((d) => (
                  <button
                    key={d.date}
                    className={`ujian-date-chip ${selectedDates.includes(d.date) ? 'active' : ''}`}
                    onClick={() => toggleDate(d.date)}
                  >
                    <span>{d.date === days[0]?.date ? `Hari Ini` : friendlyDate(d.date)}</span>
                    <span className="ujian-date-count">{d.count}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="ujian-no-dates">
              Belum ada riwayat belajar. Centang materi di Hafalan Harian dulu.
            </p>
          )}
        </div>

        <div className="ujian-section">
          <label className="ujian-section-label">Kategori</label>
          <div className="ujian-chips">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`ujian-chip ${category === c.key ? 'active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ujian-start-row">
          <p className="ujian-pool-info">
            {selectedDates.length === 0 ? (
              'Pilih minimal satu tanggal di atas.'
            ) : canStart ? (
              <>
                Materi terkumpul: <span className="kin-count">{pool.length}</span> item dari{' '}
                {selectedDates.length} tanggal (maks 30 soal).
              </>
            ) : (
              'Materi kurang dari 4 item. Pilih tanggal lain atau ganti kategori.'
            )}
          </p>
          <button className="primary-btn" disabled={!canStart} onClick={start}>
            Mulai Recall
          </button>
        </div>
      </div>
    )
  }

  // ── Review Salah ──
  if (phase === 'review') {
    return (
      <ReviewSalah
        wrongItems={wrongRef.current}
        score={score}
        total={order.length}
        difficulty="Recall"
        onRetry={() => setPhase('setup')}
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
      ? 'Mantap! Materi lama masih kuat.'
      : pct >= 70
        ? 'Bagus, sedikit lagi kamu ingat semua.'
        : 'Masih lupa — ulangi lagi besok ya.'
    const hasWrong = wrongRef.current.length > 0
    return (
      <div className="panel">
        <div className="big-emoji">{emoji}</div>
        <h3>{score}/{total} ({pct}%)</h3>
        <p>{note}</p>
        <p className="muted" style={{ fontSize: 12 }}>Recall · materi lama</p>
        <div className="row mt no-print" style={{ flexDirection: 'column', alignItems: 'center' }}>
          {hasWrong ? (
            <button className="primary-btn" onClick={() => setPhase('review')}>
              Lihat Jawaban Salah ({wrongRef.current.length})
            </button>
          ) : null}
          <button className={hasWrong ? 'link-btn' : 'primary-btn'} onClick={() => setPhase('setup')}>
            <RotateCcw size={14} /> Recall Lagi
          </button>
          <button className="link-btn" onClick={onBack}>Kembali</button>
        </div>
      </div>
    )
  }

  // ── Scene ──
  if (!entry) {
    if (q > 0) finish()
    return null
  }

  const { label, options } = opts || { label: '', options: [] }

  const pick = (opt) => {
    if (choice) return
    setChoice(opt)
    if (opt === label) setScore((s) => s + 1)
    else {
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
    if (q + 1 >= order.length) finish()
    else setQ(q + 1)
  }

  return (
    <>
      <div className="quiz-stats no-print">
        <span className="qstat">Soal <b>{q + 1}</b>/{order.length}</span>
        <span className="qstat ok">Benar <b>{score}</b></span>
        <span className="qstat err">Salah <b>{q - score}</b></span>
        <span className="qstat" style={{ marginLeft: 'auto', fontSize: 11 }}>· Recall</span>
      </div>

      <div className="quiz-card">
        <div className="card-top">Recall · {entry.groupLabel || 'Materi lama'}</div>
        <div className="card-body" style={{ padding: '14px 4px 8px' }}>
          <div className="word" style={{ fontSize: 'clamp(1.9rem, 8vw, 2.6rem)' }}>
            {entry.front}
          </div>
          {entry.reading ? <div className="word-reading">{entry.reading}</div> : null}
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
