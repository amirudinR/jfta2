import { useMemo, useState } from 'react'
import { isMastered } from '../lib/srs'

// Daftar Lengkap (referensi) ala desain asli:
// - kana → grid tile 5 kolom, klik toggle hafal (mastered)
// - lainnya → baris per grup dengan tombol marker ▸/✓
export default function Referensi({ entries, cards, isKana, onToggleMastered }) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? entries.filter((e) =>
          [e.front, e.backShort, e.backFull, e.reading, e.groupLabel]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
      : entries
    const map = new Map()
    for (const e of filtered) {
      const g = e.groupLabel || 'Umum'
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(e)
    }
    return [...map.entries()]
  }, [entries, query])

  const toggle = (e) => {
    const c = cards[e.id]
    if (c) onToggleMastered(e.id, null)
    else onToggleMastered(e.id, { reps: 3, ease: 2.5, interval: 21, due: Date.now() + 21 * 24 * 3600 * 1000, lapses: 0 })
  }

  return (
    <>
      <input
        className="search no-print"
        placeholder="Cari…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {groups.map(([g, list]) => (
        <div key={g}>
          <div className="group-head">
            <span className="gtag">{g}</span>
            <span className="gcount">
              {list.filter((e) => isMastered(cards[e.id])).length}/{list.length} hafal
            </span>
          </div>

          {isKana ? (
            <div className="kana-grid">
              {list.map((e) => {
                const c = cards[e.id]
                const done = !!c
                const mastered = isMastered(c)
                return (
                  <button
                    key={e.id}
                    className={`ktile ${done ? 'done' : ''}`}
                    onClick={() => toggle(e)}
                    title={done ? e.backFull : `${e.backShort} — tandai hafal`}
                  >
                    {e.front}
                    {done ? (
                      <span className="tick" title={mastered ? 'Dikuasai' : 'Sedang dipelajari'}>
                        ✓
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : (
            list.map((e) => {
              const c = cards[e.id]
              const mastered = isMastered(c)
              return (
                <div className="lrow" key={e.id}>
                  <button
                    className={`mark-btn ${c ? 'on' : ''}`}
                    onClick={() => toggle(e)}
                    title={c ? 'Hapus dari hafalan' : 'Tandai hafal'}
                    aria-label={c ? 'Hapus dari hafalan' : 'Tandai hafal'}
                  >
                    {c ? '✓' : '▸'}
                  </button>
                  <span className="fx">{e.front}</span>
                  {e.reading ? <span className="rd">{e.reading}</span> : null}
                  <span className="mn" title={e.backFull}>
                    {e.backShort}
                    {mastered ? ' ✓' : ''}
                  </span>
                </div>
              )
            })
          )}
        </div>
      ))}

      {groups.length === 0 ? <p className="muted">Tidak ada hasil untuk “{query}”.</p> : null}
      <p className="muted no-print" style={{ fontSize: 11, marginTop: 10 }}>
        Klik tile/baris untuk menandai hafal (masuk Ujian) atau menghapusnya.
      </p>
    </>
  )
}
