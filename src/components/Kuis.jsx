import { useEffect, useMemo, useState } from 'react'
import { buildOptions, answerOf } from '../lib/quiz'
import { materialOf } from '../data/materials'

// Kuis pilihan ganda — murni latihan, tidak mengubah progres SRS.
export default function Kuis({ entries, material, direction = 'jp2id' }) {
  const order = useMemo(() => [...entries].sort(() => Math.random() - 0.5), [entries])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setQ(0)
    setChoice(null)
    setCorrect(0)
    setStreak(0)
    setBest(0)
    setDone(false)
  }, [material, direction, entries])

  const entry = order[q]
  const info = materialOf(material)

  // Opsi harus stabil per soal — jangan di-acak ulang saat re-render.
  const opts = useMemo(
    () => (entry ? buildOptions(entry, order, direction) : null),
    [entry, order, direction],
  )
  const label = opts?.label

  if (!entry) {
    return (
      <div className="panel">
        <div className="big-emoji">📝</div>
        <h3>Deck kosong</h3>
        <p>Pilih minimal satu pelajaran pada panel kontrol di atas.</p>
      </div>
    )
  }

  if (done) {
    const pct = order.length ? Math.round((correct / order.length) * 100) : 0
    return (
      <div className="panel">
        <div className="big-emoji">{pct >= 80 ? '🎉' : '💪'}</div>
        <h3>Kuis selesai!</h3>
        <p>
          Benar <span className="kin-count">{correct}</span> dari {order.length} ({pct}%) ·
          Runtutan terbaik <span className="kin-count">{best}</span>
        </p>
        <div className="row mt no-print">
          <button
            className="primary-btn"
            onClick={() => {
              setQ(0)
              setChoice(null)
              setCorrect(0)
              setStreak(0)
              setBest(0)
              setDone(false)
            }}
          >
            Ulangi kuis
          </button>
        </div>
      </div>
    )
  }

  const pick = (opt) => {
    if (choice) return
    setChoice(opt)
    if (opt === label) {
      setCorrect((c) => c + 1)
      setStreak((s) => {
        const ns = s + 1
        setBest((b) => Math.max(b, ns))
        return ns
      })
    } else {
      setStreak(0)
    }
  }

  const next = () => {
    setChoice(null)
    if (q + 1 >= order.length) setDone(true)
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
          Benar <b>{correct}</b>
        </span>
        <span className="qstat">
          Runtutan <b>{streak}</b>
        </span>
      </div>

      <div className="quiz-card">
        <div className="card-top">
          Kuis · {info?.label}
          {entry.groupLabel ? ` · ${entry.groupLabel}` : ''}
        </div>
        <div className="card-body" style={{ padding: '14px 4px 8px' }}>
          <div className="word" style={{ fontSize: 'clamp(1.9rem, 8vw, 2.6rem)' }}>
            {question}
          </div>
          {jp2id && entry.reading ? <div className="word-reading">{entry.reading}</div> : null}
          {jp2id && entry.frontSub ? <div className="meaning-sub">{entry.frontSub}</div> : null}
        </div>
      </div>

      <div className="opt-grid">
        {opts.options.map((opt) => {
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
              {q + 1 >= order.length ? 'Selesai' : 'Lanjut (Enter)'}
            </button>
          </div>
        </>
      ) : (
        <p className="muted no-print" style={{ textAlign: 'center', marginTop: 10 }}>
          Pilih jawaban yang benar.
        </p>
      )}
    </>
  )
}
