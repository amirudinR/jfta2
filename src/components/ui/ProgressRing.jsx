export default function ProgressRing({ pct }) {
  const r = 26
  const c = 2 * Math.PI * r
  const v = Math.min(Math.max(pct, 0), 100)
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ flex: '0 0 auto' }}>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--panel-line)" strokeWidth="9" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke="var(--kin)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v / 100)}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--card-ink)">
        {Math.round(v)}%
      </text>
    </svg>
  )
}
