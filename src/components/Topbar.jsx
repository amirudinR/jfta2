export default function Topbar({ stats, darkMode, onToggleDark }) {
  return (
    <header className="topbar">
      <div className="tb-row">
        <div className="hanko">暗記</div>
        <div>
          <div className="brand">
            暗記帳<span className="brand-sub">アンキチョウ</span>
          </div>
          <div className="tagline">Hafalan JFT-Basic A2 · kartu · kuis · ujian</div>
        </div>
        <button
          className="icon-btn no-print"
          onClick={onToggleDark}
          title={darkMode ? 'Mode terang' : 'Mode gelap'}
          aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
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
