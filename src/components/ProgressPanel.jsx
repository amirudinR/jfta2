import { computeStats } from '../lib/srs'

export default function ProgressPanel({ cards }) {
  const s = computeStats(cards)
  const items = [
    { label: 'Jatuh tempo', value: s.due, tone: s.due > 0 ? 'warn' : 'ok' },
    { label: 'Belum mulai', value: s.newCards },
    { label: 'Dipelajari', value: s.learning },
    { label: 'Dikuasai', value: s.mastered, tone: 'ok' },
  ]
  return (
    <div className="progress-grid">
      {items.map((it) => (
        <div className="progress-card" key={it.label}>
          <div className={`num ${it.tone === 'warn' ? 'feedback wrong' : ''}`}>{it.value}</div>
          <div className="lbl">{it.label}</div>
        </div>
      ))}
      <div className="progress-card">
        <div className="num">{s.masteryPct}%</div>
        <div className="lbl">Penguasaan</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${s.masteryPct}%` }} />
        </div>
      </div>
    </div>
  )
}