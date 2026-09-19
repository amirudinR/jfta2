import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, X, ChevronLeft, ChevronRight, Volume2, RotateCcw, BookText, PenLine } from 'lucide-react'
import { imgUrl } from '../../lib/nemonik'
import { speak, ttsSupported } from '../../lib/tts'
import { SessionResult } from './NemonikSessionStats'
import { MnemonicPanel } from './NemonikBrowse'
import NemonikSketch from './NemonikSketch'

// Auto-pilih "Tahu" bila user tidak menekan chip rating dalam sekian ms.
const AUTO_RATE_MS = 3000

// Opsi rating SRS: nilai → label + kelas warna.
const RATINGS = [
  { value: 1, label: 'Lupa', cls: 'lupa' },
  { value: 2, label: 'Sulit', cls: 'sulit' },
  { value: 3, label: 'Tahu', cls: 'tahu' },
]

// Teks yang diucapkan TTS: utamakan bacaan kana (baca_utama), fallback ke kanji.
function speakEntry(entry) {
  const text = entry?.baca_utama || entry?.kanji || ''
  if (text) speak(text)
}

function CardBody({ entry }) {
  const imgBersih = imgUrl(entry.img_kanji_bersih)
  const imgKonteks = imgUrl(entry.img_kanji_nama)
  const imgSelesai = imgUrl(entry.img_selesai_potong)
  const canSpeak = ttsSupported() && !!(entry.baca_utama || entry.kanji)

  return (
    <div className="nemo-flashcard" style={{ width: '100%' }}>
      <div className="nemo-flashcard-top">
        <div className="nemo-img-left" draggable="false">
          {imgBersih
            ? <img src={imgBersih} alt={`Kanji ${entry.kanji}`} loading="lazy" draggable="false" />
            : <div className="nemo-img-missing">Kanji tidak tersedia</div>}
        </div>
        <div className="nemo-img-right" draggable="false">
          {imgKonteks
            ? <img src={imgKonteks} alt={`Mnemonic ${entry.kanji}`} loading="lazy" draggable="false" />
            : <div className="nemo-img-missing">Mnemonic tidak tersedia</div>}
        </div>
      </div>

      <div className="nemo-flashcard-bottom" draggable="false">
        {imgSelesai
          ? <img src={imgSelesai} alt={`Kartu lengkap ${entry.kanji}`} loading="lazy" draggable="false" />
          : <div className="nemo-img-missing">Kartu lengkap tidak tersedia</div>}
      </div>

      {/* Tombol voice (TTS) — membacakan bacaan kanji. onPointerDown di-stop
          agar tidak memicu drag swipe pada kartu. */}
      {canSpeak && (
        <button
          type="button"
          className="nemo-tts"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => speakEntry(entry)}
          aria-label={`Dengarkan bacaan ${entry.kanji}`}
          title="Dengarkan"
        >
          <Volume2 size={18} />
          <span className="nemo-tts-label">Dengarkan</span>
        </button>
      )}
    </div>
  )
}

export default function NemonikStudy({ queue, onGrade, onFinish }) {
  const [index, setIndex] = useState(0)

  // Drag state
  const [dragStartX, setDragStartX] = useState(null)
  const [dragCurrentX, setDragCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Rating gate: true = menampilkan chips Lupa/Sulit/Tahu (kartu sedang dinilai).
  const [rating, setRating] = useState(false)
  // Akumulasi id kanji ber-rating lemah (Lupa/Sulit) di sesi ini → untuk
  // "Ulangi kartu lemah" saat sesi tuntas.
  const [weakIds, setWeakIds] = useState([])
  const [ratedCount, setRatedCount] = useState(0)
  // Papan skor sesi (untuk ringkasan hasil).
  const [tally, setTally] = useState({ lupa: 0, sulit: 0, tahu: 0 })
  const startedAtRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now())
  // Toggle panel mnemonic (kosakata pendukung) untuk kartu aktif.
  const [showMnemonic, setShowMnemonic] = useState(false)
  // Mode tampilan kartu: 'kartu' (flashcard) atau 'tulis' (sketch kanji).
  const [viewMode, setViewMode] = useState('kartu')

  const autoTimer = useRef(null)

  const clearAutoTimer = useCallback(() => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
  }, [])

  // Bersihkan timer saat unmount.
  useEffect(() => () => clearAutoTimer(), [clearAutoTimer])

  const entry = queue[index]
  const isFirst = index === 0

  const resetDrag = () => {
    setDragCurrentX(0)
    setIsDragging(false)
    setDragStartX(null)
  }

  // Terapkan rating untuk kartu saat ini + maju ke kartu berikutnya.
  const applyRating = useCallback((value) => {
    if (!entry) return
    clearAutoTimer()
    onGrade(String(entry.no), value)
    if (value < 3) setWeakIds((w) => (w.includes(String(entry.no)) ? w : [...w, String(entry.no)]))
    setTally((t) => ({
      lupa: t.lupa + (value === 1 ? 1 : 0),
      sulit: t.sulit + (value === 2 ? 1 : 0),
      tahu: t.tahu + (value === 3 ? 1 : 0),
    }))
    setRatedCount((c) => c + 1)
    setRating(false)
    setIndex((i) => i + 1)
    resetDrag()
  }, [entry, onGrade, clearAutoTimer])

  // Buka gerbang rating (dipanggil oleh swipe kiri / tombol Lanjut).
  const openRating = useCallback(() => {
    if (!entry || rating) return
    setRating(true)
    resetDrag()
    clearAutoTimer()
    // Auto "Tahu" bila tidak dijawab dalam AUTO_RATE_MS.
    autoTimer.current = setTimeout(() => applyRating(3), AUTO_RATE_MS)
  }, [entry, rating, applyRating, clearAutoTimer])

  // Kembali (mundur): hanya navigasi, tanpa mengubah SRS.
  const goPrev = () => {
    if (isFirst || rating) return
    setIndex((i) => Math.max(0, i - 1))
    resetDrag()
  }

  // Ulangi kartu lemah sesi ini (auto-lanjut): reset index, queue difokuskan.
  const repeatWeak = () => {
    // Queue lemah dikirim ke parent lewat onRepeatWeak (dipasang di Nemonik.jsx).
    // Fallback bila tak ada: cukup kembali ke dashboard.
    if (typeof onRepeatWeak === 'function') onRepeatWeak(weakIds)
    else onFinish()
  }

  // ── Selesai ──
  if (!queue || queue.length === 0) {
    return (
      <div className="nemo-study">
        <p className="nemo-empty">Tidak ada kartu untuk dipelajari saat ini.</p>
        <button className="nemo-btn primary" onClick={onFinish}>Kembali ke Dashboard</button>
      </div>
    )
  }

  if (index >= queue.length) {
    const hasWeak = weakIds.length > 0
    const total = tally.lupa + tally.sulit + tally.tahu
    const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current
    const result = {
      total,
      lupa: tally.lupa,
      sulit: tally.sulit,
      tahu: tally.tahu,
      dur,
      accuracy: total > 0 ? Math.round(((tally.tahu + tally.sulit) / total) * 100) : 0,
    }
    return (
      <div className="nemo-study">
        <div className="nemo-done">
          <Check size={40} className="nemo-done-icon" />
          <h2>Sesi selesai!</h2>
          <p>Kamu menyelesaikan {ratedCount || queue.length} kartu.</p>

          <SessionResult result={result} />

          {hasWeak && (
            <p className="nemo-done-sub">
              {weakIds.length} kartu masih lemah (Lupa/Sulit).
            </p>
          )}
          <div className="nemo-done-actions">
            {hasWeak && (
              <button className="nemo-btn warning" onClick={repeatWeak}>
                <RotateCcw size={16} /> Ulangi {weakIds.length} kartu lemah
              </button>
            )}
            <button className="nemo-btn primary" onClick={onFinish}>Kembali ke Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  // Pointer event handlers for swipe
  const handlePointerDown = (e) => {
    if (rating) return
    if (e.isPrimary) {
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragStartX(e.clientX)
      setIsDragging(true)
      setDragCurrentX(0)
    }
  }

  const handlePointerMove = (e) => {
    if (rating || !isDragging || dragStartX === null) return
    setDragCurrentX(e.clientX - dragStartX)
  }

  const handlePointerUp = (e) => {
    if (rating || !isDragging) return
    setIsDragging(false)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}

    // Threshold for swipe: 70px
    if (dragCurrentX < -70) {
      openRating() // Swipe kiri -> Lanjut (buka gerbang rating)
    } else if (dragCurrentX > 70 && !isFirst) {
      goPrev() // Swipe kanan -> Kembali
    } else {
      setDragCurrentX(0) // Kembali ke tengah
    }
    setDragStartX(null)
  }

  const handlePointerCancel = () => {
    resetDrag()
  }

  const rotation = dragCurrentX * 0.05
  const opacityLeft = Math.min(Math.max(-dragCurrentX / 100, 0), 0.8)
  const opacityRight = Math.min(Math.max(dragCurrentX / 100, 0), 0.8)

  const cardStyle = {
    transform: `translateX(${dragCurrentX}px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    touchAction: 'pan-y',
    userSelect: 'none',
    cursor: rating ? 'default' : isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    width: '100%',
    maxWidth: '500px', // Prevents it from being too wide
    margin: '0 auto',
    zIndex: 10
  }

  const overlayStyle = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: '16px',
    pointerEvents: 'none',
    zIndex: 20,
    transition: 'background-color 0.1s'
  }

  let overlayColor = 'transparent'
  let overlayText = ''
  if (opacityLeft > 0) {
    overlayColor = `rgba(34, 197, 94, ${opacityLeft})` // Hijau = Lanjut
    overlayText = 'LANJUT'
  } else if (opacityRight > 0 && !isFirst) {
    overlayColor = `rgba(148, 163, 184, ${opacityRight})` // Abu = Kembali
    overlayText = 'KEMBALI'
  }

  return (
    <div className="nemo-study" style={{ overflowX: 'hidden' }}>
      <div className="nemo-study-progress">
        {index + 1} / {queue.length}
      </div>

      {/* Tab kartu / tulis */}
      {!rating && (
        <div className="nemo-view-tabs">
          <button
            type="button"
            className={`nemo-view-tab ${viewMode === 'kartu' ? 'on' : ''}`}
            onClick={() => setViewMode('kartu')}
          >
            <BookText size={14} /> Kartu
          </button>
          <button
            type="button"
            className={`nemo-view-tab ${viewMode === 'tulis' ? 'on' : ''}`}
            onClick={() => setViewMode('tulis')}
          >
            <PenLine size={14} /> Tulis
          </button>
        </div>
      )}

      {viewMode === 'tulis' ? (
        <div className="nemo-study-sketch">
          <NemonikSketch entry={entry} />
        </div>
      ) : (
        <div
          style={cardStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div style={{ ...overlayStyle, backgroundColor: overlayColor }}>
            {overlayText && !rating && (
              <span className="nemo-swipe-tag" style={{ opacity: Math.max(opacityLeft, opacityRight) }}>
                {overlayText}
              </span>
            )}
          </div>
          <CardBody entry={entry} />
        </div>
      )}

      {!rating ? (
        <>
          {/* Toggle kosakata pendukung (mnemonic) untuk kartu ini. */}
          <button
            type="button"
            className={`nemo-mnemonic-toggle ${showMnemonic ? 'on' : ''}`}
            onClick={() => setShowMnemonic((v) => !v)}
            aria-expanded={showMnemonic}
          >
            <BookText size={15} /> {showMnemonic ? 'Sembunyikan kosakata' : 'Lihat kosakata pendukung'}
          </button>

          {showMnemonic && <MnemonicPanel entry={entry} />}

          <p className="nemo-swipe-hint">
            Geser kiri untuk lanjut · geser kanan untuk kembali
          </p>

          {/* Tombol navigasi interaktif (juga untuk pengguna mouse/desktop). */}
          <div className="nemo-nav">
            <button
              type="button"
              className="nemo-nav-btn prev"
              onClick={goPrev}
              disabled={isFirst}
              aria-label="Kartu sebelumnya"
            >
              <ChevronLeft size={18} /> Kembali
            </button>
            <button
              type="button"
              className="nemo-nav-btn next"
              onClick={openRating}
              aria-label="Nilai & lanjut ke kartu berikutnya"
            >
              Lanjut <ChevronRight size={18} />
            </button>
          </div>
        </>
      ) : (
        /* Gerbang rating: muncul setelah Lanjut. Auto-pilih "Tahu" 3 detik. */
        <div className="nemo-rating-gate" role="group" aria-label="Seberapa paham kanji ini?">
          <p className="nemo-rating-q">Seberapa paham kanji ini?</p>
          <div className="nemo-rating-chips">
            {RATINGS.map((r) => {
              const Icon = r.value === 1 ? X : r.value === 2 ? RotateCcw : Check
              return (
                <button
                  key={r.value}
                  type="button"
                  className={`nemo-rating-chip ${r.cls}`}
                  onClick={() => applyRating(r.value)}
                >
                  <Icon size={16} /> {r.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
