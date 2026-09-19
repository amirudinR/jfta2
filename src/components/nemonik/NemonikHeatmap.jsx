import { useMemo } from 'react'
import { dailySeries } from '../../lib/nemonik-sessions'

// Heatmap belajar Nemonik (ala GitHub) — grid 7 baris (hari) × N kolom (minggu).
// Intensitas warna naik sesuai jumlah kartu yang di-review per hari.
function level(count) {
  if (!count) return 0
  if (count < 5) return 1
  if (count < 12) return 2
  if (count < 25) return 3
  return 4
}

const DAY_LABELS = ['', 'Sen', '', 'Rab', '', 'Jum', '']

export default function NemonikHeatmap({ weeks = 13 }) {
  const days = weeks * 7

  const cells = useMemo(() => dailySeries(days), [days])

  // Susun jadi kolom per minggu: index 0 = hari paling awal, kita isi kolom demi kolom.
  const columns = useMemo(() => {
    const cols = []
    let col = new Array(7).fill(null)
    // Geser agar sel pertama jatuh pada baris (hari) yang tepat.
    const firstDow = (cells[0]?.d.getDay() + 6) % 7 // 0 = Senin
    for (let i = 0; i < firstDow; i++) col[i] = { empty: true }
    for (const c of cells) {
      const dow = (c.d.getDay() + 6) % 7 // 0 = Senin
      col[dow] = c
      if (dow === 6) { cols.push(col); col = new Array(7).fill(null) }
    }
    if (col.some(Boolean)) cols.push(col)
    return cols
  }, [cells])

  const total = useMemo(() => cells.reduce((a, c) => a + (c.count || 0), 0), [cells])

  return (
    <div className="nemo-heatmap">
      <div className="nemo-heatmap-head">
        <span className="nemo-heatmap-title">Aktivitas Belajar</span>
        <span className="nemo-heatmap-total">{total} kartu · {weeks} minggu</span>
      </div>

      <div className="nemo-heatmap-body">
        <div className="nemo-heatmap-daylabels">
          {DAY_LABELS.map((l, i) => <span key={i}>{l}</span>)}
        </div>
        <div className="nemo-heatmap-grid" role="img" aria-label={`Heatmap aktivitas belajar ${total} kartu`}>
          {columns.map((col, ci) => (
            <div className="nemo-heatmap-col" key={ci}>
              {col.map((cell, ri) => {
                if (!cell) return <span key={ri} className="nemo-hm-cell lv0" />
                if (cell.empty) return <span key={ri} className="nemo-hm-cell empty" />
                const lv = level(cell.count)
                return (
                  <span
                    key={ri}
                    className={`nemo-hm-cell lv${lv}`}
                    title={`${cell.key}: ${cell.count} kartu`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="nemo-heatmap-legend">
        <span>Sedikit</span>
        {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`nemo-hm-cell lv${l}`} />)}
        <span>Banyak</span>
      </div>
    </div>
  )
}
