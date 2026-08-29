import { isMastered } from '../lib/srs'
import { fmtInterval, fmtDue } from '../lib/ui'

// Daftar kartu yang sudah mulai dihafal (dipelajari & dikuasai).
export default function DaftarHafal({ entries, cards, material }) {
  const active = entries.filter((e) => cards[e.id])
  active.sort((a, b) => {
    const ma = isMastered(cards[a.id]) ? 0 : 1
    const mb = isMastered(cards[b.id]) ? 0 : 1
    return ma - mb || cards[b.id].interval - cards[a.id].interval
  })

  if (!active.length) {
    return (
      <div className="card center">
        <p>Tidak ada kartu yang dihafal pada {material}.<br />Mulai dari mode <strong>Kartu</strong>.</p>
      </div>
    )
  }

  return (
    <>
      <div className="daftar">
        {active.map((e) => {
          const c = cards[e.id]
          const mastered = isMastered(c)
          return (
            <div className="item" key={e.id}>
              <span className="fx">{e.front}</span>
              <span className="rd">{e.reading || ''}</span>
              <span className="bj">{e.backShort}</span>
              <span className={`badge ${mastered ? 'ok' : ''}`}>
                {fmtInterval(c.interval, c.reps)}
              </span>
              <span className="badge due">{fmtDue(c.due)}</span>
            </div>
          )
        })}
      </div>
      <p className="hint no-print">Interval ≥ 21 hari = dikuasai (muncul di Ujian).</p>
    </>
  )
}