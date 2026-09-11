import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { byMaterial } from '../data'
import {
  CheckSquare, Square, Plus, X, ChevronDown, ChevronUp,
  Trash2, Settings, Flame, Volume2, ChevronLeft,
} from 'lucide-react'

// ── Modes & their data sources ──
const HAFALAN_MODES = [
  { key: 'a2', label: 'JFT-A2', kanji: 'A2', kotobaSrc: 'kotoba', kanjiSrc: 'kanji' },
  { key: 'n3', label: 'N3', kanji: 'N3', kotobaSrc: 'kotoba-n3', kanjiSrc: null },
  { key: 'n2', label: 'N2', kanji: 'N2', kotobaSrc: 'kotoba-n2', kanjiSrc: null },
  { key: 'n1', label: 'N1', kanji: 'N1', kotobaSrc: 'kotoba-n1', kanjiSrc: null },
]

const DEFAULT_TARGETS = { a2: { kotoba: 50, kanji: 25 }, n3: { kotoba: 40, kanji: 0 }, n2: { kotoba: 40, kanji: 0 }, n1: { kotoba: 40, kanji: 0 } }
const STORAGE_PREFIX = 'hh2'
const REMINDER_HOUR = 21

// ── Storage helpers ──
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const lsGet = (k, fallback) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fallback } catch { return fallback } }
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

const getTargets = () => lsGet(`${STORAGE_PREFIX}-targets`, DEFAULT_TARGETS)
const setTargets = (v) => lsSet(`${STORAGE_PREFIX}-targets`, v)

const getChecked = (mode) => {
  const data = lsGet(`${STORAGE_PREFIX}-checked-${mode}`, { date: todayStr(), kotoba: {}, kanji: {} })
  if (data.date !== todayStr()) {
    // flush to history, reset
    flushToHistory(mode, data)
    const fresh = { date: todayStr(), kotoba: {}, kanji: {} }
    lsSet(`${STORAGE_PREFIX}-checked-${mode}`, fresh)
    return fresh
  }
  return data
}
const setCheckedStorage = (mode, data) => lsSet(`${STORAGE_PREFIX}-checked-${mode}`, data)

const getHistory = (mode) => lsGet(`${STORAGE_PREFIX}-hist-${mode}`, {})

function flushToHistory(mode, dayData) {
  if (!dayData?.date) return
  const targets = getTargets()
  const t = targets[mode] || DEFAULT_TARGETS[mode]
  const hist = getHistory(mode)
  const kc = Object.values(dayData.kotoba || {}).filter(Boolean).length
  const jc = Object.values(dayData.kanji || {}).filter(Boolean).length
  const targetKanji = t.kanji || 0
  hist[dayData.date] = { kotoba: kc, kanji: jc, done: kc >= t.kotoba && (targetKanji === 0 || jc >= targetKanji) }
  lsSet(`${STORAGE_PREFIX}-hist-${mode}`, hist)
}

function saveHistoryNow(mode, checked) {
  const targets = getTargets()
  const t = targets[mode] || DEFAULT_TARGETS[mode]
  const hist = getHistory(mode)
  const kc = Object.values(checked.kotoba || {}).filter(Boolean).length
  const jc = Object.values(checked.kanji || {}).filter(Boolean).length
  const targetKanji = t.kanji || 0
  hist[checked.date] = { kotoba: kc, kanji: jc, done: kc >= t.kotoba && (targetKanji === 0 || jc >= targetKanji) }
  lsSet(`${STORAGE_PREFIX}-hist-${mode}`, hist)
}

const getCustom = (mode) => lsGet(`${STORAGE_PREFIX}-custom-${mode}`, { kotoba: [], kanji: [] })
const setCustomStorage = (mode, data) => lsSet(`${STORAGE_PREFIX}-custom-${mode}`, data)

// ── TTS ──
function speak(text) {
  if (!window.speechSynthesis) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'; u.rate = 0.85
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

// ── Streak computation ──
function computeStreak(history) {
  let streak = 0
  const d = new Date()
  // check yesterday first, then backwards
  for (let i = 1; i <= 365; i++) {
    const check = new Date(d)
    check.setDate(check.getDate() - i)
    const key = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`
    if (history[key]?.done) streak++
    else break
  }
  // include today if done
  const todayEntry = history[todayStr()]
  if (todayEntry?.done) streak++
  return streak
}

// ── Heatmap ──
function Heatmap({ history, targets }) {
  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ key, d, entry: history[key] })
  }
  return (
    <div className="hh-heatmap">
      <div className="hh-heatmap-label">30 Hari Terakhir</div>
      <div className="hh-heatmap-grid">
        {days.map(({ key, d, entry }) => {
          let cls = 'hh-hm-cell'
          const isToday = key === todayStr()
          if (entry?.done) cls += ' done'
          else if (entry && (entry.kotoba > 0 || entry.kanji > 0)) cls += ' partial'
          else if (!isToday) cls += ' miss'
          if (isToday) cls += ' today'
          return (
            <div key={key} className={cls} title={`${key}: ${entry ? `${entry.kotoba}k + ${entry.kanji}j${entry.done ? ' ✓' : ''}` : isToday ? 'Hari ini' : '—'}`}>
              <span className="hh-hm-day">{d.getDate()}</span>
            </div>
          )
        })}
      </div>
      <div className="hh-heatmap-legend">
        <span className="hh-hm-cell miss" style={{ width: 12, height: 12 }} /> Kosong
        <span className="hh-hm-cell partial" style={{ width: 12, height: 12 }} /> Sebagian
        <span className="hh-hm-cell done" style={{ width: 12, height: 12 }} /> Tercapai
      </div>
    </div>
  )
}

// ── Progress Bar ──
function ProgressBar({ current, target, label }) {
  if (target <= 0) return null
  const pct = Math.min(100, Math.round((current / target) * 100))
  const full = current >= target
  return (
    <div className="hh-progress">
      <div className="hh-progress-header">
        <span className="hh-progress-label">{label}</span>
        <span className={`hh-progress-count ${full ? 'full' : ''}`}>{current}/{target}</span>
      </div>
      <div className="hh-progress-track">
        <div className={`hh-progress-fill ${full ? 'full' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Detail Modal ──
function DetailModal({ item, isChecked, onToggle, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="hh-modal-overlay" onClick={onClose}>
      <div className="hh-modal" onClick={e => e.stopPropagation()}>
        <button className="hh-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="hh-modal-main">
          <span className="hh-modal-num">#{item.num}</span>
          <div className="hh-modal-front">{item.front}</div>
          {item.reading && <div className="hh-modal-reading">{item.reading}</div>}
          <div className="hh-modal-meaning">{item.full || item.meaning}</div>
          {item.example && <div className="hh-modal-example">例: {item.example}</div>}
        </div>

        <div className="hh-modal-actions">
          <button className="hh-modal-tts" onClick={() => speak(item.front)} title="Dengarkan">
            <Volume2 size={20} />
          </button>
          <button className={`hh-modal-hafal ${isChecked ? 'checked' : ''}`} onClick={onToggle}>
            {isChecked ? <CheckSquare size={22} /> : <Square size={22} />}
            {isChecked ? 'Sudah Hafal' : 'Tandai Hafal'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Settings Panel ──
function SettingsPanel({ mode, targets, onSave, onClose }) {
  const t = targets[mode] || DEFAULT_TARGETS[mode]
  const [kotoba, setKotoba] = useState(t.kotoba)
  const [kanji, setKanji] = useState(t.kanji)
  const hasKanji = HAFALAN_MODES.find(m => m.key === mode)?.kanjiSrc != null

  return (
    <div className="hh-settings">
      <div className="hh-settings-head">
        <span>Target Harian — {HAFALAN_MODES.find(m => m.key === mode)?.label}</span>
        <button className="hh-close-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <label className="hh-setting-row">
        <span>Kotoba per hari</span>
        <input type="number" min={1} max={200} value={kotoba} onChange={e => setKotoba(Math.max(1, +e.target.value || 1))} className="hh-input hh-input-sm" />
      </label>
      {hasKanji && (
        <label className="hh-setting-row">
          <span>Kanji per hari</span>
          <input type="number" min={1} max={100} value={kanji} onChange={e => setKanji(Math.max(1, +e.target.value || 1))} className="hh-input hh-input-sm" />
        </label>
      )}
      <button className="hh-add-submit" onClick={() => { onSave({ ...targets, [mode]: { kotoba, kanji: hasKanji ? kanji : 0 } }); onClose() }}>
        Simpan Target
      </button>
    </div>
  )
}

// ── Add Form ──
function AddForm({ type, onAdd, onClose }) {
  const [front, setFront] = useState('')
  const [reading, setReading] = useState('')
  const [meaning, setMeaning] = useState('')
  const ref = useRef()
  useEffect(() => { ref.current?.focus() }, [])

  const submit = (e) => {
    e.preventDefault()
    if (!front.trim() || !meaning.trim()) return
    onAdd({ front: front.trim(), reading: reading.trim(), meaning: meaning.trim() })
    setFront(''); setReading(''); setMeaning('')
    ref.current?.focus()
  }

  return (
    <form className="hh-add-form" onSubmit={submit}>
      <div className="hh-add-title">
        Tambah {type === 'kotoba' ? 'Kotoba' : 'Kanji'} Baru
        <button type="button" className="hh-close-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="hh-add-fields">
        <input ref={ref} className="hh-input" placeholder={type === 'kotoba' ? '漢字 / ひらがな' : '漢字'} value={front} onChange={e => setFront(e.target.value)} />
        <input className="hh-input" placeholder="Cara baca" value={reading} onChange={e => setReading(e.target.value)} />
        <input className="hh-input" placeholder="Arti (Indonesia)" value={meaning} onChange={e => setMeaning(e.target.value)} />
      </div>
      <button type="submit" className="hh-add-submit" disabled={!front.trim() || !meaning.trim()}>
        <Plus size={14} /> Tambah
      </button>
    </form>
  )
}

// ── Main ──
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

  // Reload checked/custom when mode changes
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
      {/* ── Mode selector ── */}
      <div className="hh-mode-bar">
        {HAFALAN_MODES.map(m => (
          <button key={m.key} className={`hh-mode-btn ${activeMode === m.key ? 'active' : ''}`} onClick={() => switchMode(m.key)}>
            <span className="hh-mode-kanji">{m.kanji}</span>
            <span className="hh-mode-label">{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Reminder ── */}
      {showReminder && (
        <div className="hh-reminder">
          Target belum tercapai! {kotobaCheckedCount}/{t.kotoba} kotoba
          {hasKanji ? `, ${kanjiCheckedCount}/${t.kanji} kanji` : ''}
        </div>
      )}

      {/* ── Done banner ── */}
      {allDone && <div className="hh-done-banner">Target hari ini tercapai! すごい！</div>}

      {/* ── Header: streak + settings ── */}
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

      {/* ── Settings ── */}
      {showSettings && (
        <SettingsPanel mode={activeMode} targets={targets} onSave={saveTargets} onClose={() => setShowSettings(false)} />
      )}

      {/* ── Progress bars ── */}
      <div className="hh-stats">
        <ProgressBar current={kotobaCheckedCount} target={t.kotoba} label="Kotoba" />
        {hasKanji && <ProgressBar current={kanjiCheckedCount} target={t.kanji} label="Kanji" />}
      </div>

      {/* ── Heatmap ── */}
      <button className="hh-heatmap-toggle" onClick={() => setShowHeatmap(v => !v)}>
        Riwayat {showHeatmap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showHeatmap && <Heatmap history={history} targets={t} />}

      {/* ── Tabs (kotoba / kanji) ── */}
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

      {/* ── Item List ── */}
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

      {/* ── Add Form ── */}
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

      {/* ── Detail Modal ── */}
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
