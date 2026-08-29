import { useEffect, useMemo, useState } from 'react'
import { buildOptions, answerOf } from '../lib/quiz'
import { byMaterial } from '../data'
import { shuffle } from '../lib/ui'

// Latihan pilihan ganda (tanpa grading SRS).
export default function Kuis({ material, cards }) {
  const pool = useMemo(() => byMaterial(material), [material])
  const order = useMemo(() => shuffle(pool), [pool])
  const [q, setQ] = useState(0)
  const [choice, setChoice] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setQ(0); setChoice(null); setCorrect(0); setDone(false)
  }, [material])

  if (done) {
    return (
      <div className="card center">
        <p style={{ fontSize: '2rem', margin: 0 }}>🎉</p>
        <p>Latihan selesai.</p>
        <div className="row">
          <button className="btn primary" onClick={() => { setQ(0); setChoice(null); setCorrect(0); setDone(false) }}>
            Ulang dari awal
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
    if (opt === label) setCorrect((c) => c + 1)
  }

  const next = () => {
    setChoice(null)
    if (q + 1 >= order.length) setDone(true)
    else setQ(q + 1)
  }

  const card = cards[entry.id]

  return (
    <>
      <div className="progress-grid" style={{ gridTemplateColumns: 'auto auto 1fr', marginBottom: '0.5rem' }}>
        <span className="badge">Soal {q + 1}/{order.length}</span>
        <span className="badge ok">Benar {correct}</span>
        <span className="badge muted">{material} · {answerOf(entry) ? '' : ''}</span>
      </div>

      <div className="card">
        <div className="kicker">Apa maksudnya?</div>
        <div className="front" style={{ fontSize: '2.6rem' }}>
          {entry.front}
          {entry.reading ? <span className="small" style={{ fontSize: '1.2rem' }}>{entry.reading}</span> : null}
        </div>

        <div className="row">
          {options.map((opt) => {
            let tone = ''
            if (choice) {
              if (opt === label) tone = 'correct'
              else if (opt === choice) tone = 'wrong'
            }
            return (
              <button
                key={opt}
                className={`btn ${choice && opt === label ? 'primary' : ''}`}
                style={choice && opt === choice && opt !== label ? { borderColor: 'var(--err)', color: 'var(--err)' } : undefined}
                onClick={() => pick(opt)}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {choice ? (
          <>
            <p className={`center ${choice === label ? 'feedback correct' : 'feedback wrong'}`}>
              {choice === label ? 'Benar!' : 'Salah.'} {card ? `Ease ${card.ease}` : 'Belum dihafal.'}
            </p>
            <div className="row no-print">
              <button className="btn primary" onClick={next}>Lanjut (Enter)</button>
            </div>
          </>
        ) : (
          <p className="hint no-print">Pilih jawaban yang benar.</p>
        )}
      </div>
    </>
  )
}