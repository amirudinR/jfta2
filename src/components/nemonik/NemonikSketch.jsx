import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Undo2 } from 'lucide-react'
import { imgUrl } from '../../lib/nemonik'

// Canvas latihan tulis kanji (tanpa validasi goresan).
// Background: gambar kanji (img_kanji_bersih) dengan opacity rendah sebagai panduan.
export default function NemonikSketch({ entry }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  // Riwayat snapshot untuk undo (ImageData disimpan terbatas).
  const strokesRef = useRef([])
  const [canUndo, setCanUndo] = useState(false)

  const bg = entry ? imgUrl(entry.img_kanji_bersih) : ''

  // Ukuran canvas mengikuti kontainer (device pixel ratio aware).
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#c1402a'
    strokesRef.current = []
    setCanUndo(false)
  }, [])

  useEffect(() => {
    setupCanvas()
    const onResize = () => setupCanvas()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setupCanvas, entry])

  const pointFromEvent = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    drawingRef.current = true
    const { x, y } = pointFromEvent(e)
    // Simpan state sebelum goresan baru (untuk undo).
    strokesRef.current.push(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height))
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

  return (
    <div className="nemo-sketch">
      <div className="nemo-sketch-stage">
        {bg && <img className="nemo-sketch-bg" src={bg} alt="" draggable="false" aria-hidden />}
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
      <div className="nemo-sketch-actions">
        <button type="button" className="nemo-nav-btn" onClick={undo} disabled={!canUndo}>
          <Undo2 size={16} /> Undo
        </button>
        <button type="button" className="nemo-nav-btn" onClick={clear}>
          <Eraser size={16} /> Hapus
        </button>
      </div>
      <p className="nemo-sketch-hint">Tulis kanji mengikuti bayangan di belakang.</p>
    </div>
  )
}
