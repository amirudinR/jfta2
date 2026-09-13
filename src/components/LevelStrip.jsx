import { HAFALAN_MODES } from '../lib/hafalan-storage'

// LevelStrip — satu-satunya pengubah level (A2/N3/N2/N1).
// Menggantikan tag level kecil di topbar + strip mode di Hafalan Harian.
export default function LevelStrip({ active, onChange }) {
  return (
    <div className="level-strip no-print" role="tablist" aria-label="Pilih level">
      {HAFALAN_MODES.map((m) => (
        <button
          key={m.key}
          className={`level-strip-btn ${active === m.key ? 'active' : ''}`}
          onClick={() => onChange(m.key)}
          role="tab"
          aria-selected={active === m.key}
        >
          <span className="lvl-kanji">{m.kanji}</span>
          <span className="lvl-label">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
