import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '../lib/ui'

const SPRINT_SIZE = 20

// Sprint ala desain asli: 20 kartu, stopwatch naik, kartu "Belum hafal" diulang di akhir.
// "Sudah hafal" → grade good; "Belum hafal" → grade again (SRS).
export default function Sprint({ entries, cards, onGrade, material, direction = 'jp2id' }) {
  const order = useMemo(() => shuffle(entries).slice(0, SPRINT_SIZE), [entries])

  const [running, setRunning] = useState(false)
  const [queue, setQueue] = useState([])
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState({ ok: 0, ulang: 0 })
  const [elapsed, setElapsed] = useState(0)
  const startAt = useRef(0)

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, entries])

  useEffect(() => {
    if (!running) return undefined
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startAt.current) / 1000))
    }, 250)
    return () => clearInterval(t)
  }, [running])

  const reset = () => {
    setRunning(false)
    setQueue([])
    setPos(0)
    setFlipped(false)
    setDone({ ok: 0, ulang: 0 })
    setElapsed(0)
  }

  const start = () => {
    setQueue(order)
    setPos(0)
    setFlipped(false)
    setDone({ ok: 0, ulang: 0 })
    setElapsed(0)
    startAt.current = Date.now()
    setRunning(true)
  }

  const reshuffle = () => {
    reset()
  }

  const finish = () => {
    setElapsed(Math.floor((Date.now() - startAt.current) / 1000))
    setRunning(false)
  }

  const answer = (ok) => {
    const entry = queue[pos]
    if (!entry) return
    onGrade(entry.id, ok ? 'good' : 'again', cards[entry.id] || null)
    setDone((d) => (ok ? { ...d, ok: d.ok + 1 } : { ...d, ulang: d.ulang + 1 }))
    const wasLast = pos + 1 >= queue.length
    if (!ok) setQueue((qq) => [...qq, entry])
    setFlipped(false)
    if (wasLast && ok) finish()
    else setPos((p) => p + 1)
  }

  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (!running) {
    return (
      <div className="panel">
        <div className="big-emoji">⚡</div>
        <h3>Sprint {SPRINT_SIZE} kartu</h3>
        <p>
          Balik kartu secepat mungkin. Kartu yang ditandai <b>Belum hafal</b> akan muncul lagi
          di akhir antrean. Waktu berjalan naik (stopwatch).
        </p>
        {elapsed > 0 ? (
          <p>
            Hasil terakhir: <span className="kin-count">{fmtTime(elapsed)}</span> · sudah hafal{' '}
            <span className="kin-count">{done.ok}</span> · diulang{' '}
            <span className="kin-count">{done.ulang}</span>
          </p>
        ) : null}
        <div className="row mt no-print">
          <button className="primary-btn" onClick={start} disabled={!order.length}>
            Mulai Sprint
          </button>
          {elapsed > 0 ? (
            <button className="reset-btn" onClick={reshuffle}>
              Acak 20 baru
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const entry = queue[pos]
  if (!entry) return null

  const jp2id = direction === 'jp2id'
  const front = jp2id ? entry.front : entry.backShort
  const backMain = jp2id ? entry.backShort : entry.front
  const backSub = jp2id ? entry.backFull : entry.reading || entry.frontSub

  return (
    <>
      <div className="meta-bar no-print">
        <span className="meta-box">
          ⏱ <b>{fmtTime(elapsed)}</b>
        </span>
        <span className="meta-box">
          Kartu <b>{pos + 1}</b>/{queue.length}
        </span>
        <span className="meta-box">
          Diulang <b>{done.ulang}</b>
        </span>
        <button className="meta-link" onClick={reshuffle}>
          Acak 20 baru
        </button>
      </div>

      <div
        className="quiz-card"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label="Kartu sprint, ketuk untuk membalik"
      >
        <div className="card-top">Sprint · {entry.groupLabel || 'Umum'}</div>
        <div className="card-body" style={{ padding: '14px 4px 10px' }}>
          {!flipped ? (
            <>
              <div className="word" style={{ fontSize: 'clamp(2rem, 8.5vw, 2.8rem)' }}>
                {front}
              </div>
              <div className="flip-hint">Ketuk untuk membalik</div>
            </>
          ) : (
            <>
              <div className="meaning">{backMain}</div>
              {backSub ? <div className="meaning-sub">{backSub}</div> : null}
            </>
          )}
        </div>
      </div>

      <div className="actions mt no-print">
        <button
          className="act-btn"
          style={{ color: '#e2937f' }}
          onClick={(e) => {
            e.stopPropagation()
            answer(false)
          }}
        >
          Belum hafal
        </button>
        <button
          className="act-btn"
          style={{ color: '#b9d4a1' }}
          onClick={(e) => {
            e.stopPropagation()
            answer(true)
          }}
        >
          Sudah hafal ✓
        </button>
      </div>
    </>
  )
}
