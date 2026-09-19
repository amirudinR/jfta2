import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Undo2 } from 'lucide-react'
import { imgUrl } from '../../lib/nemonik'

// Canvas latihan tulis kanji (tanpa validasi goresan).
// Background: gambar kanji (img_kanji_bersih) dengan opacity rendah sebagai panduan.

// Batas riwayat undo agar memori terjaga (tiap snapshot = full ImageData).
const MAX_UNDO = 15

export default function NemonikSketch({ entry }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  // Riwayat snapshot untuk undo (ImageData disimpan terbatas).
  const strokesRef = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  // Penanda kartu terakhir agar resize TIDAK menghapus coretan (hanya kartu
  // baru yang mereset kanvas).
  const lastEntryNoRef = useRef(undefined)

  const bg = entry ? imgUrl(entry.img_kanji_bersih) : ''

  // Ukuran canvas mengikuti kontainer (device pixel ratio aware).
  // `preserve` = true → gambar yang ada dipertahankan (untuk resize).
  const setupCanvas = useCallback((preserve = false) => {
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
    ctx.lineWidth = 10
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
    lastEntryNoRef.current = entry?.no
    setupCanvas(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.no])

  // Resize → pertahankan coretan.
  useEffect(() => {
    const onResize = () => setupCanvas(true)
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
