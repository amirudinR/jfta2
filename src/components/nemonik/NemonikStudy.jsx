import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { imgUrl } from '../../lib/nemonik'
import { speak, ttsSupported } from '../../lib/tts'

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

  if (!queue || queue.length === 0) {
    return (
      <div className="nemo-study">
        <p className="nemo-empty">Tidak ada kartu untuk dipelajari saat ini.</p>
        <button className="nemo-btn primary" onClick={onFinish}>Kembali ke Dashboard</button>
      </div>
    )
  }

  if (index >= queue.length) {
    return (
      <div className="nemo-study">
        <div className="nemo-done">
          <Check size={40} className="nemo-done-icon" />
          <h2>Sesi selesai!</h2>
          <p>Kamu menyelesaikan {queue.length} kartu.</p>
          <button className="nemo-btn primary" onClick={onFinish}>Kembali ke Dashboard</button>
        </div>
      </div>
    )
  }

  const entry = queue[index]
  const isFirst = index === 0

  const resetDrag = () => {
    setDragCurrentX(0)
    setIsDragging(false)
    setDragStartX(null)
  }

  // Lanjut (maju): tandai kartu ini "hafal" (rate 3) lalu pindah ke berikutnya.
  // Jika sudah di kartu terakhir, biarkan index melewati length → tampil "selesai".
  const goNext = () => {
    onGrade(String(entry.no), 3)
    setIndex((i) => i + 1)
    resetDrag()
  }

  // Kembali (mundur): hanya navigasi, tanpa mengubah SRS.
  const goPrev = () => {
    if (isFirst) return
    setIndex((i) => Math.max(0, i - 1))
    resetDrag()
  }

  // Pointer event handlers for swipe
  const handlePointerDown = (e) => {
    if (e.isPrimary) {
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragStartX(e.clientX)
      setIsDragging(true)
      setDragCurrentX(0)
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging || dragStartX === null) return
    setDragCurrentX(e.clientX - dragStartX)
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    setIsDragging(false)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}

    // Threshold for swipe: 70px
    if (dragCurrentX < -70) {
      goNext() // Swipe kiri -> Lanjut
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
  // Opacity for visual feedback overlay
  const opacityLeft = Math.min(Math.max(-dragCurrentX / 100, 0), 0.8)
  const opacityRight = Math.min(Math.max(dragCurrentX / 100, 0), 0.8)

  const cardStyle = {
    transform: `translateX(${dragCurrentX}px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    touchAction: 'pan-y',
    userSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
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

      <div
        style={cardStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div style={{ ...overlayStyle, backgroundColor: overlayColor }}>
          {overlayText && (
            <span className="nemo-swipe-tag" style={{ opacity: Math.max(opacityLeft, opacityRight) }}>
              {overlayText}
            </span>
          )}
        </div>
        <CardBody entry={entry} />
      </div>

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
          onClick={goNext}
          aria-label="Kartu berikutnya"
        >
          Lanjut <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
