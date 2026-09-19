import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  LogOut, User as UserIcon, Flame, Library, CalendarCheck, Sparkles,
  Volume2, Play, Moon, Sun, Monitor, MonitorSmartphone, Languages, Type, RefreshCw,
} from 'lucide-react'
import GoogleIcon from './GoogleIcon'
import NemonikHeatmap from './nemonik/NemonikHeatmap'
import { KANJI_FONTS } from '../lib/fonts'
import {
  HAFALAN_MODES, getHistory, computeStreak, countMastered,
} from '../lib/hafalan-storage'
import { buildItems } from '../lib/hafalan-items'
import { sessionSummary, getSessions } from '../lib/nemonik-sessions'
import { getAchievements, levelInfo, BADGES } from '../lib/nemonik-achievements'
import { useWakeLock, wakeLockSupported } from '../hooks/useWakeLock'
import {
  ttsSupported, listJapaneseVoices, voiceLabel, getVoicePref, setVoicePref,
  refreshVoice, speak, onVoicesReady,
} from '../lib/tts'

const RATE_OPTIONS = [
  { value: 0.7, label: 'Lambat' },
  { value: 0.85, label: 'Pelan' },
  { value: 0.95, label: 'Normal' },
  { value: 1.1, label: 'Cepat' },
  { value: 1.3, label: 'Sangat cepat' },
]

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

// Hitung statistik hafalan yang dikuasai lintas semua level.
function useHafalanStats() {
  return useMemo(() => {
    let total = 0
    let mastered = 0
    let streak = 0
    for (const m of HAFALAN_MODES) {
      const cats = [
        ['kotoba', m.kotobaSrc],
        ['kanji', m.kanjiSrc],
        ['bunpou', m.bunpouSrc],
      ]
      for (const [cat, src] of cats) {
        if (!src) continue
        total += buildItems(src).length
        mastered += countMastered(m.key, cat)
      }
      const s = computeStreak(getHistory(m.key))
      if (s > streak) streak = s
    }
    return { total, mastered, streak }
  }, [])
}

export default function Profil({ user, loading, onLogin, onLogout, prefs = {}, onPrefs = () => {} }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [voices, setVoices] = useState(() => listJapaneseVoices())
  const [voicePref, setVoicePrefState] = useState(() => getVoicePref())

  // Status wake lock (layar tetap nyala) — hook ini terpasang juga di App,
  // di sini hanya untuk menampilkan badge "aktif".
  const wakeLock = useWakeLock(!!prefs.keepAwake)

  // Voices dimuat asinkron oleh browser — refresh saat siap.
  // Fallback: beberapa browser TIDAK memicu `voiceschanged` (race) sehingga
  // kita poll singkat (maks ~3 dtk) sampai daftar berisi / berhenti berubah.
  useEffect(() => {
    const sync = () => setVoices(listJapaneseVoices())
    const unsub = onVoicesReady(sync)
    let tries = 0
    const id = setInterval(() => {
      tries += 1
      sync()
      if (tries >= 6 || listJapaneseVoices().length > 0) clearInterval(id)
    }, 500)
    return () => { unsub(); clearInterval(id) }
  }, [])

  // Tutup modal konfirmasi dengan tombol Escape.
  useEffect(() => {
    if (!confirmOpen) return
    const h = (e) => { if (e.key === 'Escape') setConfirmOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [confirmOpen])

  const stats = useHafalanStats()
  const nemo = useMemo(() => sessionSummary(), [])
  const ach = useMemo(() => getAchievements(), [])
  const level = levelInfo(ach.xp || 0)
  const unlockedIds = ach.unlocked || {}
  const unlockedCount = Object.keys(unlockedIds).length

  const recentAcc = useMemo(() => {
    const list = getSessions().slice(0, 5)
    if (list.length === 0) return 0
    return Math.round(list.reduce((a, s) => a + (s.accuracy || 0), 0) / list.length)
  }, [])

  const applyVoice = (name) => {
    setVoicePref({ voice: name })
    refreshVoice()
    setVoicePrefState(getVoicePref())
    // Preview selalu (termasuk mode Otomatis) memakai suara terpilih.
    speak('こんにちは', { rate: getVoicePref().rate })
  }

  const applyRate = (rate, { preview = true } = {}) => {
    setVoicePref({ rate })
    setVoicePrefState(getVoicePref())
    if (preview) speak('ありがとう', { rate })
  }

  const handleLogout = () => setConfirmOpen(true)
  const doLogout = () => { setConfirmOpen(false); onLogout() }

  if (loading) {
    return (
      <div className="profil-page">
        <h2 className="profil-title">Profil</h2>
        <div className="profil-card"><p className="muted">Memuat...</p></div>
      </div>
    )
  }

  // ── Tamu (belum login) ──
  if (!user) {
    return (
      <div className="profil-page">
        <h2 className="profil-title">Profil</h2>
        <div className="profil-card">
          <div className="profil-guest">
            <UserIcon size={32} className="profil-guest-icon" />
            <p>Login untuk menyimpan progress ke cloud dan sinkron antar perangkat.</p>
          </div>
          <button className="profil-login-btn" onClick={onLogin}>
            <GoogleIcon size={18} />
            <span>Login dengan Google</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Sudah login ──
  const joinDate = user.metadata?.creationTime
  return (
    <div className="profil-page">
      <h2 className="profil-title">Profil</h2>

      {/* Hero identitas */}
      <div className="profil-hero">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="profil-avatar-lg" referrerPolicy="no-referrer" />
        ) : (
          <div className="profil-avatar-lg profil-avatar-placeholder"><UserIcon size={34} /></div>
        )}
        <div className="profil-hero-info">
          <div className="profil-name">{user.displayName || 'User'}</div>
          <div className="profil-email">{user.email}</div>
          <div className="profil-sync-badge">
            <span className="profil-dot" /> Tersinkron ke cloud
          </div>
          {joinDate && <div className="profil-joined">Bergabung {fmtDate(joinDate)}</div>}
        </div>
      </div>

      {/* Level + XP */}
      <div className="profil-section-title"><Sparkles size={15} /> Pencapaian</div>
      <div className="profil-level-card">
        <div className="profil-level-head">
          <span className="profil-level-badge">Lv {level.level}</span>
          <span className="profil-level-xp">{ach.xp || 0} XP</span>
        </div>
        <div className="profil-xp-bar">
          <div className="profil-xp-fill" style={{ width: `${level.pct}%` }} />
        </div>
        <div className="profil-level-note">
          {level.intoLevel}/{level.needed} XP menuju Level {level.level + 1}
          <span className="profil-badge-count">{unlockedCount}/{BADGES.length} badge</span>
        </div>
      </div>

      {/* Grid statistik */}
      <div className="profil-stats">
        <div className="profil-stat">
          <Flame size={18} className="profil-stat-icon flame" />
          <div className="profil-stat-num">{stats.streak}</div>
          <div className="profil-stat-lbl">Streak hari</div>
        </div>
        <div className="profil-stat">
          <Library size={18} className="profil-stat-icon" />
          <div className="profil-stat-num">{stats.mastered}</div>
          <div className="profil-stat-lbl">Dikuasai</div>
        </div>
        <div className="profil-stat">
          <CalendarCheck size={18} className="profil-stat-icon" />
          <div className="profil-stat-num">{nemo.sessions}</div>
          <div className="profil-stat-lbl">Sesi belajar</div>
        </div>
        <div className="profil-stat">
          <Sparkles size={18} className="profil-stat-icon" />
          <div className="profil-stat-num">{recentAcc}%</div>
          <div className="profil-stat-lbl">Akurasi terkini</div>
        </div>
      </div>

      {/* Badge */}
      <div className="profil-section-title"><Sparkles size={15} /> Badge</div>
      {unlockedCount === 0 ? (
        <div className="profil-card profil-empty">
          Belum ada badge terbuka. Selesaikan sesi belajar pertamamu untuk membuka lencana 🌱
        </div>
      ) : (
        <div className="profil-badges">
          {BADGES.map((b) => {
            const on = !!unlockedIds[b.id]
            return (
              <div key={b.id} className={`profil-badge ${on ? 'on' : 'off'}`} title={b.desc}>
                <span className="profil-badge-icon">{b.icon}</span>
                <span className="profil-badge-label">{b.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Heatmap aktivitas */}
      <div className="profil-section-title"><CalendarCheck size={15} /> Aktivitas</div>
      <div className="profil-heatmap-wrap">
        <NemonikHeatmap />
      </div>

      {/* Pengaturan tampilan */}
      <div className="profil-section-title"><Type size={15} /> Pengaturan</div>
      <div className="profil-card profil-settings">
        <div className="profil-setting-block">
          <span className="profil-setting-left">
            <Sun size={17} />
            <span>Tema</span>
          </span>
          <div className="profil-seg" role="radiogroup" aria-label="Pilih tema">
            {[
              { key: 'light', label: 'Terang', Icon: Sun },
              { key: 'dark', label: 'Gelap', Icon: Moon },
              { key: 'system', label: 'Sistem', Icon: Monitor },
            ].map(({ key, label, Icon }) => {
              const active = (prefs.themeMode || (prefs.darkMode ? 'dark' : 'light')) === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`profil-seg-btn ${active ? 'on' : ''}`}
                  onClick={() => onPrefs({ themeMode: key, darkMode: key === 'dark' })}
                >
                  <Icon size={15} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <button className="profil-setting-row" onClick={() => onPrefs({ showRomaji: !prefs.showRomaji })}>
          <span className="profil-setting-left">
            <Languages size={17} />
            <span>Tampilkan Romaji</span>
          </span>
          <span className={`hh-switch ${prefs.showRomaji ? 'on' : ''}`} aria-hidden>
            <span className="hh-switch-knob" />
          </span>
        </button>

        <button
          className="profil-setting-row"
          onClick={() => onPrefs({ keepAwake: !prefs.keepAwake })}
          aria-pressed={!!prefs.keepAwake}
          title={wakeLockSupported() ? undefined : 'Browser ini tidak mendukung fitur ini'}
        >
          <span className="profil-setting-left">
            <MonitorSmartphone size={17} />
            <span>
              Layar tetap nyala
              {prefs.keepAwake && wakeLock.supported && wakeLock.active && (
                <em className="profil-awake-live">aktif</em>
              )}
            </span>
          </span>
          <span className={`hh-switch ${prefs.keepAwake ? 'on' : ''}`} aria-hidden>
            <span className="hh-switch-knob" />
          </span>
        </button>
        <p className="muted profil-voice-note profil-awake-note">
          Saat aktif, layar tidak otomatis mati selama aplikasi terbuka — cocok untuk sesi hafalan panjang.
          {!wakeLockSupported() && ' (Tidak didukung browser ini.)'}
        </p>

        <div className="profil-setting-row fixed col">
          <span className="profil-setting-left"><Type size={17} /><span>Gaya huruf Kanji</span></span>
          <div className="profil-font-pick">
            {KANJI_FONTS.map((f) => (
              <button
                key={f.key}
                className={`profil-font-btn ${prefs.font === f.key ? 'on' : ''}`}
                onClick={() => onPrefs({ font: f.key })}
                title={f.desc}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pengaturan suara */}
      <div className="profil-section-title"><Volume2 size={15} /> Suara</div>
      <div className="profil-card profil-settings">
        {!ttsSupported() ? (
          <p className="muted profil-voice-note">Browser ini tidak mendukung suara (TTS).</p>
        ) : voices.length === 0 ? (
          <p className="muted profil-voice-note">
            Tidak ada suara Jepang di perangkat ini. Pasang paket suara Jepang lewat pengaturan sistem:
            {' '}<b>Android</b> → Pengaturan → Sistem → Bahasa & input → Output teks-ke-ucapan → instal data suara Jepang;
            {' '}<b>Windows</b> → Pengaturan → Waktu & Bahasa → Bicara → tambah bahasa Jepang;
            {' '}<b>iPhone</b> → Pengaturan → Aksesibilitas → Konten Terbaca → Suara → Jepang. Lalu tekan muat ulang ↻.
          </p>
        ) : (
          <>
            <div className="profil-setting-row fixed col">
              <div className="profil-voice-head">
                <span className="profil-setting-left">
                  <Volume2 size={17} />
                  <span>Pilih suara</span>
                  <em className="profil-voice-count">{voices.length} tersedia</em>
                </span>
                <button
                  type="button"
                  className="profil-voice-refresh"
                  onClick={() => setVoices(listJapaneseVoices())}
                  title="Muat ulang daftar suara"
                  aria-label="Muat ulang daftar suara"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <div className="profil-voice-pick">
                <button
                  className={`profil-voice-opt ${!voicePref.voice ? 'on' : ''}`}
                  onClick={() => applyVoice('')}
                >
                  <span className="profil-voice-name">Otomatis</span>
                  <span className="profil-voice-lang">pilih terbaik</span>
                </button>
                {voices.map((v) => (
                  <button
                    key={v.voiceURI || `${v.name}-${v.lang}`}
                    className={`profil-voice-opt ${voicePref.voice === v.name ? 'on' : ''}`}
                    onClick={() => applyVoice(v.name)}
                  >
                    <span className="profil-voice-name">{voiceLabel(v)}</span>
                    <span className="profil-voice-lang">{v.lang}</span>
                    {voicePref.voice === v.name && <Play size={13} className="profil-voice-play" />}
                  </button>
                ))}
              </div>
              {voices.length === 1 && (
                <p className="muted profil-voice-hint">
                  Hanya 1 suara Jepang terdeteksi. Tambah suara lain dari pengaturan sistem perangkat,
                  lalu tekan ↻ untuk memuat ulang.
                </p>
              )}
            </div>

            <div className="profil-setting-row fixed col">
              <span className="profil-setting-left">
                <Type size={17} /><span>Kecepatan</span>
                <span className="profil-rate-value">×{voicePref.rate.toFixed(2)}</span>
              </span>
              <input
                type="range"
                className="profil-rate-slider"
                min="0.5" max="1.5" step="0.05"
                value={voicePref.rate}
                aria-label="Kecepatan suara"
                onChange={(e) => applyRate(parseFloat(e.target.value), { preview: false })}
                onMouseUp={(e) => speak('ありがとう', { rate: parseFloat(e.target.value) })}
                onTouchEnd={(e) => speak('ありがとう', { rate: parseFloat(e.target.value) })}
              />
              <div className="profil-rate-pick">
                {RATE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    className={`profil-rate-btn ${Math.abs(voicePref.rate - r.value) < 0.01 ? 'on' : ''}`}
                    onClick={() => applyRate(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Keluar */}
      <button className="profil-logout-btn" onClick={handleLogout}>
        <LogOut size={16} />
        <span>Keluar</span>
      </button>

      {/* Modal konfirmasi keluar (di-portal ke body agar `position: fixed`
          tak ter-pin ke ancestor ber-transform, mis. .page-transition). */}
      {confirmOpen && createPortal(
        <div className="profil-modal" onClick={() => setConfirmOpen(false)}>
          <div className="profil-modal-sheet" role="dialog" aria-modal="true" aria-label="Konfirmasi keluar" onClick={(e) => e.stopPropagation()}>
            <div className="profil-modal-title">Keluar dari akun?</div>
            <p className="profil-modal-desc">
              Progress-mu tetap aman di cloud dan akan tersinkron saat login kembali.
            </p>
            <div className="profil-modal-actions">
              <button className="profil-modal-cancel" onClick={() => setConfirmOpen(false)}>Batal</button>
              <button className="profil-modal-confirm" onClick={doLogout}>Keluar</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
