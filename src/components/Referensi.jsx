import { isMastered } from '../lib/srs'

// Referensi: daftar semua kartu bahan, dikelompokkan per grup.
export default function Referensi({ entries, cards }) {
  const groups = {}
  for (const e of entries) {
    if (!groups[e.groupLabel]) groups[e.groupLabel] = []
    groups[e.groupLabel].push(e)
  }

  return (
    <>
      {Object.entries(groups).map(([label, list]) => (
        <div key={label} style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0.75rem 0 0.4rem', fontSize: '0.95rem', color: 'var(--accent-dark)' }}>
            {label} <span className="muted">({list.length})</span>
          </h3>
          <div className="daftar">
            {list.map((e) => {
              const c = cards[e.id]
              return (
                <div className="item" key={e.id}>
                  <span className="fx">{e.front}</span>
                  <span className="rd">{e.reading || ''}</span>
                  <span className="bj">
                    {e.backShort}
                    {e.example ? <span className="muted"> 例: {e.example}</span> : null}
                  </span>
                  <span className={`badge ${isMastered(c) ? 'ok' : ''}`}>
                    {c ? (isMastered(c) ? '✓' : '·') : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}