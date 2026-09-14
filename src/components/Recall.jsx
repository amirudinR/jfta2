import { useMemo, useState, useRef } from 'react'
import { ArrowLeft, History, RotateCcw, CalendarClock, Check } from 'lucide-react'
import { buildOptions } from '../lib/quiz'
import { shuffle } from '../lib/ui'
import { availableDays, listDayItems, friendlyDate } from '../lib/ujian-harian'
import { dueRecallItems, recallStats, scheduleRecallItems, clearRecallItems } from '../lib/recall-queue'
import ReviewSalah from './ReviewSalah'

// Kategori bisa dikombinasikan (pilih satu, dua, atau ketiganya).
const CATS = [
  { key: 'kotoba', label: 'Kotoba', kanji: 'ことば' },
  { key: 'kanji', label: 'Kanji', kanji: '漢字' },
  { key: 'bunpou', label: 'Bunpou', kanji: '文法' },
]
const ALL_CATS = CATS.map((c) => c.key)
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.key, c.label]))

const PASS_RATE = 0.8 // sebuah kategori dianggap "hafal" bila akurasi >= 80%
const MAX_Q = 40

const categoryOfId = (id) => String(id).split(':')[1]
const labelOf = (c) => CAT_LABEL[c] || c

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

  // ── Aksi setup ──
  const toggleDate = (d) =>
    setSelectedDates((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const selectRecent = (n) => setSelectedDates(days.slice(0, n).map((d) => d.date))

  const toggleCat = (k) =>
    setCats((prev) => {
      if (prev.includes(k)) return prev.length > 1 ? prev.filter((x) => x !== k) : prev
      return ALL_CATS.filter((c) => prev.includes(c) || c === k)
    })

  // ── Alur sesi ──
  const startDeck = (items) => {
    const deck = shuffle(items).slice(0, MAX_Q)
    setOrder(deck)
    setQ(0)
    setChoice(null)
    setScore(0)
    setResult(null)
    wrongRef.current = []
    setPhase('scene')
  }

  const repeatAll = () => {
    setOrder((prev) => shuffle(prev))
    setQ(0)
    setChoice(null)
    setScore(0)
    wrongRef.current = []
    setPhase('scene')
  }

  const finish = () => {
    const wrongSet = new Set(wrongRef.current.map((w) => w.id))

    // Statistik per kategori.
    const perCat = {}
    for (const c of ALL_CATS) {
      const total = order.filter((it) => it.category === c).length
      if (!total) continue
      const wrong = order.filter((it) => it.category === c && wrongSet.has(it.id)).length
      const correct = total - wrong
      const rate = correct / total
      perCat[c] = { total, correct, wrong, rate, passed: rate >= PASS_RATE }
    }

    // Belum hafal → jadwalkan ulang besok. Sudah hafal → keluar dari antrian.
    const wrongItems = order.filter((it) => wrongSet.has(it.id))
    if (wrongItems.length) scheduleRecallItems(wrongItems, 1)
    clearRecallItems(order.filter((it) => !wrongSet.has(it.id)).map((it) => it.id))
    setQueueTick((t) => t + 1)
    if (onQueueChange) onQueueChange()

    const total = order.length
    const finalScore = total - wrongSet.size
    if (onSaveResult) {
      onSaveResult({
        score: finalScore,
        total,
        category: 'recall',
        difficulty: 'recall',
        difficultyLabel: 'Recall',
        level: 'recall',
        wrongCount: wrongSet.size,
        categories: Object.keys(perCat),
        date: new Date().toISOString(),
      })
    }

    const notPassed = ALL_CATS.filter((c) => perCat[c] && !perCat[c].passed)
    setResult({ perCat, notPassed, wrongIds: [...wrongSet] })
    setPhase('summary')
  }

  // ══════════════════════════════════════════════════════════
  // SETUP
  // ══════════════════════════════════════════════════════════
  if (phase === 'setup') {
    const canStartDates = pool.length >= 4
    const dueCount = duePool.length
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

        {/* Item yang belum hafal & sudah jatuh tempo (dijadwalkan ulang otomatis). */}
        {stats.due > 0 ? (
          <div className="ujian-section">
            <label className="ujian-section-label">Perlu Diulang Hari Ini</label>
            <div className="recall-due-card">
              <div className="recall-due-head">
                <CalendarClock size={16} />
                <span>
                  <b>{stats.due}</b> item belum hafal dari sesi sebelumnya
                </span>
              </div>
              <div className="recall-due-cats">
                {CATS.map((c) =>
                  stats.byCat[c.key] ? (
                    <span key={c.key} className="recall-due-tag">
                      {c.label} · {stats.byCat[c.key]}
                    </span>
                  ) : null,
                )}
              </div>
              <button
                className="primary-btn recall-due-btn"
                disabled={!dueCount}
                onClick={() => startDeck(duePool)}
              >
                Ulangi Sekarang{dueCount ? ` (${dueCount})` : ''}
              </button>
            </div>
          </div>
        ) : null}

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
                    <span>{d.date === days[0]?.date ? 'Hari Ini' : friendlyDate(d.date)}</span>
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
          <label className="ujian-section-label">
            Kategori <span className="recall-hint">(boleh pilih lebih dari satu)</span>
          </label>
          <div className="ujian-chips">
            {CATS.map((c) => (
              <button
                key={c.key}
                className={`ujian-chip ${cats.includes(c.key) ? 'active' : ''}`}
                onClick={() => toggleCat(c.key)}
              >
                {cats.includes(c.key) ? <Check size={13} className="recall-check" /> : null}
                {c.label}
              </button>
            ))}
            <button
              className={`ujian-chip ${cats.length === CATS.length ? 'active' : ''}`}
              onClick={() => setCats(ALL_CATS)}
            >
              Semua
            </button>
          </div>
        </div>

        <div className="ujian-start-row">
          <p className="ujian-pool-info">
            {selectedDates.length === 0 ? (
              stats.due > 0
                ? 'Punya item yang perlu diulang — tekan “Ulangi Sekarang” di atas, atau pilih tanggal.'
                : 'Pilih minimal satu tanggal di atas.'
            ) : canStartDates ? (
              <>
                Materi terkumpul: <span className="kin-count">{pool.length}</span> item dari{' '}
                {selectedDates.length} tanggal (maks {MAX_Q} soal).
              </>
            ) : (
              'Materi kurang dari 4 item. Pilih tanggal lain atau tambah kategori.'
            )}
          </p>
          <button className="primary-btn" disabled={!canStartDates} onClick={() => startDeck(pool)}>
            Mulai Recall
          </button>
        </div>

        {stats.pending > 0 ? (
          <p className="recall-pending-note">
            Terjadwal ulang: {stats.pending} item ({stats.total - stats.due} belum jatuh tempo).
          </p>
        ) : null}
      </div>
    )
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
        onRetry={repeatAll}
        onBack={() => setPhase('summary')}
      />
    )
  }

  // ══════════════════════════════════════════════════════════
  // SUMMARY — progres per kategori + pilihan Lanjut / Ulangi
  // ══════════════════════════════════════════════════════════
  if (phase === 'summary') {
    const { perCat, notPassed, wrongIds } = result
    const total = order.length
    const finalScore = total - wrongIds.length
    const pct = total ? Math.round((finalScore / total) * 100) : 0
    const catKeys = ALL_CATS.filter((c) => perCat[c])
    return (
      <div className="recall-summary">
        <h3 className="recall-summary-title">Hasil Recall</h3>
        <div className="recall-score-line">
          <span className="recall-score-big">{pct}%</span>
          <span className="muted">{finalScore}/{total} benar</span>
        </div>

        <div className="recall-cat-list">
          {catKeys.map((c) => {
            const s = perCat[c]
            const p = Math.round(s.rate * 100)
            return (
              <div className="recall-cat-row" key={c}>
                <span className="recall-cat-name">{labelOf(c)}</span>
                <div className="recall-bar">
                  <i className={s.passed ? 'ok' : 'no'} style={{ width: `${p}%` }} />
                </div>
                <span className="recall-cat-num">{s.correct}/{s.total}</span>
                <span className={`recall-cat-badge ${s.passed ? 'ok' : 'no'}`}>
                  {s.passed ? 'Hafal' : 'Belum'}
                </span>
              </div>
            )
          })}
        </div>

        {notPassed.length ? (
          <p className="recall-note warn">
            {notPassed.map(labelOf).join(', ')} belum hafal — otomatis diulang besok.
          </p>
        ) : (
          <p className="recall-note ok">Semua kategori sudah hafal. Mantap!</p>
        )}

        <div className="recall-actions no-print">
          {notPassed.length ? (
            <button className="primary-btn" onClick={repeatAll}>
              <RotateCcw size={14} /> Ulangi Semua
            </button>
          ) : null}
          <button
            className={notPassed.length ? 'link-btn' : 'primary-btn'}
            onClick={() => setPhase('setup')}
          >
            {notPassed.length ? 'Lanjut' : 'Selesai'}
          </button>
          {wrongIds.length ? (
            <button className="link-btn" onClick={() => setPhase('review')}>
              Lihat Jawaban Salah ({wrongIds.length})
            </button>
          ) : null}
          <button className="link-btn" onClick={onBack}>Kembali</button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // SCENE
  // ══════════════════════════════════════════════════════════
  if (!entry) return null

  const { label, options } = opts || { label: '', options: [] }

  const pick = (opt) => {
    if (choice) return
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
        <div className="card-top">
          Recall · {labelOf(entry.category)} · {entry.groupLabel || 'Materi lama'}
        </div>
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
