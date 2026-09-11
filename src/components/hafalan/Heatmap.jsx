import { todayStr } from '../../lib/hafalan-storage'

export function Heatmap({ history }) {
  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ key, d, entry: history[key] })
  }
  return (
    <div className="hh-heatmap">
      <div className="hh-heatmap-label">30 Hari Terakhir</div>
      <div className="hh-heatmap-grid">
        {days.map(({ key, d, entry }) => {
          let cls = 'hh-hm-cell'
          const isToday = key === todayStr()
          if (entry?.done) cls += ' done'
          else if (entry && (entry.kotoba > 0 || entry.kanji > 0)) cls += ' partial'
          else if (!isToday) cls += ' miss'
          if (isToday) cls += ' today'
          return (
            <div key={key} className={cls} title={`${key}: ${entry ? `${entry.kotoba}k + ${entry.kanji}j${entry.done ? ' ✓' : ''}` : isToday ? 'Hari ini' : '—'}`}>
              <span className="hh-hm-day">{d.getDate()}</span>
            </div>
          )
        })}
      </div>
      <div className="hh-heatmap-legend">
        <span className="hh-hm-cell miss" style={{ width: 12, height: 12 }} /> Kosong
        <span className="hh-hm-cell partial" style={{ width: 12, height: 12 }} /> Sebagian
        <span className="hh-hm-cell done" style={{ width: 12, height: 12 }} /> Tercapai
      </div>
    </div>
  )
}
