import { useEffect, useMemo, useState } from 'react'
import { buildOptions } from '../lib/quiz'
import { byMaterial } from '../data'
import { isMastered } from '../lib/srs'
import { shuffle } from '../lib/ui'

// Ujian: hanya menguji kartu yang sudah dikuasai (interval ≥ 21 hari).
// Jawaban salah → diturunkan setara "Again".
export default function Ujian({ material, cards, onGrade }) {
  const pool = useMemo(() => byMaterial(material).filter((e) => isMastered(cards[e.id])), [cards, material])
  const order = useMemo(() => shuffle(pool), [pool])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    setQ(0); setChoice(null); setScore(0); setResult(null)
  }, [material])

  if (!pool.length) {
    return (
      <div className="card center">
        <p style={{ fontSize: '2rem', margin: 0 }}>📖</p>
        <p>
          Belum ada kartu yang dikuasai (interval ≥ 21 hari).
          <br />
          Hafalkan dulu lewat mode <strong>Kartu</strong> hingga minimal <strong>21 hari</strong> interval.
        </p>
        <p className="muted">Kartu yang dikuasai akan muncul di sini.</p>
      </div>
    )
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100)
    return (
      <div className="card center">
        <p style={{ fontSize: '2rem', margin: 0 }}>🏅</p>
        <p>
          Nilai ujian: <strong>{result.score}/{result.total}</strong> ({pct}%)
        </p>
        <p className="muted">
          {result.demoted > 0 ? `${result.demoted} kartu diturunkan (lupa) dan akan diulang lewat Kartu.` : 'Semua lancar! Pertahankan.'}
        </p>
        <div className="row">
          <button className="btn primary" onClick={() => { setQ(0); setChoice(null); setScore(0); setResult(null) }}>
            Ujian lagi
          </button>
        </div>
      </div>
    )
  }

  const entry = order[q]
  if (!entry) return null
  const { label, options } = useMemo(() => buildOptions(entry, pool), [entry, pool])

  const pick = (opt) => {
    if (choice) return
    setChoice(opt)
    if (opt === label) {
      setScore((s) => s + 1)
    } else {
      // salah → demote setara Again
      const pre = cards[entry.id]
      onGrade(entry.id, 'again', pre, { source: 'ujian' })
    }
  }

  const next = () => {
    setChoice(null)
    if (q + 1 >= order.length) setResult({ score, total: order.length, demoted: order.length - score })
    else setQ(q + 1)
  }

  return (
    <>
      <div className="progress-grid" style={{ gridTemplateColumns: 'auto auto 1fr', marginBottom: '0.5rem' }}>
        <span className="badge">Ujian {q + 1}/{order.length}</span>
        <span className="badge ok">Benar {score}</span>
        <span className="badge muted">Hanya kartu dikuasai</span>
      </div>
      <div className="card">
        <div className="kicker">Ujian kartu yang dikuasai</div>
        <div className="front" style={{ fontSize: '2.6rem' }}>
          {entry.front}
          {entry.reading ? <span className="small" style={{ fontSize: '1.2rem' }}>{entry.reading}</span> : null}
        </div>
        <div className="row">
          {options.map((opt) => {
            let style = undefined
            if (choice) {
              if (opt === label) style = { borderColor: 'var(--ok)', color: 'var(--ok)' }
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
          <p className={`center feedback mt ${choice === label ? 'correct' : 'wrong'}`}>
            {choice === label ? 'Benar!' : `Salah → ${label}. Kartu ini diturunkan.`}
            <br />
            <button className="btn primary" style={{ marginTop: '0.5rem' }} onClick={next}>Lanjut</button>
          </p>
        ) : null}
      </div>
    </>
  )
}