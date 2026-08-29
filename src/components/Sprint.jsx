import { useEffect, useMemo, useRef, useState } from 'react'
import { buildOptions } from '../lib/quiz'
import { byMaterial } from '../data'

const DURATION = 60

// Sprint: pilihan ganda berbatas waktu, score + streak.
export default function Sprint({ material }) {
  const pool = useMemo(() => byMaterial(material), [material])
  const [q, setQ] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [left, setLeft] = useState(DURATION)
  const [choice, setChoice] = useState(null)
  const [running, setRunning] = useState(false)
  const startAt = useRef(0)

  const next = () => {
    if (!pool.length) return
    setChoice(null)
    const e = pool[Math.floor(Math.random() * pool.length)]
    const { label, options } = buildOptions(e, pool)
    setQ({ entry: e, label, options })
  }

  useEffect(() => {
    setLeft(DURATION)
    setScore(0); setStreak(0); setBest(0); setQ(null); setChoice(null); setRunning(false)
  }, [material])

  useEffect(() => {
    let timer
    if (running) {
      timer = setInterval(() => {
        const rem = Math.max(0, DURATION - Math.floor((Date.now() - startAt.current) / 1000))
        setLeft(rem)
        if (rem <= 0) setRunning(false)
      }, 250)
    }
    return () => clearInterval(timer)
  }, [running])

  const start = () => {
    setScore(0); setStreak(0); setBest(0); setRunning(false); setLeft(DURATION)
    startAt.current = Date.now()
    setRunning(true)
    next()
  }

  const pick = (opt) => {
    if (!running || choice || !q) return
    setChoice(opt)
    if (opt === q.label) {
      setScore((s) => s + 1 + streak)
      setStreak((s) => {
        const ns = s + 1
        setBest((b) => Math.max(b, ns))
        return ns
      })
    } else {
      setStreak(0)
    }
  }

  if (!running) {
    return (
      <div className="card center">
        <p style={{ fontSize: '2rem', margin: 0 }}>⚡</p>
        <p>
          Jawab sebanyak mungkin dalam <strong>{DURATION} detik</strong>.
          <br />Benar beruntun memberi poin ekstra.
        </p>
        <div className="row">
          <button className="btn primary" onClick={start}>Mulai Sprint</button>
        </div>
        {score > 0 ? (
          <p className="mt">
            {left === 0 ? 'Waktu habis! ' : ''}Skor terakhir: <strong>{score}</strong> · Streak terbaik: <strong>{best}</strong>
          </p>
        ) : null}
      </div>
    )
  }

  if (!q) return null

  return (
    <>
      <div className="progress-grid" style={{ gridTemplateColumns: '1fr auto', marginBottom: '0.5rem' }}>
        <span className="badge due">Waktu tersisa: {left}s</span>
        <span className="badge ok">Skor {score} · 🔥{streak}</span>
      </div>
      <div className="card">
        <div className="kicker">Sebutkan artinya secepatnya!</div>
        <div className="front" style={{ fontSize: '2.6rem' }}>
          {q.entry.front}
          {q.entry.reading ? <span className="small" style={{ fontSize: '1.2rem' }}>{q.entry.reading}</span> : null}
        </div>
        <div className="row">
          {q.options.map((opt) => {
            let style = undefined
            if (choice) {
              if (opt === q.label) style = { borderColor: 'var(--ok)', color: 'var(--ok)' }
              else if (opt === choice) style = { borderColor: 'var(--err)', color: 'var(--err)' }
            }
            return (
              <button key={opt} className="btn" style={style} onClick={() => pick(opt)}>
                {opt}
              </button>
            )
          })}
        </div>
        {choice ? (
          <p className={`center feedback mt ${choice === q.label ? 'correct' : 'wrong'}`}>
            {choice === q.label ? 'Benar!' : `Salah → ${q.label}`}
            <br />
            <button className="btn primary" style={{ marginTop: '0.5rem' }} onClick={next}>Lanjut (Enter)</button>
          </p>
        ) : null}
      </div>
    </>
  )
}