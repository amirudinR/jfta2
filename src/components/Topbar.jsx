import { Sun, Moon, Type } from 'lucide-react'
import { KANJI_FONTS } from '../lib/fonts'

export default function Topbar({ stats, darkMode, onToggleDark, font, onFont, level, levelLabel, onChangeLevel, user }) {
  return (
    <header className="topbar">
      <div className="tb-row">
        <div className="hanko">暗記</div>
        <div>
          <div className="brand">
            暗記帳<span className="brand-sub">アンキチョウ</span>
          </div>
          <div className="tagline">Hafalan Bahasa Jepang (A2–N1) · kartu · kuis · ujian</div>
        </div>
        <div className="tb-actions">
          {level && levelLabel ? (
            <button
              className="level-badge no-print"
              onClick={onChangeLevel}
              title="Ganti level"
            >
              {levelLabel}
            </button>
          ) : null}
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
            onClick={onToggleDark}
            title={darkMode ? 'Mode terang' : 'Mode gelap'}
            aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || ''}
              className="tb-avatar no-print"
              referrerPolicy="no-referrer"
              title={user.displayName || user.email || ''}
            />
          ) : null}
        </div>
      </div>
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
    </header>
  )
}
