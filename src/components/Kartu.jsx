import { useEffect, useMemo, useRef, useState } from 'react'
import { isDue, isMastered } from '../lib/srs'
import { fmtInterval } from '../lib/ui'

const GRADES = [
  { key: 'again', label: 'Lupa', sub: 'ulang sekarang', cls: 'g-again', hotkey: '1' },
  { key: 'hard', label: 'Berat', sub: 'interval kecil', cls: 'g-hard', hotkey: '2' },
  { key: 'good', label: 'OK', sub: 'interval normal', cls: 'g-good', hotkey: '3' },
  { key: 'easy', label: 'Mudah', sub: 'interval besar', cls: 'g-easy', hotkey: '4' },
]

export default function Kartu({ entries, cards, onGrade, onlyLearning = false }) {
  const queue = useMemo(() => {
    const list = entries.filter((e) => {
      const c = cards[e.id]
      if (onlyLearning) return c && !isMastered(c)
      return !c || isDue(c)
    })
    list.sort((a, b) => {
      const ca = cards[a.id]
      const cb = cards[b.id]
      const da = ca && isDue(ca) ? 0 : 1
      const db = cb && isDue(cb) ? 0 : 1
      return da - db
    })
    return list
  }, [entries, cards, onlyLearning])

  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const idxRef = useRef(0)

  useEffect(() => {
    idxRef.current = idx
  }, [idx])

  useEffect(() => {
    if (idx >= queue.length) setIdx(0)
  }, [queue.length, idx])

  const entry = queue[Math.min(idx, queue.length - 1)]

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        if (flipped && entry) handleGrade(GRADES[Number(e.key) - 1].key)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const handleGrade = (g) => {
    if (!entry) return
    const pre = cards[entry.id]
    onGrade(entry.id, g, pre)
    setFlipped(false)
    setIdx((i) => Math.min(i + 1, Math.max(queue.length - 1, 0)))
  }

  if (!queue.length) {
    return (
      <div className="card center">
        <p style={{ fontSize: '2rem', margin: 0 }}>✓</p>
        <p>Tidak ada kartu yang perlu diulang.<br />Semua sudah dikuasai!</p>
      </div>
    )
  }

  const c = cards[entry.id]

  return (
    <>
      <div className="progress-grid" style={{ gridTemplateColumns: 'auto auto 1fr', marginBottom: '0.5rem' }}>
        <span className="badge">Kartu {Math.min(idx + 1, queue.length)}/{queue.length}</span>
        <span className={`badge ${isDue(c) ? 'due' : 'ok'}`}>
          {c ? fmtInterval(c.interval, c.reps) : 'Baru'}
        </span>
        <span className="badge muted">{entry.material} · {entry.groupLabel}</span>
      </div>

      <div className={`card study-card ${flipped ? 'show' : ''}`}>
        <div>
          <div className="kicker">Hafalkan &amp; uji diri</div>
          <div className="front">
            {entry.front}
            {entry.reading ? <span className="small">{entry.reading}</span> : null}
          </div>

          {!flipped ? (
            <>
              {entry.frontSub ? <div className="reading">{entry.frontSub}</div> : null}
              <div className="center" style={{ marginTop: '0.5rem' }}>
                <button className="btn primary" onClick={() => setFlipped(true)}>
                  Periksa jawaban <span className="muted" style={{ color: '#fff', opacity: 0.8 }}>(Enter)</span>
                </button>
              </div>
            </>
          ) : (
            <div className="card-back">
              <div className="back-short">{entry.backShort}</div>
              <div className="back-full">{entry.backFull}</div>
              {entry.example ? <div className="example">{entry.example}</div> : null}
            </div>
          )}
        </div>

        {flipped ? (
          <div className="grade-grid no-print">
            {GRADES.map((g) => (
              <button key={g.key} className={`grade-btn ${g.cls}`} onClick={() => handleGrade(g.key)}>
                <span className="g-key">{g.hotkey}</span>
                <span className="g-label">{g.label}</span>
                <span className="g-sub">{g.sub}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="hint no-print">Enter/Space = balik kartu · 1-4 = nilai jawaban</p>
    </>
  )
}