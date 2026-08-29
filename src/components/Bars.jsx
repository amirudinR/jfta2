import { MATERIALS, MODES } from '../data/materials'

export function MaterialBar({ active, onChange }) {
  return (
    <div className="materibar no-print" role="tablist">
      {MATERIALS.map((m) => (
        <button
          key={m.key}
          className={`mat-btn ${active === m.key ? 'active' : ''}`}
          onClick={() => onChange(m.key)}
        >
          <span className="mj">{m.kanji}</span>
          <span className="ml">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

// badgeCount: { ulangi: n, hafal: n } — badge merah ala desain asli.
export function ModeBar({ active, onChange, badgeCount = {} }) {
  return (
    <div className="modebar no-print" role="tablist">
      {MODES.map((m) => {
        const n = m.badge ? badgeCount[m.badge] : null
        return (
          <button
            key={m.key}
            className={`mode-btn ${active === m.key ? 'active' : ''}`}
            onClick={() => onChange(m.key)}
          >
            <span className="mi" aria-hidden>
              {m.icon}
            </span>
            <span>{m.label}</span>
            {m.badge ? (
              <span className={`mode-badge ${n ? '' : 'empty'}`}>{n || 0}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
