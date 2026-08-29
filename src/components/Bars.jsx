import { MATERIALS, MODES } from '../data/materials'

export function MaterialBar({ active, onChange }) {
  return (
    <div className="bar">
      {MATERIALS.map((m) => (
        <button
          key={m.key}
          className={`chip ${active === m.key ? 'active' : ''}`}
          onClick={() => onChange(m.key)}
        >
          {m.label} <small>{m.kanji}</small>
        </button>
      ))}
    </div>
  )
}

export function ModeBar({ active, onChange }) {
  return (
    <div className="bar">
      {MODES.map((m) => (
        <button
          key={m.key}
          className={`chip ${active === m.key ? 'active' : ''}`}
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}