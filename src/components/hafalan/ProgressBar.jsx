export function ProgressBar({ current, target, label }) {
  if (target <= 0) return null
  const pct = Math.min(100, Math.round((current / target) * 100))
  const full = current >= target
  return (
    <div className="hh-progress">
      <div className="hh-progress-header">
        <span className="hh-progress-label">{label}</span>
        <span className={`hh-progress-count ${full ? 'full' : ''}`}>{current}/{target}</span>
      </div>
      <div className="hh-progress-track">
        <div className={`hh-progress-fill ${full ? 'full' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
