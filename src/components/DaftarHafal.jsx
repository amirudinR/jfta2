import { useMemo, useState } from 'react'
import { isMastered } from '../lib/srs'
import { fmtDue } from '../lib/ui'

// Daftar kartu yang sudah mulai dihafal — search, kelompok pelajaran, baris expandable.
export default function DaftarHafal({ entries, cards }) {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const items = useMemo(() => {
    const active = entries.filter((e) => cards[e.id])
    active.sort((a, b) => {
      const ma = isMastered(cards[a.id]) ? 0 : 1
      const mb = isMastered(cards[b.id]) ? 0 : 1
      return ma - mb || cards[b.id].interval - cards[a.id].interval
    })
    const q = query.trim().toLowerCase()
    if (!q) return active
    return active.filter((e) =>
      [e.front, e.backShort, e.backFull, e.reading, e.groupLabel]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [entries, cards, query])

  const groups = useMemo(() => {
    const map = new Map()
    for (const e of items) {
      const g = e.groupLabel || 'Umum'
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(e)
    }
    return [...map.entries()]
  }, [items])

  if (!entries.some((e) => cards[e.id])) {
    return (
      <div className="panel">
        <div className="big-emoji">📋</div>
        <h3>Belum ada yang dihafal</h3>
        <p>
          Mulai dari mode <b>Kartu</b> — kartu yang kamu nilai akan muncul di sini.
        </p>
      </div>
    )
  }

  return (
    <>
      <input
        className="search no-print"
        placeholder="Cari kata, arti, atau pelajaran…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {groups.map(([g, list]) => {
        const gMastered = list.filter((e) => isMastered(cards[e.id])).length
        const gPct = Math.round((gMastered / list.length) * 100)
        return (
          <div key={g}>
            <div className="group-head">
              <span className="gtag">{g}</span>
              <div className="gbar">
                <div className="gbar-fill" style={{ width: `${gPct}%` }} />
              </div>
              <span className="gcount">
                {gMastered}/{list.length} hafal · {gPct}%
              </span>
            </div>
          {list.map((e) => {
            const c = cards[e.id]
            const mastered = isMastered(c)
            const open = openId === e.id
            return (
              <div key={e.id}>
                <div
                  className={`lrow clickable ${open ? 'open' : ''}`}
                  onClick={() => setOpenId(open ? null : e.id)}
                >
                  <span className="fx">{e.front}</span>
                  {e.reading ? <span className="rd">{e.reading}</span> : null}
                  <span className="mn">{e.backShort}</span>
                  <span
                    className="mark-btn on"
                    style={{ cursor: 'default' }}
                    title={mastered ? 'Dikuasai' : 'Belum dikuasai'}
                  >
                    {mastered ? '✓' : '⏳'}
                  </span>
                  <span className="chev">▶</span>
                </div>
                {open ? (
                  <div className="detail">
                    {e.backFull}
                    <span className="mono">
                      {'\n'}Interval: {c.interval} hari · Jatuh tempo: {fmtDue(c.due)}
                    </span>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        )
      })}

      {items.length === 0 ? <p className="muted">Tidak ada hasil untuk “{query}”.</p> : null}
    </>
  )
}
