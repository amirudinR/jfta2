import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { imgUrl } from '../../lib/nemonik'

function CardBody({ entry }) {
  const imgBersih = imgUrl(entry.img_kanji_bersih)
  const imgKonteks = imgUrl(entry.img_kanji_nama)
  const imgSelesai = imgUrl(entry.img_selesai_potong)

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

  const rate = (rating) => {
    onGrade(String(entry.no), rating)
    setIndex((i) => i + 1)
    setDragCurrentX(0)
    setIsDragging(false)
    setDragStartX(null)
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
    e.currentTarget.releasePointerCapture(e.pointerId)
    
    // Threshold for swipe: 70px
    if (dragCurrentX < -70) {
      rate(1) // Swipe kiri -> Tidak Tahu
    } else if (dragCurrentX > 70) {
      rate(3) // Swipe kanan -> Tahu
    } else {
      setDragCurrentX(0) // Kembali ke tengah
    }
    setDragStartX(null)
  }
  
  const handlePointerCancel = () => {
    setIsDragging(false)
    setDragCurrentX(0)
    setDragStartX(null)
  }

  const rotation = dragCurrentX * 0.05
  // Opacity for visual feedback overlay
  const opacityLeft = Math.min(Math.max(-dragCurrentX / 100, 0), 0.8)
  const opacityRight = Math.min(Math.max(dragCurrentX / 100, 0), 0.8)

  const cardStyle = {
    transform: `translateX(${dragCurrentX}px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    touchAction: 'none',
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
  if (opacityLeft > 0) {
    overlayColor = `rgba(239, 68, 68, ${opacityLeft})` // Red
  } else if (opacityRight > 0) {
    overlayColor = `rgba(34, 197, 94, ${opacityRight})` // Green
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
        <div style={{ ...overlayStyle, backgroundColor: overlayColor }}></div>
        <CardBody entry={entry} />
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666', marginTop: '1rem', marginBottom: '0.5rem' }}>
        Swipe kiri (Tdk Tahu) ↔ Swipe kanan (Tahu)
      </p>

      {/* Alternative small buttons for desktop/mouse users */}
      <div className="nemo-rating" style={{ gap: '1rem', justifyContent: 'center' }}>
        <button 
          className="nemo-rating-btn wrong" 
          onClick={() => rate(1)}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flex: '0 1 auto' }}
        >
          <X size={14} style={{ marginRight: '4px' }} /> Tdk Tahu
        </button>
        <button 
          className="nemo-rating-btn easy" 
          onClick={() => rate(3)}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flex: '0 1 auto' }}
        >
          <Check size={14} style={{ marginRight: '4px' }} /> Tahu
        </button>
      </div>
    </div>
  )
}
