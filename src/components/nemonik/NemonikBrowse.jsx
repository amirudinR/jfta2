import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Volume2 } from 'lucide-react'
import { speak, ttsSupported } from '../../lib/tts'
import { useExitAnimation } from '../../hooks/useExitAnimation'

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'baru', label: 'Baru' },
  { key: 'belajar', label: 'Belajar' },
  { key: 'ulang', label: 'Perlu Diulang' },
  { key: 'hafal', label: 'Hafal' },
]

// Panel mnemonic: bacaan + daftar kosakata onyomi/kunyomi sebagai pendukung.
// Bila `onZoom` diberikan (dipakai di tab Kartu), panel bisa diklik untuk
// diperbesar ke lightbox.
export function MnemonicPanel({ entry, onZoom }) {
  if (!entry) return null
  const kas = [
    ...(entry.kosakata_onyomi || []).map((k) => ({ ...k, jenis: 'onyomi' })),
    ...(entry.kosakata_kunyomi || []).map((k) => ({ ...k, jenis: 'kunyomi' })),
  ]
  const zoomable = typeof onZoom === 'function'
  return (
    <div
      className={`nemo-mnemonic${zoomable ? ' nemo-zoomable' : ''}`}
      onClick={zoomable ? onZoom : undefined}
      role={zoomable ? 'button' : undefined}
      tabIndex={zoomable ? 0 : undefined}
      aria-label={zoomable ? `Perbesar kosakata pendukung ${entry.kanji}` : undefined}
      onKeyDown={zoomable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onZoom(e) } } : undefined}
      title={zoomable ? 'Klik untuk perbesar' : undefined}
    >
      <div className="nemo-mnemonic-head">
        <div className="nemo-mnemonic-kanji">{entry.kanji}</div>
        <div className="nemo-mnemonic-readings">
          <div><span className="ttl">Bacaan</span> <strong>{entry.baca_utama || '—'}</strong></div>
          <div><span className="ttl">On</span> {entry.onyomi || '—'} · <span className="ttl">Kun</span> {entry.kunyomi || '—'}</div>
          <div className="nemo-mnemonic-arti">{entry.arti}</div>
        </div>
      </div>

      {kas.length > 0 ? (
        <div className="nemo-mnemonic-kosakata">
          <div className="nemo-mnemonic-sub">Kosakata pendukung</div>
          <div className="nemo-kosakata-list">
            {kas.map((k, i) => (
              <div className="nemo-kosakata-item" key={`${k.jenis}-${i}`}>
                <span className={`nemo-kosakata-badge ${k.jenis}`}>{k.jenis === 'onyomi' ? '音' : '訓'}</span>
                <span className="nemo-kosakata-kata">{k.kata}</span>
                <span className="nemo-kosakata-kana">{k.kana}</span>
                <span className="nemo-kosakata-arti">{k.arti}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="nemo-mnemonic-empty">Tidak ada kosakata pendukung untuk kanji ini.</p>
      )}
    </div>
  )
}

// Layar Jelajahi Semua: cari (kanji/bacaan/arti) + filter status SRS.
export default function NemonikBrowse({ data, srs, onStudyOne, onBack }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const { mounted: detailMounted, closing: detailClosing } = useExitAnimation(!!selected, { duration: 220 })
  // Simpan entri terakhir agar sheet tetap punya konten selama animasi keluar.
  const lastSelectedRef = useRef(null)
  if (selected) lastSelectedRef.current = selected
  const detailEntry = selected || lastSelectedRef.current

  const list = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.filter((k) => {
      const s = srs[String(k.no)]
      const st = s?.status || 'baru'
      if (status !== 'all' && st !== status) return false
      if (!q) return true
      return (
        String(k.kanji).toLowerCase().includes(q) ||
        String(k.baca_utama || '').toLowerCase().includes(q) ||
        String(k.arti || '').toLowerCase().includes(q) ||
        String(k.onyomi || '').toLowerCase().includes(q) ||
        String(k.kunyomi || '').toLowerCase().includes(q)
      )
    })
  }, [data, srs, query, status])

  const canSpeak = ttsSupported()

  return (
    <div className="nemo-browse">
      <div className="nemo-browse-controls">
        <div className="nemo-browse-search">
          <Search size={15} className="icon" />
          <input
            className="nemo-browse-input"
            placeholder="Cari kanji, bacaan, atau arti..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="nemo-browse-clear" onClick={() => setQuery('')} aria-label="Bersihkan">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="nemo-browse-filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`nemo-filter-chip ${status === f.key ? 'on' : ''}`}
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="nemo-browse-count">{list.length} kanji</div>

      <div className="nemo-browse-list" data-stagger>
        {list.map((k) => {
          const st = srs[String(k.no)]?.status || 'baru'
          return (
            <div className="nemo-browse-row" key={k.no}>
              <button
                className="nemo-browse-num"
                onClick={() => setSelected(k)}
                aria-label={`Lihat detail kanji nomor ${k.no}`}
              >{k.no}</button>
              <button
                type="button"
                className="nemo-browse-main"
                onClick={() => setSelected(k)}
                aria-label={`Buka detail ${k.kanji} — ${k.arti}`}
              >
                <span className="nemo-browse-kanji">{k.kanji}</span>
                <span className="nemo-browse-read">{k.baca_utama}</span>
                <span className="nemo-browse-arti">{k.arti}</span>
              </button>
              <span className={`nemo-status-dot st-${st}`} title={st} aria-hidden />
              {canSpeak && (
                <button
                  className="nemo-browse-tts"
                  onClick={() => speak(k.baca_utama || k.kanji)}
                  aria-label={`Dengarkan bacaan ${k.kanji}`}
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          )
        })}
        {list.length === 0 && <div className="nemo-browse-empty">Tidak ditemukan.</div>}
      </div>

      {/* Detail modal (mnemonic + aksi belajar kartu ini). Di-portal ke body
          agar `position: fixed` benar-benar menutup viewport (tak ter-pin ke
          wrapper ber-transform). */}
      {detailMounted && detailEntry && createPortal(
        <div
          className={`nemo-browse-modal ${detailClosing ? 'ios-backdrop-out' : 'ios-backdrop-in'}`}
          onClick={() => setSelected(null)}
        >
          <div
            className={`nemo-browse-sheet ${detailClosing ? 'ios-sheet-out' : 'ios-sheet-in'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="nemo-browse-sheet-close" onClick={() => setSelected(null)} aria-label="Tutup">
              <X size={18} />
            </button>
            <MnemonicPanel entry={detailEntry} />
            <div className="nemo-browse-sheet-actions">
              <button className="nemo-btn primary" onClick={() => onStudyOne(detailEntry)}>Belajar kartu ini</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
