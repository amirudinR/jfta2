// State + efek + aksi layar Hafalan Harian (logika dipisah dari render).
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  HAFALAN_MODES, DEFAULT_TARGETS, REMINDER_HOUR, STORAGE_PREFIX,
  MAX_BACKFILL_DAYS, MAX_FORWARD_DAYS,
  todayStr, addDays, diffDays, getTargets, setTargets, getHistory, historyDates,
  getChecked, setCheckedStorage, getCheckedForDate, setCheckedForDate,
  getCustom, setCustomStorage, lsGet, lsSet,
  flushToHistory, computeStreak, newCustomId,
} from '../lib/hafalan-storage'
import { buildItems, appendCustom, dailySliceForDate } from '../lib/hafalan-items'
import { onSyncApplied } from '../lib/sync-events'

export function useHafalan({ level = 'a2' }) {
  const activeMode = level
  const [tab, _setTab] = useState('kotoba')
  const [targets, setTargetsState] = useState(() => getTargets())
  const [selectedDate, setSelectedDate] = useState(() => todayStr())
  const [checked, setChecked] = useState(() => getCheckedForDate(level, todayStr()))
  const [custom, setCustom] = useState(() => getCustom(level))
  const [showSettings, setShowSettings] = useState(false)
  const [showForm, setShowForm] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [showExam, setShowExam] = useState(false)
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null)
  // Aksi borongan butuh konfirmasi singkat (klik dua kali) sebelum eksekusi.
  const [confirmBulk, setConfirmBulk] = useState(null) // 'mark' | 'clear' | null
  const confirmTimerRef = useRef(null)

  // Bersihkan timer konfirmasi saat unmount.
  useEffect(() => () => { if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current) }, [])

  const setTab = (t) => {
    _setTab(t)
    setConfirmDeleteKey(null) // reset confirm saat ganti tab
    setConfirmBulk(null)      // reset confirm bulk saat ganti tab
  }

  const modeInfo = HAFALAN_MODES.find((m) => m.key === activeMode)
  const hasKanji = modeInfo?.kanjiSrc != null
  const hasBunpou = modeInfo?.bunpouSrc != null
  const t = targets[activeMode] || DEFAULT_TARGETS[activeMode]

  const today = todayStr()
  const isToday = selectedDate === today
  const isPast = selectedDate < today
  const isFuture = selectedDate > today
  // Offset relatif untuk label & limit (besok +1, kemarin -1).
  const relOffset = useMemo(() => {
    const a = new Date(`${today}T00:00:00`)
    const b = new Date(`${selectedDate}T00:00:00`)
    return Math.round((b - a) / 86400000)
  }, [today, selectedDate])

  // Level berubah (dari LevelStrip global) → muat ulang data mode.
  useEffect(() => {
    setSelectedDate(todayStr())
    setChecked(getCheckedForDate(activeMode, todayStr()))
    setCustom(getCustom(activeMode))
    _setTab('kotoba')
    setDetailItem(null)
    setShowForm(null)
  }, [activeMode])

  // Tanggal terpilih berubah → muat centang tanggal itu.
  useEffect(() => {
    setChecked(getCheckedForDate(activeMode, selectedDate))
    setDetailItem(null)
  }, [selectedDate, activeMode])

  // Data datang dari cloud (perangkat lain) → baca ulang dari localStorage.
  useEffect(() => {
    return onSyncApplied(() => {
      setChecked(getCheckedForDate(activeMode, selectedDate))
      setCustom(getCustom(activeMode))
      setTargetsState(getTargets())
    })
  }, [activeMode, selectedDate])

  // Auto-reset at midnight — hanya relevan saat melihat hari ini.
  useEffect(() => {
    const check = () => {
      const now = todayStr()
      if (selectedDate !== now) return
      const live = getChecked(activeMode)
      if (live.date !== now) {
        flushToHistory(activeMode, live)
        const fresh = { date: now, kotoba: {}, kanji: {}, bunpou: {} }
        setChecked(fresh)
        setCheckedStorage(activeMode, fresh)
      }
    }
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [selectedDate, activeMode])

  // Build items
  const kotobaAll = useMemo(() => buildItems(modeInfo?.kotobaSrc), [activeMode])
  const kanjiAll = useMemo(() => buildItems(modeInfo?.kanjiSrc), [activeMode])
  const bunpouAll = useMemo(() => buildItems(modeInfo?.bunpouSrc), [activeMode])

  const kotobaWithCustom = useMemo(() => appendCustom(kotobaAll, custom.kotoba), [kotobaAll, custom])
  const kanjiWithCustom = useMemo(() => appendCustom(kanjiAll, custom.kanji), [kanjiAll, custom])
  const bunpouWithCustom = useMemo(() => appendCustom(bunpouAll, custom.bunpou), [bunpouAll, custom])

  // Anchor = hari pertama ada riwayat → rotasi konsisten lintas tanggal.
  // Disimpan (persist) agar TIDAK bergeser saat backfill menambah tanggal lebih
  // awal (yang dulu membuat daftar item hari ini berubah sendiri).
  const anchorDate = useMemo(() => {
    const key = `${STORAGE_PREFIX}-anchor-${activeMode}`
    const saved = lsGet(key, null)
    if (saved) return saved
    const first = historyDates(activeMode)[0] || today
    lsSet(key, first)
    return first
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode])

  const kotobaSlice = useMemo(() => dailySliceForDate(kotobaWithCustom, anchorDate, selectedDate, t.kotoba), [kotobaWithCustom, anchorDate, selectedDate, t.kotoba])
  const kanjiSlice = useMemo(() => dailySliceForDate(kanjiWithCustom, anchorDate, selectedDate, t.kanji), [kanjiWithCustom, anchorDate, selectedDate, t.kanji])
  const bunpouSlice = useMemo(() => dailySliceForDate(bunpouWithCustom, anchorDate, selectedDate, t.bunpou || 0), [bunpouWithCustom, anchorDate, selectedDate, t.bunpou])

  // Checked counts
  const kotobaCheckedCount = Object.values(checked.kotoba || {}).filter(Boolean).length
  const kanjiCheckedCount = Object.values(checked.kanji || {}).filter(Boolean).length
  const bunpouCheckedCount = Object.values(checked.bunpou || {}).filter(Boolean).length

  const kotobaDone = kotobaCheckedCount >= t.kotoba
  const kanjiDone = !t.kanji || kanjiCheckedCount >= t.kanji
  const bunpouDone = !t.bunpou || bunpouCheckedCount >= t.bunpou
  const allDone = kotobaDone && kanjiDone && bunpouDone

  // Progres aktual terhadap target = jumlah item yang dicentang (bisa > target
  // bila mencicil lebih / dari hari lain) — dipakai untuk banner.
  const history = useMemo(() => getHistory(activeMode), [checked, activeMode])
  const streak = useMemo(() => computeStreak(history), [history])

  const hour = new Date().getHours()
  const showReminder = isToday && hour >= REMINDER_HOUR && !allDone

  // Build reminder text
  const reminderParts = [`${kotobaCheckedCount}/${t.kotoba} kotoba`]
  if (hasKanji) reminderParts.push(`${kanjiCheckedCount}/${t.kanji} kanji`)
  if (hasBunpou && t.bunpou > 0) reminderParts.push(`${bunpouCheckedCount}/${t.bunpou} bunpou`)

  // Baris item untuk tab aktif (untuk "Hafal semua").
  const itemsMap = { kotoba: kotobaSlice, kanji: kanjiSlice, bunpou: bunpouSlice }
  const totalMap = { kotoba: kotobaWithCustom, kanji: kanjiWithCustom, bunpou: bunpouWithCustom }
  const currentItems = itemsMap[tab] || []

  // Tulis centang untuk tanggal terpilih (hari ini → live; lainnya → riwayat).
  const persist = (next) => {
    setChecked(next)
    setCheckedForDate(activeMode, next)
  }

  // Actions — pakai functional update agar perubahan cepat berturut-turut
  // (double-tap / bulk) tidak saling menimpa.
  const toggle = (type, id) => {
    setChecked((prev) => {
      const next = { ...prev, [type]: { ...prev[type], [id]: !prev[type]?.[id] } }
      setCheckedForDate(activeMode, next)
      return next
    })
  }

  // Terapkan bulk pada tab aktif. `mode` = 'mark' (tandai semua) | 'clear'.
  const applyBulk = (type, mode) => {
    const list = itemsMap[type] || []
    if (!list.length) { setConfirmBulk(null); return }
    setChecked((prev) => {
      const map = { ...(prev[type] || {}) }
      if (mode === 'mark') for (const it of list) map[it.id] = true
      else for (const it of list) delete map[it.id]
      const next = { ...prev, [type]: map }
      setCheckedForDate(activeMode, next)
      return next
    })
    setConfirmBulk(null)
  }

  // Tandai SEMUA item pada tab aktif untuk tanggal terpilih sebagai hafal.
  // Klik pertama = minta konfirmasi; klik kedua (dalam 4 dtk) = eksekusi.
  const markAll = (type) => {
    if (confirmBulk !== 'mark') {
      setConfirmBulk('mark')
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
      confirmTimerRef.current = setTimeout(() => setConfirmBulk((c) => (c === 'mark' ? null : c)), 4000)
      return
    }
    applyBulk(type, 'mark')
  }

  // Bersihkan centang SEMUA item pada tab aktif untuk tanggal terpilih.
  const uncheckAll = (type) => {
    if (confirmBulk !== 'clear') {
      setConfirmBulk('clear')
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
      confirmTimerRef.current = setTimeout(() => setConfirmBulk((c) => (c === 'clear' ? null : c)), 4000)
      return
    }
    applyBulk(type, 'clear')
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

  // Navigasi hari: pindah ke kemarin (melengkapi) / besok (mencicil).
  // Dibatasi MAX_BACKFILL_DAYS ke belakang & MAX_FORWARD_DAYS ke depan —
  // guard ada di layer logika, bukan cuma UI, agar aturan backfill konsisten.
  const clampDate = (dateStr) => {
    const min = addDays(today, -MAX_BACKFILL_DAYS)
    const max = addDays(today, MAX_FORWARD_DAYS)
    if (dateStr < min) return min
    if (dateStr > max) return max
    return dateStr
  }
  const goToDate = (date) => { if (date) setSelectedDate(clampDate(date)) }
  const shiftDay = (n) => setSelectedDate((d) => clampDate(addDays(d, n)))
  const setDate = (dateStr) => { if (dateStr) setSelectedDate(clampDate(dateStr)) }

  const items = currentItems
  const checkedMap = checked[tab] || {}

  // Tab label for add form
  const tabLabel = tab === 'kotoba' ? 'Kotoba' : tab === 'kanji' ? 'Kanji' : 'Bunpou'

  return {
    activeMode, modeInfo, hasKanji, hasBunpou, t, targets,
    tab, setTab, checked, custom,
    selectedDate, setSelectedDate, setDate, goToDate, shiftDay,
    today, isToday, isPast, isFuture, relOffset,
    maxBackfillDays: MAX_BACKFILL_DAYS, maxForwardDays: MAX_FORWARD_DAYS,
    showSettings, setShowSettings, showForm, setShowForm,
    showHeatmap, setShowHeatmap, detailItem, setDetailItem,
    showExam, setShowExam, confirmDeleteKey, confirmBulk,
    kotobaCheckedCount, kanjiCheckedCount, bunpouCheckedCount,
    kotobaDone, kanjiDone, bunpouDone, allDone,
    history, streak, showReminder, reminderParts,
    itemsMap, totalMap, items, checkedMap, tabLabel,
    toggle, markAll, uncheckAll, addCustom, removeCustom, saveTargets,
  }
}
