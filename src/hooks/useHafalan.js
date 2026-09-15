// State + efek + aksi layar Hafalan Harian (logika dipisah dari render).
import { useState, useMemo, useEffect } from 'react'
import {
  HAFALAN_MODES, DEFAULT_TARGETS, REMINDER_HOUR,
  todayStr, getTargets, setTargets, getHistory, getChecked,
  setCheckedStorage, getCustom, setCustomStorage,
  flushToHistory, saveHistoryNow, computeStreak, newCustomId,
} from '../lib/hafalan-storage'
import { buildItems, appendCustom, dailySlice } from '../lib/hafalan-items'

export function useHafalan({ level = 'a2' }) {
  const activeMode = level
  const [tab, _setTab] = useState('kotoba')
  const [targets, setTargetsState] = useState(() => getTargets())
  const [checked, setChecked] = useState(() => getChecked(level))
  const [custom, setCustom] = useState(() => getCustom(level))
  const [showSettings, setShowSettings] = useState(false)
  const [showForm, setShowForm] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [showExam, setShowExam] = useState(false)
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null)

  const setTab = (t) => {
    _setTab(t)
    setConfirmDeleteKey(null) // reset confirm saat ganti tab
  }

  const modeInfo = HAFALAN_MODES.find((m) => m.key === activeMode)
  const hasKanji = modeInfo?.kanjiSrc != null
  const hasBunpou = modeInfo?.bunpouSrc != null
  const t = targets[activeMode] || DEFAULT_TARGETS[activeMode]

  // Level berubah (dari LevelStrip global) → muat ulang data mode.
  useEffect(() => {
    setChecked(getChecked(activeMode))
    setCustom(getCustom(activeMode))
    _setTab('kotoba')
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

  // Build reminder text
  const reminderParts = [`${kotobaCheckedCount}/${t.kotoba} kotoba`]
  if (hasKanji) reminderParts.push(`${kanjiCheckedCount}/${t.kanji} kanji`)
  if (hasBunpou && t.bunpou > 0) reminderParts.push(`${bunpouCheckedCount}/${t.bunpou} bunpou`)

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
    // B6 fix: inline confirm — tidak pakai window.confirm() yang memblok UI
    const key = `${type}-${idx}`
    if (confirmDeleteKey?.key !== key) {
      setConfirmDeleteKey({ key, type, idx })
      return
    }
    setConfirmDeleteKey(null)
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

  // Tab label for add form
  const tabLabel = tab === 'kotoba' ? 'Kotoba' : tab === 'kanji' ? 'Kanji' : 'Bunpou'

  return {
    activeMode, modeInfo, hasKanji, hasBunpou, t, targets,
    tab, setTab, checked, custom,
    showSettings, setShowSettings, showForm, setShowForm,
    showHeatmap, setShowHeatmap, detailItem, setDetailItem,
    showExam, setShowExam, confirmDeleteKey,
    kotobaCheckedCount, kanjiCheckedCount, bunpouCheckedCount,
    kotobaDone, kanjiDone, bunpouDone, allDone,
    history, streak, showReminder, reminderParts,
    itemsMap, totalMap, items, checkedMap, tabLabel,
    toggle, addCustom, removeCustom, saveTargets,
  }
}