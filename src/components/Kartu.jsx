import { useEffect, useMemo, useRef, useState } from 'react'
import { shuffle } from '../lib/ui'
import { isMastered } from '../lib/srs'
import { kanaToRomaji } from '../lib/kana'
import { speak } from '../lib/tts'
import { materialOf, stampOf } from '../data/materials'

const GRADES = [
  { key: 'again', label: 'Lupa', sub: 'ulang sekarang', cls: 'g-again' },
  { key: 'hard', label: 'Berat', sub: 'interval kecil', cls: 'g-hard' },
  { key: 'good', label: 'OK', sub: 'interval normal', cls: 'g-good' },
  { key: 'easy', label: 'Mudah', sub: 'interval besar', cls: 'g-easy' },
]

// Kartu belajar ala desain asli: flip 3D, genkou grid, hanko, TTS, swipe.
export default function Kartu({
  entries,
  cards,
  onGrade,
  onReshuffle,
  material,
  direction = 'jp2id',
  showRomaji = false,
  deckKey = 0,
  onlyLearning = false,
}) {
  const deck = useMemo(() => {
    const list = onlyLearning
      ? entries.filter((e) => {
          const c = cards[e.id]
          return c && !isMastered(c)
        })
      : entries
    return shuffle(list)
    // cards sengaja tidak di-depend: deck stabil selama sesi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, onlyLearning, deckKey])

  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [session, setSession] = useState({ belum: 0, hafal: 0 })
  const touch = useRef(null)

  useEffect(() => {
    setIdx(0)
    setFlipped(false)
    setSession({ belum: 0, hafal: 0 })
  }, [deckKey, material, onlyLearning])

  const entry = deck[idx]
  const info = materialOf(material)
  const done = !entry

  const nav = (d) => {
    setFlipped(false)
    setIdx((i) => i + d)
  }

  const handleGrade = (g) => {
    if (!entry) return
    onGrade(entry.id, g, cards[entry.id] || null)
    setSession((s) => (g === 'again' ? { ...s, belum: s.belum + 1 } : { ...s, hafal: s.hafal + 1 }))
    setFlipped(false)
    setIdx((i) => i + 1)
  }

  // Keyboard: Space/Enter flip · ←/→ navigasi · 1-4 grade saat terbalik.
  useEffect(() => {
    const h = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowLeft') {
        nav(-1)
      } else if (e.key === 'ArrowRight') {
        nav(1)
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleGrade(GRADES[Number(e.key) - 1].key)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  // Swipe kiri/kanan ala desain asli (threshold 70px).
  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) nav(dx < 0 ? 1 : -1)
  }

  if (done && deck.length === 0) {
    return (
      <div className="panel">
        <div className="big-emoji">🎉</div>
        <h3>{onlyLearning ? 'Tidak ada kartu untuk diulang' : 'Deck kosong'}</h3>
        <p>
          {onlyLearning
            ? 'Semua kartu yang sedang dipelajari sudah lancar. Kartu baru akan muncul di sini setelah dinilai "Lupa".'
            : 'Pilih minimal satu pelajaran pada panel kontrol di atas.'}
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="panel">
        <div className="big-emoji">✅</div>
        <h3>Deck selesai!</h3>
        <p>
          <span className="kin-count">{session.hafal}</span> langsung lancar ·{' '}
          <span className="kin-count">{session.belum}</span> perlu diulang
        </p>
        <div className="row mt no-print">
          <button className="primary-btn" onClick={onReshuffle}>
            Kocok ulang deck
          </button>
        </div>
      </div>
    )
  }

  const jp2id = direction === 'jp2id'
  const frontEntry = jp2id ? entry.front : entry.backShort
  const frontSubEntry = jp2id ? entry.reading : ''
  const backMain = jp2id ? entry.backShort : entry.front
  const backReading = jp2id ? '' : entry.reading
  const jpText = entry.reading || entry.front
  const romaji = showRomaji ? kanaToRomaji(jpText) : ''

  const doSpeak = (e) => {
    e.stopPropagation()
    speak(entry.front)
  }

  const faceCommon = (isBack) => (
    <>
      <button className="speak-btn" onClick={doSpeak} title="Bunyikan (TTS)" aria-label="Bunyikan suara">
        🔊
      </button>
      <span className="hanko-stamp">{stampOf(entry, material)}</span>
      <div className="card-top">
        {info?.label} · {entry.groupLabel || 'Umum'}
      </div>
      <div className="card-body">
        {isBack ? (
          <>
            <div className="meaning">{backMain}</div>
            {backReading ? <div className="word-reading">{backReading}</div> : null}
            {!jp2id && entry.frontSub ? <div className="meaning-sub">{entry.frontSub}</div> : null}
            <div className="meaning-sub">{entry.backFull}</div>
            {!jp2id && romaji ? <div className="romaji-line">{romaji}</div> : null}
          </>
        ) : (
          <>
            <div className="word">{frontEntry}</div>
            {frontSubEntry ? <div className="word-reading">{frontSubEntry}</div> : null}
            {!jp2id ? null : entry.frontSub ? (
              <div className="meaning-sub">{entry.frontSub}</div>
            ) : null}
            {jp2id && romaji ? <div className="romaji-line">{romaji}</div> : null}
          </>
        )}
      </div>
      <div className="flip-hint">Ketuk untuk membalik · Spasi</div>
    </>
  )

  return (
    <>
      <div
        className="card-scene"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`card-wrap ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label="Kartu hafalan, ketuk untuk membalik"
        >
          <div className="card-face">{faceCommon(false)}</div>
          <div className="card-face back">{faceCommon(true)}</div>
        </div>
      </div>

      <div className="progress-row no-print">
        <button className="nav-chev" onClick={() => nav(-1)} title="Sebelumnya (←)" aria-label="Kartu sebelumnya">
          ‹
        </button>
        <div className="pbar">
          <div
            className="pbar-fill"
            style={{ width: `${Math.min(((idx + 1) / deck.length) * 100, 100)}%` }}
          />
        </div>
        <span className="plabel">
          {Math.min(idx + 1, deck.length)} / {deck.length}
        </span>
        <button className="nav-chev" onClick={() => nav(1)} title="Berikutnya (→)" aria-label="Kartu berikutnya">
          ›
        </button>
      </div>

      <div className="no-print">
        {flipped ? (
          <div className="grade-grid">
            {GRADES.map((g, i) => (
              <button
                key={g.key}
                className={`grade-btn ${g.cls}`}
                onClick={() => handleGrade(g.key)}
              >
                <span className="g-key">{i + 1}</span>
                <span className="g-label">{g.label}</span>
                <span className="g-sub">{g.sub}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="actions">
            <button className="act-btn" onClick={() => nav(-1)} aria-label="Sebelumnya">
              ‹
            </button>
            <button className="act-btn" onClick={() => setFlipped(true)}>
              Tampilkan jawaban
            </button>
            <button className="act-btn" onClick={() => nav(1)} aria-label="Berikutnya">
              ›
            </button>
          </div>
        )}
      </div>
    </>
  )
}
