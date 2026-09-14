import { useState, useMemo, useEffect } from 'react'
import { byMaterial } from '../data'
import { CheckSquare, Square, Plus, ChevronDown, ChevronUp, Trash2, Settings, Flame, BookText, ListChecks, History } from 'lucide-react'
import {
  HAFALAN_MODES, DEFAULT_TARGETS, REMINDER_HOUR,
  todayStr, getTargets, setTargets, getHistory, getChecked,
  setCheckedStorage, getCustom, setCustomStorage,
  flushToHistory, saveHistoryNow, computeStreak, newCustomId,
} from '../lib/hafalan-storage'
import { Heatmap } from './hafalan/Heatmap'
import { ProgressBar } from './hafalan/ProgressBar'
import { DetailModal } from './hafalan/DetailModal'
import { SettingsPanel } from './hafalan/SettingsPanel'
import { AddForm } from './hafalan/AddForm'
import { UjianHarian } from './hafalan/UjianHarian'

function buildItems(material) {
  if (!material) return []
  return byMaterial(material).map((e, i) => ({
    id: `b-${e.id}`, num: i + 1, front: e.front,
    reading: e.frontSub || e.reading || '',
    meaning: e.backShort, full: e.backFull, custom: false,
  }))
}

function appendCustom(builtIn, customs) {
  return [
    ...builtIn,
    ...(customs || []).map((e, i) => ({
      id: e.id || `c-${i}`, num: builtIn.length + i + 1, front: e.front,
      reading: e.reading, meaning: e.meaning, full: e.meaning,
      custom: true, customIdx: i,
    })),
  ]
}

function dailySlice(src, dayPage, count) {
  if (!src.length || count <= 0) return []
  const start = (dayPage * count) % src.length
  const items = []
  for (let i = 0; i < count && i < src.length; i++) items.push(src[(start + i) % src.length])
  return items
}

export default function HafalanHarian({ onGoMateri, onGoRecall, level = 'a2' }) {
  const activeMode = level
  const [tab, setTab] = useState('kotoba')
  const [targets, setTargetsState] = useState(() => getTargets())
  const [checked, setChecked] = useState(() => getChecked(level))
  const [custom, setCustom] = useState(() => getCustom(level))
  const [showSettings, setShowSettings] = useState(false)
  const [showForm, setShowForm] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [showExam, setShowExam] = useState(false)

  const modeInfo = HAFALAN_MODES.find(m => m.key === activeMode)
  const hasKanji = modeInfo?.kanjiSrc != null
  const hasBunpou = modeInfo?.bunpouSrc != null
  const t = targets[activeMode] || DEFAULT_TARGETS[activeMode]

  // Level berubah (dari LevelStrip global) → muat ulang data mode.
  useEffect(() => {
    setChecked(getChecked(activeMode))
    setCustom(getCustom(activeMode))
    setTab('kotoba')
    setDetailItem(null)
    setShowForm(null)
  }, [activeMode])

  // Auto-reset at midnight
  useEffect(() => {
    const check = () => {
      if (checked.date !== todayStr()) {
        flushToHistory(activeMode, checked)
        const fresh = { date: todayStr(), kotoba: {}, kanji: {}, bunpou: {} }
        setChecked(fresh)
        setCheckedStorage(activeMode, fresh)
      }
    }
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [checked, activeMode])

  // Build items
  const kotobaAll = useMemo(() => buildItems(modeInfo?.kotobaSrc), [activeMode])
  const kanjiAll = useMemo(() => buildItems(modeInfo?.kanjiSrc), [activeMode])
  const bunpouAll = useMemo(() => buildItems(modeInfo?.bunpouSrc), [activeMode])

  const kotobaWithCustom = useMemo(() => appendCustom(kotobaAll, custom.kotoba), [kotobaAll, custom])
  const kanjiWithCustom = useMemo(() => appendCustom(kanjiAll, custom.kanji), [kanjiAll, custom])
  const bunpouWithCustom = useMemo(() => appendCustom(bunpouAll, custom.bunpou), [bunpouAll, custom])

  // Day page for rotation
  const dayPage = useMemo(() => {
    const hist = getHistory(activeMode)
    const dates = Object.keys(hist).sort()
    if (!dates.length) return 0
    const first = new Date(dates[0])
    const today = new Date(todayStr())
    return Math.floor((today - first) / 86400000)
  }, [activeMode])

  const kotobaSlice = useMemo(() => dailySlice(kotobaWithCustom, dayPage, t.kotoba), [kotobaWithCustom, dayPage, t.kotoba])
  const kanjiSlice = useMemo(() => dailySlice(kanjiWithCustom, dayPage, t.kanji), [kanjiWithCustom, dayPage, t.kanji])
  const bunpouSlice = useMemo(() => dailySlice(bunpouWithCustom, dayPage, t.bunpou || 0), [bunpouWithCustom, dayPage, t.bunpou])

  // Checked counts
  const kotobaCheckedCount = Object.values(checked.kotoba || {}).filter(Boolean).length
  const kanjiCheckedCount = Object.values(checked.kanji || {}).filter(Boolean).length
  const bunpouCheckedCount = Object.values(checked.bunpou || {}).filter(Boolean).length

  const kotobaDone = kotobaCheckedCount >= t.kotoba
  const kanjiDone = !t.kanji || kanjiCheckedCount >= t.kanji
  const bunpouDone = !t.bunpou || bunpouCheckedCount >= t.bunpou
  const allDone = kotobaDone && kanjiDone && bunpouDone

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
    const entry = { ...item, id: newCustomId() }
    const next = { ...custom, [type]: [...(custom[type] || []), entry] }
    setCustom(next)
    setCustomStorage(activeMode, next)
  }

  const removeCustom = (type, idx) => {
    if (!window.confirm('Yakin ingin menghapus item ini?')) return
    const next = { ...custom, [type]: custom[type].filter((_, i) => i !== idx) }
    setCustom(next)
    setCustomStorage(activeMode, next)
  }

  const saveTargets = (newTargets) => {
    setTargetsState(newTargets)
    setTargets(newTargets)
  }

  // Current tab data
  const itemsMap = { kotoba: kotobaSlice, kanji: kanjiSlice, bunpou: bunpouSlice }
  const totalMap = { kotoba: kotobaWithCustom, kanji: kanjiWithCustom, bunpou: bunpouWithCustom }
  const items = itemsMap[tab] || []
  const checkedMap = checked[tab] || {}

  // Build reminder text
  const reminderParts = [`${kotobaCheckedCount}/${t.kotoba} kotoba`]
  if (hasKanji) reminderParts.push(`${kanjiCheckedCount}/${t.kanji} kanji`)
  if (hasBunpou && t.bunpou > 0) reminderParts.push(`${bunpouCheckedCount}/${t.bunpou} bunpou`)

  // Tab label for add form
  const tabLabel = tab === 'kotoba' ? 'Kotoba' : tab === 'kanji' ? 'Kanji' : 'Bunpou'

  return (
    <div className="hh-root">
      {showExam ? (
        <UjianHarian onBack={() => setShowExam(false)} />
      ) : (
      <>
      {showReminder && (
        <div className="hh-reminder">
          Target belum tercapai! {reminderParts.join(', ')}
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
        <div className="hh-header-actions">
          <button className="hh-settings-btn" onClick={() => setShowExam(true)} title="Ujian Harian">
            <ListChecks size={16} /> <span className="hh-exam-btn-label">Ujian Harian</span>
          </button>
          {onGoRecall && (
            <button className="hh-settings-btn" onClick={onGoRecall} title="Recall materi lama">
              <History size={16} /> <span className="hh-exam-btn-label">Recall</span>
            </button>
          )}
          <button className="hh-settings-btn" onClick={() => setShowSettings(v => !v)}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <SettingsPanel mode={activeMode} targets={targets} onSave={saveTargets} onClose={() => setShowSettings(false)} />
      )}

      {/* Progress */}
      <div className="hh-stats">
        <ProgressBar current={kotobaCheckedCount} target={t.kotoba} label="Kotoba" />
        {hasKanji && <ProgressBar current={kanjiCheckedCount} target={t.kanji} label="Kanji" />}
        {hasBunpou && t.bunpou > 0 && <ProgressBar current={bunpouCheckedCount} target={t.bunpou} label="Bunpou" />}
      </div>

      {/* Heatmap */}
      <button className="hh-heatmap-toggle" onClick={() => setShowHeatmap(v => !v)}>
        Riwayat {showHeatmap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showHeatmap && <Heatmap history={history} targets={t} />}

      {/* Tabs */}
      <div className="hh-tabs">
        <button className={`hh-tab ${tab === 'kotoba' ? 'active' : ''}`} onClick={() => setTab('kotoba')}>
          ことば
          <span className="hh-tab-badge">{kotobaCheckedCount}/{t.kotoba}</span>
        </button>
        {hasKanji && (
          <button className={`hh-tab ${tab === 'kanji' ? 'active' : ''}`} onClick={() => setTab('kanji')}>
            漢字
            <span className="hh-tab-badge">{kanjiCheckedCount}/{t.kanji}</span>
          </button>
        )}
        {hasBunpou && t.bunpou > 0 && (
          <button className={`hh-tab ${tab === 'bunpou' ? 'active' : ''}`} onClick={() => setTab('bunpou')}>
            文法
            <span className="hh-tab-badge">{bunpouCheckedCount}/{t.bunpou}</span>
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
          <Plus size={16} /> Tambah {tabLabel} Baru
        </button>
      )}

      {onGoMateri && (
        <button className="hh-add-btn" onClick={onGoMateri} style={{ marginTop: 4 }}>
          <BookText size={16} /> Lihat Semua Materi
        </button>
      )}

      <div className="hh-info">
        Target: {t.kotoba} kotoba
        {hasKanji ? ` + ${t.kanji} kanji` : ''}
        {hasBunpou && t.bunpou > 0 ? ` + ${t.bunpou} bunpou` : ''}
        {' '}/ hari · Reset 00:00 ·
        Total: {(totalMap[tab] || []).length} item
      </div>

      {detailItem && (
        <DetailModal
          item={detailItem}
          isChecked={!!checkedMap?.[detailItem.id]}
          onToggle={() => toggle(tab, detailItem.id)}
          onClose={() => setDetailItem(null)}
        />
      )}
      </>
      )}
    </div>
  )
}
