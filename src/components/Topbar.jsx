import { Sun, Moon, Monitor, Type, LogIn, Menu } from 'lucide-react'
import { KANJI_FONTS } from '../lib/fonts'

// Urutan siklus tombol tema cepat: sistem → terang → gelap → sistem.
const THEME_CYCLE = { system: 'light', light: 'dark', dark: 'system' }
const THEME_META = {
  system: { label: 'Tema: Ikut Sistem', Icon: Monitor },
  light: { label: 'Tema: Terang', Icon: Sun },
  dark: { label: 'Tema: Gelap', Icon: Moon },
}

export default function Topbar({ stats, themeMode = 'system', onTheme, font, onFont, user, onLogin, onMenuOpen, showStats = true }) {
  const { label, Icon } = THEME_META[themeMode] || THEME_META.system
  const nextLabel = THEME_META[THEME_CYCLE[themeMode]]?.label || ''
  return (
    <header className="topbar">
      <div className="tb-row">
        <div className="hanko">暗記</div>
        <div>
          <div className="brand">
            暗記帳<span className="brand-sub">アンキチョウ</span>
          </div>
          <div className="tagline">Hafalan Bahasa Jepang (A2-N1) · kartu · kuis · ujian</div>
        </div>
        <div className="tb-actions">
          <div className="font-pick">
            <Type size={14} className="font-pick-icon" aria-hidden="true" />
            <select
              className="font-select"
              value={font}
              onChange={(e) => onFont(e.target.value)}
              aria-label="Pilih font kanji"
              title="Font Kanji"
            >
              {KANJI_FONTS.map((f) => (
                <option key={f.key} value={f.key} style={{ fontFamily: f.jp }}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="icon-btn no-print"
            onClick={() => onTheme(THEME_CYCLE[themeMode])}
            title={`${label} — tekan untuk ${nextLabel.replace('Tema: ', '').toLowerCase()}`}
            aria-label={`${label}. Tekan untuk ganti`}
          >
            <Icon size={18} />
          </button>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || ''}
              className="tb-avatar no-print"
              referrerPolicy="no-referrer"
              title={user.displayName || user.email || ''}
            />
          ) : !user ? (
            <button className="tb-login-btn no-print" onClick={onLogin} title="Masuk dengan Google">
              <LogIn size={16} />
              <span>Masuk</span>
            </button>
          ) : null}
          {/* Hamburger — tampil di semua ukuran layar (di mobile ini pintu ke
              Sidebar, satu-satunya cara menjangkau menu spt Nemonik Kanji). */}
          <button
            className="tb-hamburger no-print"
            onClick={onMenuOpen}
            aria-label="Buka menu navigasi"
            title="Menu"
            aria-haspopup="true"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
      {showStats && (
      <div className="stat-chips">
        <div className="stat">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-lbl">Total</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.deck}</span>
          <span className="stat-lbl">Di deck</span>
        </div>
        <div className="stat">
          <span className="stat-num hafal">{stats.hafal}</span>
          <span className="stat-lbl">Hafal</span>
        </div>
      </div>
      )}
    </header>
  )
}
