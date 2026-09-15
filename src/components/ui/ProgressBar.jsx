// Progress bar terpadu.
//   variant='plain' → markup hh-progress (Hafalan Harian)
//   variant='card'  → markup dm-progress dengan angka terformat + persen (Daftar Materi)
export function ProgressBar({
  current,
  total,
  target,
  max,
  label,
  variant = 'plain',
  formatCount = (n) => n,
}) {
  const cap = max ?? total ?? target
  if (cap <= 0) return null
  const pct = Math.min(100, Math.round((current / cap) * 100))

  if (variant === 'card') {
    return (
      <div className="dm-progress">
        <div className="dm-progress-head">
          <span className="dm-progress-label">{label}</span>
          <span className="dm-progress-count">
            {formatCount(current)}/{formatCount(cap)} ({pct}%)
          </span>
        </div>
        <div className="hh-progress-track">
          <div className={`hh-progress-fill ${pct >= 100 ? 'full' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  const full = current >= cap
  return (
    <div className="hh-progress">
      <div className="hh-progress-header">
        <span className="hh-progress-label">{label}</span>
        <span className={`hh-progress-count ${full ? 'full' : ''}`}>{current}/{cap}</span>
      </div>
      <div className="hh-progress-track">
        <div className={`hh-progress-fill ${full ? 'full' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}