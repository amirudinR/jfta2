import { useState, useMemo, useEffect, useRef } from 'react'
import { byMaterial } from '../data'
import { CheckSquare, Square, Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'hafalan-harian-v1'
const CUSTOM_KEY = 'hafalan-harian-custom-v1'
const HISTORY_KEY = 'hafalan-harian-history-v1'
const TARGET_KOTOBA = 50
const TARGET_KANJI = 25
const REMINDER_HOUR = 21

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadChecked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: todayStr(), kotoba: {}, kanji: {} }
    const data = JSON.parse(raw)
    if (data.date !== todayStr()) {
      // auto-reset: save yesterday to history first
      saveHistory(data)
      return { date: todayStr(), kotoba: {}, kanji: {} }
    }
    return data
  } catch { return { date: todayStr(), kotoba: {}, kanji: {} } }
}

function saveChecked(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function loadCustom() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    return raw ? JSON.parse(raw) : { kotoba: [], kanji: [] }
  } catch { return { kotoba: [], kanji: [] } }
}

function saveCustom(data) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(data)) } catch {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveHistory(dayData) {
  if (!dayData || !dayData.date) return
  const hist = loadHistory()
  const kotobaCount = Object.values(dayData.kotoba || {}).filter(Boolean).length
  const kanjiCount = Object.values(dayData.kanji || {}).filter(Boolean).length
  hist[dayData.date] = {
    kotoba: kotobaCount,
    kanji: kanjiCount,
    done: kotobaCount >= TARGET_KOTOBA && kanjiCount >= TARGET_KANJI,
  }
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(hist)) } catch {}
}

function saveHistoryNow(checked) {
  const hist = loadHistory()
  const kotobaCount = Object.values(checked.kotoba || {}).filter(Boolean).length
  const kanjiCount = Object.values(checked.kanji || {}).filter(Boolean).length
  hist[checked.date] = {
    kotoba: kotobaCount,
    kanji: kanjiCount,
    done: kotobaCount >= TARGET_KOTOBA && kanjiCount >= TARGET_KANJI,
  }
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(hist)) } catch {}
}

// --- Heatmap Calendar (30 days) ---
function Heatmap({ history }) {
  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const entry = history[key]
    days.push({ key, d, entry })
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

          const dayNum = d.getDate()
          const pct = entry
            ? Math.round(((entry.kotoba || 0) + (entry.kanji || 0)) / (TARGET_KOTOBA + TARGET_KANJI) * 100)
            : 0

          return (
            <div key={key} className={cls} title={`${key}: ${entry ? `${entry.kotoba}k + ${entry.kanji}j${entry.done ? ' ✓' : ''}` : isToday ? 'Hari ini' : '—'}`}>
              <span className="hh-hm-day">{dayNum}</span>
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

// --- Progress Bar ---
function ProgressBar({ current, target, label }) {
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

// --- Form Input ---
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

// --- Main Component ---
export default function HafalanHarian() {
  const [checked, setChecked] = useState(() => loadChecked())
  const [custom, setCustom] = useState(() => loadCustom())
  const [tab, setTab] = useState('kotoba')
  const [showForm, setShowForm] = useState(null) // 'kotoba' | 'kanji' | null
  const [expandedHeatmap, setExpandedHeatmap] = useState(false)
  const history = useMemo(() => loadHistory(), [checked])

  // Auto-reset at midnight
  useEffect(() => {
    const check = () => {
      if (checked.date !== todayStr()) {
        saveHistory(checked)
        const fresh = { date: todayStr(), kotoba: {}, kanji: {} }
        setChecked(fresh)
        saveChecked(fresh)
      }
    }
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [checked])

  // Build item lists: built-in data + custom entries
  const kotobaAll = useMemo(() => {
    const builtIn = byMaterial('kotoba').map((e, i) => ({
      id: `b-${e.id}`,
      num: i + 1,
      front: e.front,
      reading: e.frontSub || '',
      meaning: e.backShort,
      full: e.backFull,
      custom: false,
    }))
    const cust = (custom.kotoba || []).map((e, i) => ({
      id: `c-${i}`,
      num: builtIn.length + i + 1,
      front: e.front,
      reading: e.reading,
      meaning: e.meaning,
      full: e.meaning,
      custom: true,
      customIdx: i,
    }))
    return [...builtIn, ...cust]
  }, [custom])

  const kanjiAll = useMemo(() => {
    const builtIn = byMaterial('kanji').map((e, i) => ({
      id: `b-${e.id}`,
      num: i + 1,
      front: e.front,
      reading: e.reading || e.frontSub || '',
      meaning: e.backShort,
      full: e.backFull,
      custom: false,
    }))
    const cust = (custom.kanji || []).map((e, i) => ({
      id: `c-${i}`,
      num: builtIn.length + i + 1,
      front: e.front,
      reading: e.reading,
      meaning: e.meaning,
      full: e.meaning,
      custom: true,
      customIdx: i,
    }))
    return [...builtIn, ...cust]
  }, [custom])

  // Determine current day's page: day number from first use
  const dayPage = useMemo(() => {
    const hist = loadHistory()
    const allDates = Object.keys(hist).sort()
    if (allDates.length === 0) return 0
    const first = new Date(allDates[0])
    const today = new Date(todayStr())
    return Math.floor((today - first) / 86400000)
  }, [])

  const kotobaSlice = useMemo(() => {
    const start = (dayPage * TARGET_KOTOBA) % kotobaAll.length
    const items = []
    for (let i = 0; i < TARGET_KOTOBA && i < kotobaAll.length; i++) {
      items.push(kotobaAll[(start + i) % kotobaAll.length])
    }
    return items
  }, [kotobaAll, dayPage])

  const kanjiSlice = useMemo(() => {
    const start = (dayPage * TARGET_KANJI) % kanjiAll.length
    const items = []
    for (let i = 0; i < TARGET_KANJI && i < kanjiAll.length; i++) {
      items.push(kanjiAll[(start + i) % kanjiAll.length])
    }
    return items
  }, [kanjiAll, dayPage])

  const kotobaChecked = Object.values(checked.kotoba || {}).filter(Boolean).length
  const kanjiChecked = Object.values(checked.kanji || {}).filter(Boolean).length
  const allDone = kotobaChecked >= TARGET_KOTOBA && kanjiChecked >= TARGET_KANJI

  // Reminder banner
  const hour = new Date().getHours()
  const showReminder = hour >= REMINDER_HOUR && !allDone

  const toggle = (type, id) => {
    const next = { ...checked, [type]: { ...checked[type], [id]: !checked[type]?.[id] } }
    setChecked(next)
    saveChecked(next)
    saveHistoryNow(next)
  }

  const addCustom = (type, item) => {
    const next = { ...custom, [type]: [...(custom[type] || []), item] }
    setCustom(next)
    saveCustom(next)
  }

  const removeCustom = (type, idx) => {
    const next = { ...custom, [type]: custom[type].filter((_, i) => i !== idx) }
    setCustom(next)
    saveCustom(next)
  }

  const items = tab === 'kotoba' ? kotobaSlice : kanjiSlice
  const checkedMap = tab === 'kotoba' ? checked.kotoba : checked.kanji

  return (
    <div className="hh-root">
      {/* Reminder Banner */}
      {showReminder && (
        <div className="hh-reminder">
          ⚠️ Target harian belum tercapai! ({kotobaChecked}/{TARGET_KOTOBA} kotoba, {kanjiChecked}/{TARGET_KANJI} kanji)
        </div>
      )}

      {/* All Done Banner */}
      {allDone && (
        <div className="hh-done-banner">
          🎌 Target hari ini tercapai! Sugoi! すごい！
        </div>
      )}

      {/* Stats Cards */}
      <div className="hh-stats">
        <ProgressBar current={kotobaChecked} target={TARGET_KOTOBA} label="Kotoba" />
        <ProgressBar current={kanjiChecked} target={TARGET_KANJI} label="Kanji" />
      </div>

      {/* Heatmap Toggle */}
      <button className="hh-heatmap-toggle" onClick={() => setExpandedHeatmap(v => !v)}>
        Riwayat {expandedHeatmap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expandedHeatmap && <Heatmap history={history} />}

      {/* Tabs */}
      <div className="hh-tabs">
        <button className={`hh-tab ${tab === 'kotoba' ? 'active' : ''}`} onClick={() => setTab('kotoba')}>
          ことば Kotoba
          <span className="hh-tab-badge">{kotobaChecked}/{TARGET_KOTOBA}</span>
        </button>
        <button className={`hh-tab ${tab === 'kanji' ? 'active' : ''}`} onClick={() => setTab('kanji')}>
          漢字 Kanji
          <span className="hh-tab-badge">{kanjiChecked}/{TARGET_KANJI}</span>
        </button>
      </div>

      {/* Item List */}
      <div className="hh-list">
        {items.map((item) => {
          const isChecked = !!checkedMap?.[item.id]
          return (
            <div key={item.id} className={`hh-row ${isChecked ? 'checked' : ''}`} onClick={() => toggle(tab, item.id)}>
              <span className="hh-num">{item.num}</span>
              <div className="hh-content">
                <div className="hh-front">
                  <span className="hh-jp">{item.front}</span>
                  {item.reading && <span className="hh-reading">{item.reading}</span>}
                </div>
                <div className="hh-meaning">{item.meaning}</div>
              </div>
              <div className={`hh-check ${isChecked ? 'checked' : ''}`}>
                {isChecked ? <CheckSquare size={28} /> : <Square size={28} />}
              </div>
              {item.custom && (
                <button className="hh-del-custom" onClick={(e) => { e.stopPropagation(); removeCustom(tab, item.customIdx) }} title="Hapus">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Button / Form */}
      {showForm === tab ? (
        <AddForm type={tab} onAdd={(item) => addCustom(tab, item)} onClose={() => setShowForm(null)} />
      ) : (
        <button className="hh-add-btn" onClick={() => setShowForm(tab)}>
          <Plus size={16} /> Tambah {tab === 'kotoba' ? 'Kotoba' : 'Kanji'} Baru
        </button>
      )}

      <div className="hh-info">
        Target harian: {TARGET_KOTOBA} kotoba + {TARGET_KANJI} kanji · Reset otomatis jam 00:00
      </div>
    </div>
  )
}
