import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Undo2, PenLine, Info } from 'lucide-react'
import { imgUrl } from '../../lib/nemonik'

// Canvas latihan tulis kanji dengan panduan profesional:
//  • Grid genkou (田字格): kotak + crosshair horizontal/vertikal/diagonal.
//  • Bayangan kanji (img_kanji_bersih) sebagai acuan bentuk.
//  • Kontrol ketebalan pena (halus/sedang/tebal), undo & hapus.
//  • Panel informasi kanji (arti, on'yomi, kun'yomi, bacaan utama).

// Batas riwayat undo agar memori terjaga (tiap snapshot = full ImageData).
const MAX_UNDO = 20

// Ketebalan pena (dalam px CSS; di-skala otomatis oleh DPR).
const BRUSHES = [
  { key: 'thin', label: 'Halus', width: 6, dot: 6 },
  { key: 'mid', label: 'Sedang', width: 10, dot: 10 },
  { key: 'bold', label: 'Tebal', width: 15, dot: 15 },
]

export default function NemonikSketch({ entry }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const brushRef = useRef(10)
  const strokesRef = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [brush, setBrush] = useState('mid')
  const [showGuide, setShowGuide] = useState(true)

  const bg = entry ? imgUrl(entry.img_kanji_bersih) : ''

  // Terapkan ketebalan ke context (tanpa reset coretan).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = BRUSHES.find((b) => b.key === brush)?.width || 10
    brushRef.current = w
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = w
  }, [brush])

  // Ukuran canvas mengikuti kontainer (device pixel ratio aware).
  // `preserve` = true → gambar yang ada dipertahankan (untuk resize).
  const setupCanvas = useCallback((preserve = false, width = 10) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const dpr = window.devicePixelRatio || 1
    const prevW = canvas.width
    const prevH = canvas.height

    // Simpan isi lama sebelum ukuran diubah (mengubah width/height menghapus isi).
    let snapshot = null
    if (preserve && prevW > 0 && prevH > 0) {
      try { snapshot = canvas.getContext('2d').getImageData(0, 0, prevW, prevH) } catch { snapshot = null }
    }

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#c1402a'

    if (snapshot) {
      // Gambar ulang snapshot lama ke ukuran baru (skala ke kanvas baru).
      const tmp = document.createElement('canvas')
      tmp.width = prevW
      tmp.height = prevH
      tmp.getContext('2d').putImageData(snapshot, 0, 0)
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    } else {
      strokesRef.current = []
      setCanUndo(false)
    }
  }, [])

  // Reset penuh saat kartu (entry) berubah — bukan saat resize.
  useEffect(() => {
    setupCanvas(false, brushRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.no])

  // Resize → pertahankan coretan.
  useEffect(() => {
    const onResize = () => setupCanvas(true, brushRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setupCanvas])

  const pointFromEvent = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    drawingRef.current = true
    const { x, y } = pointFromEvent(e)
    // Simpan state sebelum goresan baru (untuk undo), batasi jumlahnya.
    strokesRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (strokesRef.current.length > MAX_UNDO) strokesRef.current.shift()
    setCanUndo(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pointFromEvent(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = () => { drawingRef.current = false }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokesRef.current = []
    setCanUndo(false)
  }

  const undo = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const last = strokesRef.current.pop()
    if (last) ctx.putImageData(last, 0, 0)
    setCanUndo(strokesRef.current.length > 0)
  }

  const reading = entry?.baca_utama || entry?.onyomi || ''
  const kunyomi = entry?.kunyomi || ''
  const onyomi = entry?.onyomi || ''

  return (
    <div className="nemo-sketch">
      {/* ── Panel informasi kanji ── */}
      {entry && (
        <div className="nemo-sketch-info">
          <div className="nemo-sketch-kanji" aria-hidden>{entry.kanji}</div>
          <div className="nemo-sketch-meta">
            <div className="nemo-sketch-arti">{entry.arti}</div>
            <div className="nemo-sketch-read">
              {onyomi && <span className="nemo-read-chip on">音 {onyomi}</span>}
              {kunyomi && <span className="nemo-read-chip kun">訓 {kunyomi}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── Kontrol pena ── */}
      <div className="nemo-sketch-tools">
        <div className="nemo-brush-group" role="radiogroup" aria-label="Ketebalan pena">
          {BRUSHES.map((b) => (
            <button
              key={b.key}
              type="button"
              role="radio"
              aria-checked={brush === b.key}
              className={`nemo-brush ${brush === b.key ? 'on' : ''}`}
              onClick={() => setBrush(b.key)}
              title={`Pena ${b.label}`}
              aria-label={`Pena ${b.label}`}
            >
              <span className="nemo-brush-dot" style={{ width: b.dot, height: b.dot }} />
              {b.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`nemo-guide-toggle ${showGuide ? 'on' : ''}`}
          onClick={() => setShowGuide((v) => !v)}
          aria-pressed={showGuide}
          title="Tampilkan/sembunyikan grid & bayangan"
        >
          <PenLine size={15} /> Panduan
        </button>
      </div>

      {/* ── Panggung tulis ── */}
      <div className="nemo-sketch-stage">
        {bg && showGuide && <img className="nemo-sketch-bg" src={bg} alt="" draggable="false" aria-hidden />}

        {/* Grid genkou 田字格: kotak luar + crosshair + diagonal. */}
        {showGuide && (
          <svg className="nemo-sketch-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <rect x="0.5" y="0.5" width="99" height="99" rx="2" className="g-outline" />
            <line x1="50" y1="0" x2="50" y2="100" className="g-mid" />
            <line x1="0" y1="50" x2="100" y2="50" className="g-mid" />
            <line x1="0" y1="0" x2="100" y2="100" className="g-diag" />
            <line x1="100" y1="0" x2="0" y2="100" className="g-diag" />
          </svg>
        )}

        <canvas
          ref={canvasRef}
          className="nemo-sketch-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
      </div>

      {/* ── Aksi ── */}
      <div className="nemo-sketch-actions">
        <button type="button" className="nemo-nav-btn" onClick={undo} disabled={!canUndo}>
          <Undo2 size={16} /> Undo
        </button>
        <button type="button" className="nemo-nav-btn" onClick={clear}>
          <Eraser size={16} /> Hapus
        </button>
      </div>

      <p className="nemo-sketch-hint">
        <Info size={13} aria-hidden />
        {reading
          ? <> Tulis <b>{entry.kanji}</b> (baca: {reading}) mengikuti panduan. Tekan "Panduan" untuk sembunyikan grid & bayangan saat uji ingatan.</>
          : <> Tulis kanji mengikuti panduan di baliknya.</>}
      </p>
    </div>
  )
}
