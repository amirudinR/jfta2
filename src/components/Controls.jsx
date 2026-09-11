import { useEffect, useState } from 'react'
import { Languages } from 'lucide-react'

// Panel kontrol ala desain asli: arah kartu, romaji, chip pelajaran, terapkan & kocok.
// Seleksi pelajaran bersifat draft — baru dikomit lewat "Terapkan & kocok ulang".
export default function Controls({
  material,
  groups,
  committed,
  direction,
  onDirection,
  showRomaji,
  onToggleRomaji,
  onApply,
}) {
  const [draft, setDraft] = useState(() => (committed ? new Set(committed) : null))

  useEffect(() => {
    setDraft(committed ? new Set(committed) : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material])

  const toggle = (g) => {
    setDraft((prev) => {
      const base = prev ? new Set(prev) : new Set(groups)
      if (base.has(g)) base.delete(g)
      else base.add(g)
      return base.size === groups.length ? null : base
    })
  }

  const selectAll = () => setDraft(null)
  const clearAll = () => setDraft(new Set())

  const apply = () => {
    onApply(draft ? [...draft] : null)
  }

  const isOn = (g) => (draft ? draft.has(g) : true)

  return (
    <section className="controls no-print">
      <div className="ctl-row">
        <div className="pill-group" role="group" aria-label="Arah kartu">
          <button
            className={`pill ${direction === 'jp2id' ? 'on' : ''}`}
            onClick={() => onDirection('jp2id')}
          >
            日本語→ID
          </button>
          <button
            className={`pill ${direction === 'id2jp' ? 'on' : ''}`}
            onClick={() => onDirection('id2jp')}
          >
            ID→日本語
          </button>
        </div>
        <button
          className={`pill romaji-pill ${showRomaji ? 'on' : ''}`}
          onClick={onToggleRomaji}
          aria-label="Tampilkan romaji"
        >
          <Languages size={14} />
          <span>Romaji</span>
        </button>
      </div>

      {groups.length > 1 ? (
        <>
          <div className="lesson-chips">
            {groups.map((g) => (
              <button
                key={g}
                className={`lchip ${isOn(g) ? 'on' : ''}`}
                onClick={() => toggle(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="ctl-links">
            <button className="ctl-link" onClick={selectAll}>
              Semua
            </button>
            <button className="ctl-link" onClick={clearAll}>
              Kosongkan
            </button>
          </div>
        </>
      ) : null}

      <button className="apply-btn" onClick={apply}>
        Terapkan &amp; kocok ulang
      </button>
    </section>
  )
}
