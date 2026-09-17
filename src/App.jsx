import { useEffect, useMemo, useState } from 'react'
import { byMaterial, groupListOf } from './data'
import { gradeCard, computeStats, isDue, isMastered } from './lib/srs'
import {
  getProgress,
  getPrefs,
  savePrefs,
  storeGrade,
  setCard,
  clearCard,
  resetProgress,
  storageAvailable,
  saveProgress,
} from './lib/storage'
import { ttsSupported } from './lib/tts'
import { materialOf } from './data/materials'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import { MaterialBar, ModeBar } from './components/Bars'
import BottomNav from './components/BottomNav'
import LevelStrip from './components/LevelStrip'
import LoginGate from './components/LoginGate'
import Controls from './components/Controls'
import Kartu from './components/Kartu'
import Kuis from './components/Kuis'
import Sprint from './components/Sprint'
import DaftarHafal from './components/DaftarHafal'
import Referensi from './components/Referensi'
import Kemampuan from './components/Kemampuan'
import KotobaLevel from './components/KotobaLevel'
import HafalanHarian from './components/HafalanHarian'
import DaftarMateri from './components/DaftarMateri'
import UjianBaru from './components/UjianBaru'
import Recall from './components/Recall'
import Profil from './components/Profil'
import Nemonik from './components/nemonik/Nemonik'
import { recordStudy, getHistory, computeStreak } from './lib/history'
import { addExamRecord } from './lib/exam-history'
import { recallStats } from './lib/recall-queue'
import { resetDailyProgress } from './lib/hafalan-storage'
import { useAuth } from './hooks/useAuth'
import { useLiveSync } from './hooks/useLiveSync'
import { useAppSettings } from './hooks/useAppSettings'
import { saveExamResult } from './lib/cloud-sync'
import {
  getSavedLevel, saveLevel, pickQuote,
  LATIHAN_TAB_MODES, PERMATERI_MODES,
  HIDE_LEVEL_STRIP_MODES, CONTROL_MODES,
} from './lib/nav'

// Level → mode halaman standalone KotobaLevel (khusus melatih kotoba per level).
const KOTOBA_MODE_OF = { n3: 'kotoba-n3', n2: 'kotoba-n2', n1: 'kotoba-n1' }

export default function App() {
  const { user, loading: authLoading, loginGoogle, logout, loginError } = useAuth()
  const [level, setLevelState] = useState(() => getSavedLevel() || 'a2')
  const [material, setMaterial] = useState('hiragana')
  const [mode, setMode] = useState('harian')
  const [progress, setProgress] = useState(() => getProgress())
  const [prefs, setPrefsState] = useState(() => getPrefs())
  const [lessons, setLessons] = useState({})
  const [deckVersion, setDeckVersion] = useState(0)
  const [resetArmed, setResetArmed] = useState(false)
  const [historyTick, setHistoryTick] = useState(0)
  const [quote] = useState(() => pickQuote())
  const [queueTick, setQueueTick] = useState(0)
  const [loginBusy, setLoginBusy] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Scroll memory per halaman ──
  // Setiap ganti mode, posisi scroll halaman lama disimpan (sessionStorage,
  // survive remount & reload), lalu posisi halaman baru dipulihkan.
  const pageKey = (m, lv) => (m === 'harian' ? `${m}:${lv}` : m)
  const readScroll = (k) => {
    try { return Number(sessionStorage.getItem(`hh:scroll:${k}`)) || 0 } catch { return 0 }
  }
  const changeMode = (key) => {
    if (key === mode) return
    try { sessionStorage.setItem(`hh:scroll:${pageKey(mode, level)}`, String(window.scrollY)) } catch {}
    setMode(key)
  }
  useEffect(() => {
    const k = pageKey(mode, level)
    const saved = readScroll(k)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved)))
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, level])

  const storageOk = useMemo(() => storageAvailable(), [])
  const ttsOk = useMemo(() => ttsSupported(), [])

  // Hooks modular — live cloud sync & app settings
  // Setelah merge cloud → lokal, segarkan state yang berasal dari localStorage.
  const handleCloudApplied = () => {
    setProgress(getProgress())
    setPrefsState(getPrefs())
    setHistoryTick((t) => t + 1)
    setQueueTick((t) => t + 1)
  }
  useLiveSync(user, handleCloudApplied)
  useAppSettings(prefs)

  const setPrefs = (partial) => {
    const next = { ...prefs, ...partial }
    setPrefsState(next)
    savePrefs(partial)
  }

  const setLevel = (lv) => {
    setLevelState(lv)
    saveLevel(lv)
  }

  const cards = progress.perMaterial[material] || {}
  const allEntries = useMemo(() => byMaterial(material), [material])
  const selectedLessons = lessons[material] ?? null
  const entries = useMemo(() => {
    if (!selectedLessons) return allEntries
    const set = new Set(selectedLessons)
    return allEntries.filter((e) => set.has(e.groupLabel || ''))
  }, [allEntries, selectedLessons])
  const groups = useMemo(() => groupListOf(allEntries), [allEntries])

  // B4 fix: satu fungsi grade untuk semua materi (termasuk kotoba-n3/n2/n1)
  const handleGrade = (mat, id, grade, pre) => {
    storeGrade(mat, id, gradeCard(pre, grade))
    recordStudy(mat, id, grade, pre)
    setProgress(getProgress())
    setHistoryTick((t) => t + 1)
  }

  const handleToggleMastered = (id, card) => {
    if (card) setCard(material, id, card)
    else clearCard(material, id)
    setProgress(getProgress())
  }

  const handleApplyLessons = (selection) => {
    setLessons((l) => ({ ...l, [material]: selection }))
    setDeckVersion((v) => v + 1)
  }

  // Simpan hasil ujian: lokal + cloud (kalau login).
  const handleSaveExamResult = (result) => {
    addExamRecord(result)
    if (user) saveExamResult(user.uid, result)
  }

  const info = materialOf(material)
  const stats = useMemo(() => {
    const s = computeStats(cards)
    return { total: allEntries.length, deck: entries.length, hafal: s.mastered }
  }, [cards, allEntries, entries])

  const badgeCount = useMemo(() => {
    const list = Object.entries(cards)
    const ulangi = list.filter(([, c]) => c && !isMastered(c) && isDue(c)).length
    const hafal = list.filter(([, c]) => isMastered(c)).length
    return { ulangi, hafal }
  }, [cards])

  const history = useMemo(() => getHistory(), [historyTick, material])
  const streak = useMemo(() => computeStreak(history), [history, historyTick])

  const recallDue = useMemo(() => recallStats().due, [queueTick, mode])

  const allEntriesRaw = useMemo(() => byMaterial('hiragana').concat(
    byMaterial('katakana'),
    byMaterial('kotoba'), byMaterial('kotoba-n3'), byMaterial('kotoba-n2'), byMaterial('kotoba-n1'),
    byMaterial('kanji'), byMaterial('kanji-n3'), byMaterial('kanji-n2'), byMaterial('kanji-n1'),
    byMaterial('bunpo'), byMaterial('bunpo-n3'), byMaterial('bunpo-n2'), byMaterial('bunpo-n1'),
  ), [])

  const doReset = () => {
    if (!resetArmed) {
      setResetArmed(true)
      setTimeout(() => setResetArmed(false), 4000)
      return
    }
    resetProgress()
    resetDailyProgress()
    setProgress(getProgress())
    setPrefsState(getPrefs())
    setLessons({})
    setDeckVersion((v) => v + 1)
    setHistoryTick((t) => t + 1)
    setQueueTick((t) => t + 1)
    setResetArmed(false)
    changeMode('harian') // kembali ke Hafalan Harian → hari baru (checked kosong)
  }

  const handleBottomNav = (key) => {
    changeMode(key)
  }

  // ══════════════════════════════════════════════════════════
  // Auth gate — wajib login sebelum masuk aplikasi.
  // ══════════════════════════════════════════════════════════
  if (authLoading) {
    return (
      <div className="stage">
        <div className="app-splash">
          <div className="login-hanko">暗記</div>
          <p className="muted">Memuat…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    const handleLogin = async () => {
      if (loginBusy) return
      setLoginBusy(true)
      try {
        await loginGoogle()
      } finally {
        setLoginBusy(false)
      }
    }
    return (
      <div className="stage">
        <LoginGate onLogin={handleLogin} loading={loginBusy} error={loginError} />
      </div>
    )
  }

  const renderBody = () => {
    switch (mode) {
      case 'profil':
        return (
          <Profil
            user={user}
            loading={authLoading}
            onLogin={loginGoogle}
            onLogout={logout}
          />
        )
      case 'harian':
        return <HafalanHarian level={level} onGoMateri={() => changeMode('materi')} onGoRecall={() => changeMode('recall')} />
      case 'materi':
        return <DaftarMateri level={level} onGoHafalan={() => changeMode('harian')} onGoKotobaLevel={() => openKotobaLevel(level)} onGoNemonik={() => changeMode('nemonik')} />
      case 'kartu':
        return (
          <Kartu
            entries={entries}
            cards={cards}
            onGrade={(id, grade, pre) => handleGrade(material, id, grade, pre)}
            onReshuffle={() => setDeckVersion((v) => v + 1)}
            material={material}
            direction={prefs.direction}
            showRomaji={prefs.showRomaji}
            onToggleRomaji={() => setPrefs({ showRomaji: !prefs.showRomaji })}
            deckKey={deckVersion}
          />
        )
      case 'ulangi':
        return (
          <Kartu
            entries={entries}
            cards={cards}
            onGrade={(id, grade, pre) => handleGrade(material, id, grade, pre)}
            onReshuffle={() => setDeckVersion((v) => v + 1)}
            material={material}
            direction={prefs.direction}
            showRomaji={prefs.showRomaji}
            deckKey={deckVersion + 1000}
            onlyLearning
          />
        )
      case 'kuis':
        return (
          <Kuis entries={entries} material={material} direction={prefs.direction} />
        )
      case 'sprint':
        return (
          <Sprint
            entries={entries}
            cards={cards}
            onGrade={(id, grade, pre) => handleGrade(material, id, grade, pre)}
            material={material}
            direction={prefs.direction}
          />
        )
      case 'ujian-baru':
        return (
          <UjianBaru
            level={level}
            onBack={() => changeMode('harian')}
            onSaveResult={handleSaveExamResult}
          />
        )
      case 'recall':
        return (
          <Recall
            onBack={() => changeMode('harian')}
            onSaveResult={handleSaveExamResult}
            onQueueChange={() => setQueueTick((t) => t + 1)}
          />
        )
      case 'daftar':
        return <DaftarHafal entries={allEntries} cards={cards} />
      case 'kemampuan':
        return (
          <Kemampuan
            entries={entries}
            cards={cards}
            material={material}
            history={history}
            streak={streak}
            allEntries={allEntriesRaw}
          />
        )
      case 'nemonik':
        // Halaman standalone Nemonik Kanji (port dari app mandiri).
        // Tombol back kembali ke Daftar Materi tempat pintu masuknya.
        return <Nemonik onBack={() => changeMode('materi')} />
      case 'kotoba-n3':
      case 'kotoba-n2':
      case 'kotoba-n1':
        return (
          <KotobaLevel
            material={mode}
            label={mode === 'kotoba-n2' ? 'Kotoba N2' : mode === 'kotoba-n1' ? 'Kotoba N1' : 'Kotoba N3'}
            hankoText={mode.replace('kotoba-n', '').toUpperCase()}
            cards={progress.perMaterial[mode] || {}}
            prefs={prefs}
            onToggleRomaji={() => setPrefs({ showRomaji: !prefs.showRomaji })}
            onGrade={handleGrade}
            onBack={() => changeMode('harian')}
          />
        )
      case 'referensi':
        return (
          <Referensi
            entries={allEntries}
            cards={cards}
            isKana={info?.kind === 'kana'}
            onToggleMastered={handleToggleMastered}
          />
        )
      default:
        return null
    }
  }

  // Semua mode yang hidup di bawah tab "Latihan" di BottomNav
  const isLatihanTab = LATIHAN_TAB_MODES.includes(mode)

  // MaterialBar hanya untuk mode latihan per-materi (bukan tools)
  const hideMaterialBar = !PERMATERI_MODES.includes(mode)
  const hideLevelStrip = HIDE_LEVEL_STRIP_MODES.includes(mode)
  const showModeBar = isLatihanTab
  const showControls = CONTROL_MODES.includes(mode)

  // LevelStrip: HANYA mengubah level aktif (Hafalan Harian/Ujian/Materi/Recall).
  // TIDAK mengubah mode/halaman — dua konsep ini sengaja dipisah. Dulu ganti
  // level ke N3/N2/N1 ikut pindah ke halaman standalone KotobaLevel (mode
  // 'kotoba-n*') sehingga LevelStrip ikut hilang dan user terjebak. Sekarang
  // tetap di halaman yang sama, hanya datanya berganti sesuai level baru.
  const handleLevelChange = (lv) => {
    setLevel(lv)
  }

  // Buka halaman standalone Kotoba-level (Kartu/Kuis/Ulangi/Daftar) — dipanggil
  // HANYA saat user sengaja memilih, mis. dari tab Latihan/Materi, bukan efek
  // samping ganti level. Selalu dikaitkan dengan level aktif saat itu.
  const openKotobaLevel = (lv = level) => changeMode(KOTOBA_MODE_OF[lv] || 'kotoba-n3')

  return (
    <div className="stage">
      <Topbar
        stats={stats}
        darkMode={prefs.darkMode}
        onToggleDark={() => setPrefs({ darkMode: !prefs.darkMode })}
        font={prefs.font}
        onFont={(font) => setPrefs({ font })}
        user={user}
        onLogin={loginGoogle}
        onMenuOpen={() => setSidebarOpen(true)}
        showStats={!hideMaterialBar}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        active={mode}
        onChange={(key) => { changeMode(key); setSidebarOpen(false) }}
        user={user}
        recallDue={recallDue}
      />

      {hideLevelStrip ? null : <LevelStrip active={level} onChange={handleLevelChange} />}

      {(mode === 'harian' || mode === 'kemampuan') ? (
        <div className="motiv-card">
          <p className="motiv-text">{quote}</p>
        </div>
      ) : null}

      {hideMaterialBar ? null : (
        <MaterialBar active={material} onChange={setMaterial} />
      )}

      {showModeBar ? (
        <ModeBar active={mode} onChange={changeMode} badgeCount={badgeCount} />
      ) : null}

      {showControls ? (
        <Controls
          material={material}
          groups={groups}
          committed={selectedLessons}
          direction={prefs.direction}
          onDirection={(d) => setPrefs({ direction: d })}
          showRomaji={prefs.showRomaji}
          onToggleRomaji={() => setPrefs({ showRomaji: !prefs.showRomaji })}
          onApply={handleApplyLessons}
        />
      ) : null}

      {!storageOk ? (
        <div className="banner">
          <span>⚠️</span>
          <span>
            Penyimpanan lokal tidak tersedia — progres tidak akan tersimpan (private mode?).
          </span>
        </div>
      ) : null}

      <div key={mode} className="page-transition">
        {renderBody()}
      </div>

      <footer className="foot">
        <span>
          Progres &amp; preferensi tersimpan otomatis di perangkat ini (localStorage).
          {user ? ` Tersinkron ke akun ${user.email || 'Google'}.` : ''}
          {!ttsOk ? ' TTS tidak didukung browser ini.' : ''}
        </span>
        <span>
          Sumber: kosakata JLPT (A2–N1) &amp; kanji &amp; tata bahasa · 暗記帳 アンキチョウ
        </span>
        <button className={`reset-btn no-print ${resetArmed ? 'armed' : ''}`} onClick={doReset}>
          {resetArmed ? 'Yakin? Klik lagi untuk reset' : 'Reset semua progres'}
        </button>
      </footer>

      <BottomNav active={mode} onChange={handleBottomNav} user={user} recallDue={recallDue} />
    </div>
  )
}
