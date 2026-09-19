import { useMemo, useState, useEffect } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { availableDays, listDayItems, friendlyDate } from '../../lib/ujian-harian'
import { todayStr } from '../../lib/hafalan-storage'
import { axisQuestionOf, buildOptionsAxis } from '../../lib/quiz'
import { shuffle } from '../../lib/ui'

const AXES = [
  { key: 'kanji', label: 'Dari Kanji', hint: 'Tampilkan cara baca' },
  { key: 'hiragana', label: 'Dari Hiragana' },
  { key: 'arti', label: 'Dari Arti' },
]

const CATS = [
  { key: 'kotoba', label: 'Kotoba' },
  { key: 'kanji', label: 'Kanji' },
  { key: 'bunpou', label: 'Bunpou' },
]
const ALL_CATS = CATS.map((c) => c.key)

const catOfId = (id) => String(id).split(':')[1]

// Ujian Harian: uji item yang dicentang pada satu tanggal (riwayat).
export function UjianHarian({ onBack }) {
  const days = useMemo(() => availableDays(), [])
  const today = todayStr()
  const [date, setDate] = useState(() => (days.some((d) => d.date === today) ? today : (days[0]?.date ?? null)))
  const [cats, setCats] = useState(ALL_CATS)
  const [axis, setAxis] = useState('kanji')
  const [phase, setPhase] = useState('intro') // intro | scene | summary
  const [order, setOrder] = useState([])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [score, setScore] = useState(0)

  const allPool = useMemo(() => (date ? listDayItems(date) : []), [date])

  // Reset category selection when date changes: only show available cats
  useEffect(() => {
    const present = new Set(allPool.map((it) => catOfId(it.id)))
    setCats(ALL_CATS.filter((c) => present.has(c)))
  }, [date, allPool])

  const pool = useMemo(
    () => allPool.filter((it) => cats.includes(catOfId(it.id))),
    [allPool, cats],
  )

  // Breakdown counts for the selected date
  const breakdown = useMemo(() => {
    const counts = { kotoba: 0, kanji: 0, bunpou: 0 }
    for (const it of allPool) {
      const cat = catOfId(it.id)
      if (counts[cat] !== undefined) counts[cat]++
    }
    return counts
  }, [allPool])

  const entry = order[q]
  const opts = useMemo(
    () => (entry ? buildOptionsAxis(entry, pool, axis) : null),
    [entry, pool, axis],
  )

  // Safety net: transisi ke summary lewat efek, bukan setState saat render.
  useEffect(() => {
    if (phase === 'scene' && !order[q]) setPhase('summary')
  }, [phase, order, q])

  const toggleCat = (k) => {
    setCats((prev) => {
      if (prev.includes(k)) return prev.length > 1 ? prev.filter((c) => c !== k) : prev
      return [...prev, k]
    })
  }

  const start = () => {
    setOrder(shuffle(pool))
    setQ(0)
    setChoice(null)
    setScore(0)
    setPhase('scene')
  }

  if (phase === 'intro') {
    return (
      <div className="hh-exam">
        <button className="hh-settings-btn" onClick={onBack} title="Kembali">
          <ArrowLeft size={16} />
        </button>
        <div className="big-emoji">📝</div>
        <h3 className="hh-exam-title">Ujian Harian</h3>
        {days.length ? (
          <>
            <div className="hh-day-row">
              {days.map((d) => (
                <button
                  key={d.date}
                  className={`hh-day-chip ${d.date === date ? 'active' : ''}`}
                  onClick={() => setDate(d.date)}
                >
                  <span className="hh-day-label">
                    {d.date === today ? 'Hari Ini' : friendlyDate(d.date)}
                  </span>
                  <span className="hh-day-count">{d.count}</span>
                </button>
              ))}
            </div>

            <div className="ujian-section" style={{ marginTop: 10 }}>
              <label className="ujian-section-label">Kategori</label>
              <div className="ujian-chips">
                {CATS.map((c) => {
                  const avail = breakdown[c.key] > 0
                  return (
                    <button
                      key={c.key}
                      className={`ujian-chip ${cats.includes(c.key) ? 'active' : ''}`}
                      onClick={() => toggleCat(c.key)}
                      disabled={!avail}
                      title={!avail ? 'Tidak ada item untuk kategori ini pada tanggal ini' : undefined}
                    >
                      {cats.includes(c.key) && avail ? <Check size={13} /> : null}
                      <span>{c.label}</span>
                      {avail ? <span className="ujian-chip-icon" style={{ marginLeft: 4 }}>{breakdown[c.key]}</span> : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="hh-tabs" style={{ marginTop: 10 }}>
              {AXES.map((a) => (
                <button
                  key={a.key}
                  className={`hh-tab ${axis === a.key ? 'active' : ''}`}
                  onClick={() => setAxis(a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <p className="hh-exam-note">
              {CATS
                .filter((c) => cats.includes(c.key) && breakdown[c.key] > 0)
                .map((c) => `${breakdown[c.key]} ${c.label.toLowerCase()}`)
                .join(' + ')}{' '}
              = <span className="kin-count">{pool.length}</span> soal
              {date === today ? ' hari ini' : ` pada ${friendlyDate(date)}`},
              mode {axis === 'kanji' ? 'kanji → arti' : axis === 'hiragana' ? 'hiragana → arti' : 'arti → kanji'}.
            </p>

            <div className="row mt no-print">
              <button className="primary-btn" disabled={pool.length < 1} onClick={start}>
                Mulai Ujian ({pool.length})
              </button>
            </div>
          </>
        ) : (
          <p className="hh-exam-note">
            Belum ada riwayat centang. Centang dulu beberapa item di Hafalan Harian, lalu kembali
            ke sini.
          </p>
        )}
      </div>
    )
  }

  if (phase === 'summary') {
    const total = order.length
    const pct = total ? Math.round((score / total) * 100) : 0
    const emoji = pct >= 85 ? '🏆' : pct >= 70 ? '👍' : '📚'
    const note = pct >= 85 ? 'Luar biasa!' : pct >= 70 ? 'Bagus, terus lanjut!' : 'Ulangi dulu ya.'
    return (
      <div className="hh-exam">
        <div className="big-emoji">{emoji}</div>
        <h3 className="hh-exam-title">
          {score}/{total} ({pct}%)
        </h3>
        <p>{note}</p>
        <div className="row mt no-print">
          <button className="primary-btn" onClick={() => setPhase('intro')}>
            Ujian lagi
          </button>
          <button className="link-btn" onClick={onBack}>
            Kembali
          </button>
        </div>
      </div>
    )
  }

  if (!entry) return null

  const { label, options } = opts
  const question = axisQuestionOf(entry, axis)
  const showReading = axis === 'kanji' && entry.reading

  const pick = (opt) => {
    if (choice) return
    setChoice(opt)
    if (opt === label) setScore((s) => s + 1)
  }

  const next = () => {
    setChoice(null)
    if (q + 1 >= order.length) setPhase('summary')
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
      </div>

      <div className="quiz-card">
        <div className="card-top">{entry.groupLabel}</div>
        <div className="card-body" style={{ padding: '14px 4px 8px' }}>
          <div className="word" style={{ fontSize: 'clamp(1.9rem, 8vw, 2.6rem)' }}>
            {question}
          </div>
          {showReading ? <div className="word-reading">{entry.reading}</div> : null}
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