import { useEffect, useMemo, useState } from 'react'
import { isMastered } from '../lib/srs'
import { buildOptions, answerOf } from '../lib/quiz'
import { shuffle } from '../lib/ui'

// Ujian: menguji kartu yang dikuasai (interval ≥ 21 hari).
// Murni penilaian — jawaban salah TIDAK mengubah progres SRS.
export default function Ujian({ entries, cards, direction = 'jp2id' }) {
  const pool = useMemo(
    () => entries.filter((e) => isMastered(cards[e.id])),
    [entries, cards],
  )

  const [phase, setPhase] = useState('intro') // intro | scene | summary
  const [order, setOrder] = useState([])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [score, setScore] = useState(0)

  const entry = order[q]
  const opts = useMemo(
    () => (entry ? buildOptions(entry, order, direction) : null),
    [entry, order, direction],
  )

  useEffect(() => {
    setPhase('intro')
    setOrder([])
    setQ(0)
    setChoice(null)
    setScore(0)
  }, [entries, cards])

  if (phase === 'intro') {
    return (
      <div className="panel">
        <div className="big-emoji">📝</div>
        <h3>Ujian</h3>
        {pool.length ? (
          <>
            <p>
              Ada <span className="kin-count">{pool.length}</span> kartu dikuasai pada materi ini.
              Ujian menguji seberapa kokoh hafalanmu.
            </p>
            <div className="row mt no-print">
              <button
                className="primary-btn"
                onClick={() => {
                  setOrder(shuffle(pool))
                  setQ(0)
                  setChoice(null)
                  setScore(0)
                  setPhase('scene')
                }}
              >
                Mulai Ujian
              </button>
            </div>
          </>
        ) : (
          <p>
            Belum ada kartu yang dikuasai (interval ≥ 21 hari).
            <br />
            Hafalkan dulu lewat mode <b>Kartu</b>.
          </p>
        )}
      </div>
    )
  }

  if (phase === 'summary') {
    const total = order.length
    const pct = total ? Math.round((score / total) * 100) : 0
    const emoji = pct >= 85 ? '🏆' : pct >= 70 ? '👍' : '📚'
    const note =
      pct >= 85 ? 'Luar biasa!' : pct >= 70 ? 'Bagus, terus lanjut!' : 'Ulangi dulu materinya ya.'
    return (
      <div className="panel">
        <div className="big-emoji">{emoji}</div>
        <h3>
          {score}/{total} ({pct}%)
        </h3>
        <p>{note}</p>
        <div className="row mt no-print">
          <button className="primary-btn" onClick={() => setPhase('intro')}>
            Ujian lagi
          </button>
        </div>
      </div>
    )
  }

  // ---- scene ----
  if (!entry) {
    if (q > 0) setPhase('summary')
    return null
  }

  const { label, options } = opts

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

  const jp2id = direction === 'jp2id'
  const question = jp2id ? entry.front : entry.backShort

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
        <div className="card-top">Ujian · {entry.groupLabel || 'Umum'}</div>
        <div className="card-body" style={{ padding: '14px 4px 8px' }}>
          <div className="word" style={{ fontSize: 'clamp(1.9rem, 8vw, 2.6rem)' }}>
            {question}
          </div>
          {jp2id && entry.reading ? <div className="word-reading">{entry.reading}</div> : null}
          {jp2id && entry.frontSub ? <div className="meaning-sub">{entry.frontSub}</div> : null}
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
            <button
              key={opt}
              className={`opt ${tone}`}
              disabled={!!choice}
              onClick={() => pick(opt)}
            >
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
