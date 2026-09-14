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
import { MODES, materialOf } from './data/materials'
import { QUOTES } from './data/quotes'
import Topbar from './components/Topbar'
import { MaterialBar, ModeBar } from './components/Bars'
import BottomNav from './components/BottomNav'
import LevelStrip from './components/LevelStrip'
import LoginGate from './components/LoginGate'
import Controls from './components/Controls'
import Kartu from './components/Kartu'
import Kuis from './components/Kuis'
import Sprint from './components/Sprint'
import Ujian from './components/Ujian'
import DaftarHafal from './components/DaftarHafal'
import Referensi from './components/Referensi'
import Kemampuan from './components/Kemampuan'
import KotobaLevel from './components/KotobaLevel'
import HafalanHarian from './components/HafalanHarian'
import DaftarMateri from './components/DaftarMateri'
import UjianBaru from './components/UjianBaru'
import Recall from './components/Recall'
import Profil from './components/Profil'
import { recordStudy, getHistory, computeStreak } from './lib/history'
import { addExamRecord } from './lib/exam-history'
import { recallStats } from './lib/recall-queue'
import { kanjiFontOf } from './lib/fonts'
import { useAuth } from './hooks/useAuth'
import { syncToCloud, loadFromCloud, mergeProgress, saveUserProfile, saveExamResult } from './lib/cloud-sync'

const LEVEL_KEY = 'ankichou-level'
function getSavedLevel() {
  try { return localStorage.getItem(LEVEL_KEY) } catch { return null }
}
function saveLevel(lv) {
  try { localStorage.setItem(LEVEL_KEY, lv) } catch {}
}

function pickQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

export default function App() {
  const { user, loading: authLoading, loginGoogle, logout, loginError } = useAuth()
  const [level, setLevelState] = useState(() => getSavedLevel() || 'a2')
  const [material, setMaterial] = useState('hiragana')
  const [mode, setMode] = useState(MODES[0].key)
  const [progress, setProgress] = useState(() => getProgress())
  const [prefs, setPrefsState] = useState(() => getPrefs())
  const [lessons, setLessons] = useState({})
  const [deckVersion, setDeckVersion] = useState(0)
  const [resetArmed, setResetArmed] = useState(false)
  const [historyTick, setHistoryTick] = useState(0)
  const [quote] = useState(() => pickQuote())
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const [queueTick, setQueueTick] = useState(0)

  const storageOk = useMemo(() => storageAvailable(), [])
  const ttsOk = useMemo(() => ttsSupported(), [])

  // ── Cloud sync: load on login ──
  useEffect(() => {
    if (!user || cloudLoaded) return
    loadFromCloud(user.uid).then((cloud) => {
      if (cloud) {
        const local = getProgress()
        const merged = mergeProgress(local, cloud)
        saveProgress(merged)
        setProgress(merged)
      }
      setCloudLoaded(true)
    })
    saveUserProfile(user)
  }, [user, cloudLoaded])

  // ── Cloud sync: push on progress change ──
  useEffect(() => {
    if (!user || !cloudLoaded) return
    syncToCloud(user.uid, {
      perMaterial: progress.perMaterial,
      prefs: progress.prefs,
      updated: progress.updated,
    })
  }, [progress, user, cloudLoaded])

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', !!prefs.darkMode)
  }, [prefs.darkMode])

  useEffect(() => {
    const f = kanjiFontOf(prefs.font)
    const el = document.documentElement.style
    el.setProperty('--font-jp', f.jp)
    el.setProperty('--font-serif-jp', f.serif)
  }, [prefs.font])

  useEffect(() => {
    setMode(MODES[0].key)
  }, [])

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

  const handleGrade = (id, grade, pre) => {
    storeGrade(material, id, gradeCard(pre, grade))
    recordStudy(material, id, grade, pre)
    setProgress(getProgress())
    setHistoryTick((t) => t + 1)
  }

  const handleGradeN3 = (mat, id, grade, pre) => {
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

  const allEntriesRaw = useMemo(() => byMaterial('hiragana').concat(byMaterial('katakana'), byMaterial('kotoba'), byMaterial('kotoba-n3'), byMaterial('kotoba-n2'), byMaterial('kotoba-n1'), byMaterial('kanji'), byMaterial('bunpo')), [])

  const doReset = () => {
    if (!resetArmed) {
      setResetArmed(true)
      setTimeout(() => setResetArmed(false), 4000)
      return
    }
    resetProgress()
    setProgress(getProgress())
    setLessons({})
    setDeckVersion((v) => v + 1)
    setResetArmed(false)
  }

  const handleBottomNav = (key) => {
    setMode(key)
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
    return (
      <div className="stage">
        <LoginGate onLogin={loginGoogle} error={loginError} />
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
        return <HafalanHarian level={level} onGoMateri={() => setMode('materi')} onGoRecall={() => setMode('recall')} />
      case 'materi':
        return <DaftarMateri level={level} onGoHafalan={() => setMode('harian')} />
      case 'kartu':
        return (
          <Kartu
            entries={entries}
            cards={cards}
            onGrade={handleGrade}
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
            onGrade={handleGrade}
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
            onGrade={handleGrade}
            material={material}
            direction={prefs.direction}
          />
        )
      case 'ujian':
        return <Ujian entries={allEntries} cards={cards} direction={prefs.direction} />
      case 'ujian-baru':
        return (
          <UjianBaru
            level={level}
            onBack={() => setMode('harian')}
            onSaveResult={handleSaveExamResult}
          />
        )
      case 'recall':
        return (
          <Recall
            onBack={() => setMode('harian')}
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
            onGrade={handleGradeN3}
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

  const hideMaterialBar = ['harian', 'materi', 'ujian-baru', 'recall', 'profil', 'kotoba-n3', 'kotoba-n2', 'kotoba-n1'].includes(mode)
  const hideLevelStrip = ['profil', 'referensi', 'ujian-baru', 'recall', 'kotoba-n3', 'kotoba-n2', 'kotoba-n1'].includes(mode)
  const showControls = mode === 'kartu' || mode === 'ulangi' || mode === 'kuis' || mode === 'sprint'

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
      />

      {hideLevelStrip ? null : <LevelStrip active={level} onChange={setLevel} />}

      {(mode === 'harian' || mode === 'kemampuan') ? (
        <div className="motiv-card">
          <p className="motiv-text">{quote}</p>
        </div>
      ) : null}

      {hideMaterialBar ? null : (
        <MaterialBar active={material} onChange={setMaterial} />
      )}

      {mode === 'profil' ? null : (
        <ModeBar active={mode} onChange={setMode} badgeCount={badgeCount} />
      )}

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

      {renderBody()}

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
