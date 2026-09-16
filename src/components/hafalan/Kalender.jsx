import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import { todayStr, addDays, dayStr, diffDays } from '../../lib/hafalan-storage'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// Nomor minggu Jepang dimulai Senin di kalender ini? Tidak — pakai Minggu
// (kebiasaan Indonesia). Urutan kolom: Min…Sab.
function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startPad = first.getDay() // 0 = Minggu
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// Kalender kustom bergaya washi — pengganti <input type="date"> bawaan browser.
// `meta` = { 'YYYY-MM-DD': jumlahTercentang } untuk badge titik di tiap tanggal.
export function Kalender({
  selectedDate, onChange, meta = {}, min, max, title = 'Pilih Tanggal',
}) {
  const today = todayStr()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const d = new Date(`${selectedDate || today}T00:00:00`)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const anchorRef = useRef(null)

  // Saat dibuka, fokuskan view ke bulan tanggal terpilih.
  useEffect(() => {
    if (!open) return
    const d = new Date(`${selectedDate || today}T00:00:00`)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }, [open, selectedDate, today])

  // Tutup saat Escape / klik di luar.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const cells = useMemo(() => monthGrid(view.year, view.month), [view])

  const shiftMonth = (n) => {
    setView((v) => {
      const d = new Date(v.year, v.month + n, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const disabledOf = (date) => {
    if (min && date < min) return true
    if (max && date > max) return true
    return false
  }

  const pick = (date) => {
    if (disabledOf(date)) return
    onChange(date)
    setOpen(false)
  }

  const relLabel = (() => {
    const rel = diffDays(today, selectedDate)
    if (rel === 0) return 'Hari Ini'
    if (rel === -1) return 'Kemarin'
    if (rel === 1) return 'Besok'
    const d = new Date(`${selectedDate}T00:00:00`)
    return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
  })()

  return (
    <div className="kal-root" ref={anchorRef}>
      <button
        className={`kal-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={15} />
        <span className="kal-trigger-label">{relLabel}</span>
        {meta[selectedDate] != null && (
          <span className="kal-trigger-count">{meta[selectedDate]}</span>
        )}
      </button>

      {open && (
        <div className="kal-pop" role="dialog" aria-label={title} aria-modal="false">
          <div className="kal-head">
            <button className="kal-nav" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya">
              <ChevronLeft size={16} />
            </button>
            <div className="kal-title">
              <span className="kal-title-month">{MONTH_NAMES[view.month]}</span>
              <span className="kal-title-year">{view.year}</span>
            </div>
            <button className="kal-nav" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya">
              <ChevronRight size={16} />
            </button>
            <button className="kal-close" onClick={() => setOpen(false)} aria-label="Tutup kalender">
              <X size={15} />
            </button>
          </div>

          <div className="kal-weekdays">
            {DAY_NAMES.map((n) => (
              <span key={n} className={`kal-wd ${n === 'Min' ? 'sun' : n === 'Sab' ? 'sat' : ''}`}>{n}</span>
            ))}
          </div>

          <div className="kal-grid">
            {cells.map((date, i) => {
              if (!date) return <span key={`pad-${i}`} className="kal-cell empty" aria-hidden />
              const key = dayStr(date)
              const isToday = key === today
              const isSel = key === selectedDate
              const disabled = disabledOf(key)
              const inRange = !disabled
              const count = meta[key]
              return (
                <button
                  key={key}
                  className={[
                    'kal-cell',
                    isToday ? 'today' : '',
                    isSel ? 'selected' : '',
                    inRange ? 'in-range' : '',
                    disabled ? 'disabled' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pick(key)}
                  disabled={disabled}
                  aria-label={key}
                  aria-current={isToday ? 'date' : undefined}
                >
                  <span className="kal-cell-num">{date.getDate()}</span>
                  {count != null && count > 0 && <span className="kal-cell-dot" title={`${count} tercentang`} />}
                </button>
              )
            })}
          </div>

          <div className="kal-foot">
            <button
              className="kal-today-btn"
              onClick={() => pick(today)}
              disabled={disabledOf(today)}
            >
              <span className="kal-today-kanji">今日</span> Hari Ini
            </button>
            <div className="kal-legend">
              {[['Kemarin', addDays(today, -1)], ['Besok', addDays(today, 1)]].map(([label, d]) => (
                <button
                  key={label}
                  className={`kal-mini ${selectedDate === d ? 'active' : ''}`}
                  onClick={() => pick(d)}
                  disabled={disabledOf(d)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
