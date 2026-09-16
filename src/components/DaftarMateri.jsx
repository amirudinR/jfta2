import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Search, CheckSquare, Square, ChevronLeft, Filter,
  ArrowUpDown, X, GraduationCap,
} from 'lucide-react'
import {
  HAFALAN_MODES, getMastered, toggleMastered, countMastered,
} from '../lib/hafalan-storage'
import { buildItems } from '../lib/hafalan-items'
import { ProgressBar } from './ui/ProgressBar'
import { DetailModal } from './hafalan/DetailModal'

const PAGE_SIZE = 50

export default function DaftarMateri({ onGoHafalan, onGoKotobaLevel, level = 'a2' }) {
  const activeMode = level
  const [tab, setTab] = useState('kotoba')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | hafal | belum
  const [sort, setSort] = useState('default') // default | alpha
  const [page, setPage] = useState(1)
  const [detailItem, setDetailItem] = useState(null)
  const [mastered, setMastered] = useState(() => getMastered())
  const listRef = useRef()

  const modeInfo = HAFALAN_MODES.find(m => m.key === activeMode)
  const hasKanji = modeInfo?.kanjiSrc != null
  const hasBunpou = modeInfo?.bunpouSrc != null

  // Reset page on filter/search/tab/mode change
  useEffect(() => { setPage(1) }, [query, filter, sort, tab, activeMode])

  // Level berubah dari LevelStrip global → reset tab & muat mastery terbaru.
  useEffect(() => {
    setTab('kotoba')
    setMastered(getMastered())
  }, [activeMode])

  // Build all items for current tab
  const allItems = useMemo(() => {
    const src = tab === 'kotoba' ? modeInfo?.kotobaSrc
      : tab === 'kanji' ? modeInfo?.kanjiSrc
      : modeInfo?.bunpouSrc
    return buildItems(src)
  }, [activeMode, tab])

  // Mastered map for current mode+tab
  const masteredMap = mastered[activeMode]?.[tab] || {}

  // Filter + search
  const filtered = useMemo(() => {
    let list = allItems
    // search
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(item =>
        item.front.toLowerCase().includes(q) ||
        item.reading.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        (item.full || '').toLowerCase().includes(q)
      )
    }
    // filter
    if (filter === 'hafal') list = list.filter(item => masteredMap[item.id])
    else if (filter === 'belum') list = list.filter(item => !masteredMap[item.id])
    // sort
    if (sort === 'alpha') list = [...list].sort((a, b) => a.front.localeCompare(b.front, 'ja'))
    return list
  }, [allItems, query, filter, sort, masteredMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const doToggle = useCallback((id) => {
    const next = toggleMastered(activeMode, tab, id)
    setMastered({ ...next })
  }, [activeMode, tab])

  // Counts per category
  const kotobaTotal = useMemo(() => buildItems(modeInfo?.kotobaSrc).length, [activeMode])
  const kanjiTotal = useMemo(() => hasKanji ? buildItems(modeInfo?.kanjiSrc).length : 0, [activeMode])
  const bunpouTotal = useMemo(() => hasBunpou ? buildItems(modeInfo?.bunpouSrc).length : 0, [activeMode])

  const kotobaHafal = countMastered(activeMode, 'kotoba')
  const kanjiHafal = hasKanji ? countMastered(activeMode, 'kanji') : 0
  const bunpouHafal = hasBunpou ? countMastered(activeMode, 'bunpou') : 0

  const grandTotal = kotobaTotal + kanjiTotal + bunpouTotal
  const grandHafal = kotobaHafal + kanjiHafal + bunpouHafal

  const currentTotal = tab === 'kotoba' ? kotobaTotal : tab === 'kanji' ? kanjiTotal : bunpouTotal
  const currentHafal = tab === 'kotoba' ? kotobaHafal : tab === 'kanji' ? kanjiHafal : bunpouHafal

  const tabLabel = tab === 'kotoba' ? 'Kotoba' : tab === 'kanji' ? 'Kanji' : 'Bunpou'

  return (
    <div className="dm-root">
      {/* Header */}
      <div className="dm-header">
        <button className="dm-back" onClick={onGoHafalan}>
          <ChevronLeft size={18} /> Hafalan Harian
        </button>
        <h2 className="dm-title">Daftar Materi</h2>
      </div>

      {/* Pintu masuk sengaja ke halaman latihan Kotoba level (N3/N2/N1).
          Halaman itu standalone (Kartu/Kuis/Ulangi/Daftar), dibuka HANYA dari
          sini — bukan lagi sebagai efek samping ganti level di LevelStrip. */}
      {onGoKotobaLevel && activeMode !== 'a2' && (
        <button className="dm-open-kotoba" onClick={onGoKotobaLevel}>
          <GraduationCap size={16} /> Latihan Kotoba {modeInfo?.label} (Kartu/Kuis)
        </button>
      )}

      {/* Grand summary */}
      <div className="dm-grand">
        Total dikuasai: <strong>{grandHafal.toLocaleString()}/{grandTotal.toLocaleString()}</strong> item
        ({grandTotal ? Math.round(grandHafal / grandTotal * 100) : 0}%)
      </div>

      {/* Per-category progress */}
      <div className="dm-progress-row">
        <ProgressBar current={kotobaHafal} total={kotobaTotal} label={`Kotoba ${modeInfo?.label}`} variant="card" formatCount={(n) => n.toLocaleString()} />
        {hasKanji && <ProgressBar current={kanjiHafal} total={kanjiTotal} label={`Kanji ${modeInfo?.label}`} variant="card" formatCount={(n) => n.toLocaleString()} />}
        {hasBunpou && <ProgressBar current={bunpouHafal} total={bunpouTotal} label={`Bunpou ${modeInfo?.label}`} variant="card" formatCount={(n) => n.toLocaleString()} />}
      </div>

      {/* Tabs */}
      <div className="hh-tabs">
        <button className={`hh-tab ${tab === 'kotoba' ? 'active' : ''}`} onClick={() => setTab('kotoba')}>
          ことば
          <span className="hh-tab-badge">{kotobaHafal}/{kotobaTotal}</span>
        </button>
        {hasKanji && (
          <button className={`hh-tab ${tab === 'kanji' ? 'active' : ''}`} onClick={() => setTab('kanji')}>
            漢字
            <span className="hh-tab-badge">{kanjiHafal}/{kanjiTotal}</span>
          </button>
        )}
        {hasBunpou && (
          <button className={`hh-tab ${tab === 'bunpou' ? 'active' : ''}`} onClick={() => setTab('bunpou')}>
            文法
            <span className="hh-tab-badge">{bunpouHafal}/{bunpouTotal}</span>
          </button>
        )}
      </div>

      {/* Category header */}
      <div className="dm-cat-head">
        {tabLabel} — {currentTotal.toLocaleString()} item · {currentHafal.toLocaleString()} hafal · {(currentTotal - currentHafal).toLocaleString()} belum
      </div>

      {/* Search + filters */}
      <div className="dm-controls">
        <div className="dm-search-wrap">
          <Search size={14} className="dm-search-icon" />
          <input className="dm-search" placeholder="Cari kata, kanji, arti..."
            value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button className="dm-search-clear" onClick={() => setQuery('')}><X size={14} /></button>}
        </div>
        <div className="dm-filters">
          <div className="dm-filter-group">
            <Filter size={12} />
            {['all', 'hafal', 'belum'].map(f => (
              <button key={f} className={`dm-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Semua' : f === 'hafal' ? 'Hafal' : 'Belum'}
              </button>
            ))}
          </div>
          <button className={`dm-sort-btn ${sort === 'alpha' ? 'active' : ''}`}
            onClick={() => setSort(s => s === 'default' ? 'alpha' : 'default')}>
            <ArrowUpDown size={12} /> {sort === 'alpha' ? 'A-Z' : '#'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="hh-list" ref={listRef}>
        {pageItems.map(item => {
          const isHafal = !!masteredMap[item.id]
          return (
            <div key={item.id} className={`hh-row ${isHafal ? 'checked' : ''}`}>
              <span className="hh-num">{item.num}</span>
              <div className="hh-content" onClick={() => setDetailItem(item)}>
                <div className="hh-front">
                  <span className="hh-jp">{item.front}</span>
                  {item.reading && <span className="hh-reading">{item.reading}</span>}
                </div>
                <div className="hh-meaning">{item.meaning}</div>
              </div>
              <button className={`hh-check-btn ${isHafal ? 'checked' : ''}`} onClick={() => doToggle(item.id)}>
                {isHafal ? <CheckSquare size={28} /> : <Square size={28} />}
              </button>
            </div>
          )
        })}
        {pageItems.length === 0 && (
          <div className="hh-empty">{query ? 'Tidak ditemukan.' : 'Tidak ada data.'}</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="dm-pagination">
          <button className="dm-page-btn" disabled={page <= 1} onClick={() => { setPage(p => p - 1); listRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
            ‹ Prev
          </button>
          <span className="dm-page-info">{page} / {totalPages} ({filtered.length} item)</span>
          <button className="dm-page-btn" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); listRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
            Next ›
          </button>
        </div>
      )}

      {/* Detail modal */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          isChecked={!!masteredMap[detailItem.id]}
          onToggle={() => doToggle(detailItem.id)}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  )
}
