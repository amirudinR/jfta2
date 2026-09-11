import { useState, useMemo, useEffect, useCallback } from 'react'
import { byMaterial } from '../data'
import { CheckSquare, Square, Plus, ChevronDown, ChevronUp, Trash2, Settings, Flame } from 'lucide-react'
import {
  HAFALAN_MODES, DEFAULT_TARGETS, REMINDER_HOUR,
  todayStr, getTargets, setTargets, getHistory, getChecked,
  setCheckedStorage, getCustom, setCustomStorage,
  flushToHistory, saveHistoryNow, computeStreak,
} from '../lib/hafalan-storage'
import { Heatmap } from './hafalan/Heatmap'
import { ProgressBar } from './hafalan/ProgressBar'
import { DetailModal } from './hafalan/DetailModal'
import { SettingsPanel } from './hafalan/SettingsPanel'
import { AddForm } from './hafalan/AddForm'

export default function HafalanHarian() {
  const [activeMode, setActiveMode] = useState('a2')
  const [tab, setTab] = useState('kotoba')
  const [targets, setTargetsState] = useState(() => getTargets())
  const [checked, setChecked] = useState(() => getChecked('a2'))
  const [custom, setCustom] = useState(() => getCustom('a2'))
  const [showSettings, setShowSettings] = useState(false)
  const [showForm, setShowForm] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [detailItem, setDetailItem] = useState(null)

  const modeInfo = HAFALAN_MODES.find(m => m.key === activeMode)
  const hasKanji = modeInfo?.kanjiSrc != null
  const t = targets[activeMode] || DEFAULT_TARGETS[activeMode]

  const switchMode = useCallback((mode) => {
    setActiveMode(mode)
    setChecked(getChecked(mode))
    setCustom(getCustom(mode))
    setTab('kotoba')
    setDetailItem(null)
    setShowForm(null)
  }, [])

  // Auto-reset at midnight
  useEffect(() => {
    const check = () => {
      if (checked.date !== todayStr()) {
        flushToHistory(activeMode, checked)
        const fresh = { date: todayStr(), kotoba: {}, kanji: {} }
        setChecked(fresh)
        setCheckedStorage(activeMode, fresh)
      }
    }
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [checked, activeMode])

  // Build items from data
  const kotobaAll = useMemo(() => {
    if (!modeInfo) return []
    return byMaterial(modeInfo.kotobaSrc).map((e, i) => ({
      id: `b-${e.id}`, num: i + 1, front: e.front,
      reading: e.frontSub || e.reading || '',
      meaning: e.backShort, full: e.backFull, custom: false,
    }))
  }, [activeMode])

  const kanjiAll = useMemo(() => {
    if (!modeInfo?.kanjiSrc) return []
    return byMaterial(modeInfo.kanjiSrc).map((e, i) => ({
      id: `b-${e.id}`, num: i + 1, front: e.front,
      reading: e.reading || e.frontSub || '',
      meaning: e.backShort, full: e.backFull, custom: false,
    }))
  }, [activeMode])

  const kotobaWithCustom = useMemo(() => {
    const cust = (custom.kotoba || []).map((e, i) => ({
      id: `c-${i}`, num: kotobaAll.length + i + 1, front: e.front,
      reading: e.reading, meaning: e.meaning, full: e.meaning,
      custom: true, customIdx: i,
    }))
    return [...kotobaAll, ...cust]
  }, [kotobaAll, custom])

  const kanjiWithCustom = useMemo(() => {
    const cust = (custom.kanji || []).map((e, i) => ({
      id: `c-${i}`, num: kanjiAll.length + i + 1, front: e.front,
      reading: e.reading, meaning: e.meaning, full: e.meaning,
      custom: true, customIdx: i,
    }))
    return [...kanjiAll, ...cust]
  }, [kanjiAll, custom])

  // Daily slice: sequential rotation
  const dayPage = useMemo(() => {
    const hist = getHistory(activeMode)
    const dates = Object.keys(hist).sort()
    if (!dates.length) return 0
    const first = new Date(dates[0])
    const today = new Date(todayStr())
    return Math.floor((today - first) / 86400000)
  }, [activeMode])

  const kotobaSlice = useMemo(() => {
    const src = kotobaWithCustom
    if (!src.length || t.kotoba <= 0) return []
    const start = (dayPage * t.kotoba) % src.length
    const items = []
    for (let i = 0; i < t.kotoba && i < src.length; i++) items.push(src[(start + i) % src.length])
    return items
  }, [kotobaWithCustom, dayPage, t.kotoba])

  const kanjiSlice = useMemo(() => {
    const src = kanjiWithCustom
    if (!src.length || t.kanji <= 0) return []
    const start = (dayPage * t.kanji) % src.length
    const items = []
    for (let i = 0; i < t.kanji && i < src.length; i++) items.push(src[(start + i) % src.length])
    return items
  }, [kanjiWithCustom, dayPage, t.kanji])

  // Counts
  const kotobaCheckedCount = Object.values(checked.kotoba || {}).filter(Boolean).length
  const kanjiCheckedCount = Object.values(checked.kanji || {}).filter(Boolean).length
  const kotobaDone = kotobaCheckedCount >= t.kotoba
  const kanjiDone = t.kanji <= 0 || kanjiCheckedCount >= t.kanji
  const allDone = kotobaDone && kanjiDone

  const history = useMemo(() => getHistory(activeMode), [checked, activeMode])
  const streak = useMemo(() => computeStreak(history), [history])

  const hour = new Date().getHours()
  const showReminder = hour >= REMINDER_HOUR && !allDone

  // Actions
  const toggle = (type, id) => {
    const next = { ...checked, [type]: { ...checked[type], [id]: !checked[type]?.[id] } }
    setChecked(next)
    setCheckedStorage(activeMode, next)
    saveHistoryNow(activeMode, next)
  }

  const addCustom = (type, item) => {
    const next = { ...custom, [type]: [...(custom[type] || []), item] }
    setCustom(next)
    setCustomStorage(activeMode, next)
  }

  const removeCustom = (type, idx) => {
    const next = { ...custom, [type]: custom[type].filter((_, i) => i !== idx) }
    setCustom(next)
    setCustomStorage(activeMode, next)
  }

  const saveTargets = (newTargets) => {
    setTargetsState(newTargets)
    setTargets(newTargets)
  }

  const items = tab === 'kotoba' ? kotobaSlice : kanjiSlice
  const checkedMap = tab === 'kotoba' ? checked.kotoba : checked.kanji

  return (
    <div className="hh-root">
      {/* Mode selector */}
      <div className="hh-mode-bar">
        {HAFALAN_MODES.map(m => (
          <button key={m.key} className={`hh-mode-btn ${activeMode === m.key ? 'active' : ''}`} onClick={() => switchMode(m.key)}>
            <span className="hh-mode-kanji">{m.kanji}</span>
            <span className="hh-mode-label">{m.label}</span>
          </button>
        ))}
      </div>

      {showReminder && (
        <div className="hh-reminder">
          Target belum tercapai! {kotobaCheckedCount}/{t.kotoba} kotoba
          {hasKanji ? `, ${kanjiCheckedCount}/${t.kanji} kanji` : ''}
        </div>
      )}

      {allDone && <div className="hh-done-banner">Target hari ini tercapai! すごい！</div>}

      {/* Streak + settings */}
      <div className="hh-header">
        <div className="hh-streak">
          <Flame size={18} className={streak > 0 ? 'hh-flame-on' : ''} />
          <span className="hh-streak-num">{streak}</span>
          <span className="hh-streak-label">hari berturut</span>
        </div>
        <button className="hh-settings-btn" onClick={() => setShowSettings(v => !v)}>
          <Settings size={16} />
        </button>
      </div>

      {showSettings && (
        <SettingsPanel mode={activeMode} targets={targets} onSave={saveTargets} onClose={() => setShowSettings(false)} />
      )}

      {/* Progress */}
      <div className="hh-stats">
        <ProgressBar current={kotobaCheckedCount} target={t.kotoba} label="Kotoba" />
        {hasKanji && <ProgressBar current={kanjiCheckedCount} target={t.kanji} label="Kanji" />}
      </div>

      {/* Heatmap */}
      <button className="hh-heatmap-toggle" onClick={() => setShowHeatmap(v => !v)}>
        Riwayat {showHeatmap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showHeatmap && <Heatmap history={history} targets={t} />}

      {/* Tabs */}
      <div className="hh-tabs">
        <button className={`hh-tab ${tab === 'kotoba' ? 'active' : ''}`} onClick={() => setTab('kotoba')}>
          ことば Kotoba
          <span className="hh-tab-badge">{kotobaCheckedCount}/{t.kotoba}</span>
        </button>
        {hasKanji && (
          <button className={`hh-tab ${tab === 'kanji' ? 'active' : ''}`} onClick={() => setTab('kanji')}>
            漢字 Kanji
            <span className="hh-tab-badge">{kanjiCheckedCount}/{t.kanji}</span>
          </button>
        )}
      </div>

      {/* Item List */}
      <div className="hh-list">
        {items.map((item) => {
          const isChecked = !!checkedMap?.[item.id]
          return (
            <div key={item.id} className={`hh-row ${isChecked ? 'checked' : ''}`}>
              <span className="hh-num">{item.num}</span>
              <div className="hh-content" onClick={() => setDetailItem(item)}>
                <div className="hh-front">
                  <span className="hh-jp">{item.front}</span>
                  {item.reading && <span className="hh-reading">{item.reading}</span>}
                </div>
                <div className="hh-meaning">{item.meaning}</div>
              </div>
              <button className={`hh-check-btn ${isChecked ? 'checked' : ''}`} onClick={() => toggle(tab, item.id)}>
                {isChecked ? <CheckSquare size={28} /> : <Square size={28} />}
              </button>
              {item.custom && (
                <button className="hh-del-custom" onClick={() => removeCustom(tab, item.customIdx)} title="Hapus">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
        {items.length === 0 && (
          <div className="hh-empty">Tidak ada data untuk mode ini.</div>
        )}
      </div>

      {/* Add Form */}
      {showForm === tab ? (
        <AddForm type={tab} onAdd={(item) => addCustom(tab, item)} onClose={() => setShowForm(null)} />
      ) : (
        <button className="hh-add-btn" onClick={() => setShowForm(tab)}>
          <Plus size={16} /> Tambah {tab === 'kotoba' ? 'Kotoba' : 'Kanji'} Baru
        </button>
      )}

      <div className="hh-info">
        Target: {t.kotoba} kotoba{hasKanji ? ` + ${t.kanji} kanji` : ''} / hari · Reset 00:00 ·
        Total: {tab === 'kotoba' ? kotobaWithCustom.length : kanjiWithCustom.length} item
      </div>

      {detailItem && (
        <DetailModal
          item={detailItem}
          isChecked={!!checkedMap?.[detailItem.id]}
          onToggle={() => toggle(tab, detailItem.id)}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  )
}
