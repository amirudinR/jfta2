import { useMemo } from 'react'
import { getDailyLog } from '../../lib/nemonik-sessions'
import { dayStr } from '../../lib/hafalan-storage'

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
  // Grid = `weeks` minggu penuh (7 hari/minggu), mulai Senin minggu paling awal
  // dan berakhir pada minggu berjalan. Ini menjaga tepat `weeks` kolom.
  const columns = useMemo(() => {
    const today = new Date()
    const todayDow = (today.getDay() + 6) % 7 // 0 = Senin … 6 = Minggu
    // Minggu berjalan dimulai Senin lalu; minggu paling awal = (weeks-1) minggu sebelumnya.
    const start = new Date(today)
    start.setDate(start.getDate() - todayDow - (weeks - 1) * 7)

    // Peta tanggal → jumlah review (untuk mengisi cepat).
    const log = getDailyLog()
    const cols = []
    for (let w = 0; w < weeks; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        const key = dayStr(date)
        // Hari masa depan (setelah hari ini) → kosong, bukan "0 kartu".
        if (date > today) {
          col.push({ empty: true })
        } else {
          col.push({ key, d: date, count: log[key]?.reviewed || 0 })
        }
      }
      cols.push(col)
    }
    return cols
  }, [weeks])

  const total = useMemo(
    () => columns.reduce((a, col) => a + col.reduce((b, c) => b + (c.count || 0), 0), 0),
    [columns],
  )

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
