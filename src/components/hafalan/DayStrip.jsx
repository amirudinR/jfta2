import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { todayStr, addDays, diffDays } from '../../lib/hafalan-storage'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// Label ringkas: "Kemarin", "Hari ini", "Besok", lalu tanggal singkat.
export function dayLabel(dateStr, today = todayStr()) {
  const rel = diffDays(today, dateStr)
  if (rel === 0) return 'Hari Ini'
  if (rel === -1) return 'Kemarin'
  if (rel === 1) return 'Besok'
  if (rel === 2) return 'Lusa'
  const d = new Date(`${dateStr}T00:00:00`)
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

// Strip pemilih hari: geser cepat (kemarin/hari ini/besok) + pilih tanggal.
// `maxBack`/`maxForward` membatasi berapa hari ke belakang/depan yang boleh dipilih.
export function DayStrip({
  selectedDate, onChange, suffix = '', maxBack = 7, maxForward = 7, meta = {},
}) {
  const today = todayStr()
  const rel = diffDays(today, selectedDate)
  const canPrev = rel > -maxBack
  const canNext = rel < maxForward

  const quick = [
    { key: 'prev', label: 'Kemarin', date: addDays(today, -1) },
    { key: 'today', label: 'Hari Ini', date: today },
    { key: 'next', label: 'Besok', date: addDays(today, 1) },
  ]

  return (
    <div className={`hh-daystrip ${rel < 0 ? 'past' : rel > 0 ? 'future' : 'now'}`}>
      <button
        className="hh-day-nav"
        onClick={() => canPrev && onChange(addDays(selectedDate, -1))}
        disabled={!canPrev}
        aria-label="Hari sebelumnya"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="hh-day-mid">
        <div className="hh-day-quick">
          {quick.map((q) => (
            <button
              key={q.key}
              className={`hh-day-quick-btn ${selectedDate === q.date ? 'active' : ''}`}
              onClick={() => onChange(q.date)}
            >
              <span>{q.label}</span>
              {meta[q.date] != null && <span className="hh-day-quick-count">{meta[q.date]}</span>}
            </button>
          ))}
        </div>
        <label className="hh-day-pick">
          <CalendarDays size={14} />
          <input
            type="date"
            value={selectedDate}
            max={addDays(today, maxForward)}
            min={addDays(today, -maxBack)}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Pilih tanggal"
          />
          <span className="hh-day-pick-label">
            {dayLabel(selectedDate, today)}{suffix ? ` ${suffix}` : ''}
            {meta[selectedDate] != null ? ` · ${meta[selectedDate]}` : ''}
          </span>
        </label>
      </div>

      <button
        className="hh-day-nav"
        onClick={() => canNext && onChange(addDays(selectedDate, 1))}
        disabled={!canNext}
        aria-label="Hari berikutnya"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
