import { Clock, Target, Zap, TrendingUp } from 'lucide-react'

// Format durasi milidetik → "m s" atau "s".
function fmtDur(ms) {
  const s = Math.round((ms || 0) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}m ${r}s`
}

function fmtDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// Kartu statistik satu sesi terakhir (dipakai di layar selesai).
export function SessionResult({ result }) {
  if (!result) return null
  const { total, lupa, sulit, tahu, dur, accuracy } = result
  return (
    <div className="nemo-session-result">
      <div className="nemo-session-grid">
        <div className="nemo-session-cell">
          <Target size={16} /><div className="nemo-session-num">{accuracy}%</div>
          <div className="nemo-session-lbl">Akurasi</div>
        </div>
        <div className="nemo-session-cell">
          <Clock size={16} /><div className="nemo-session-num">{fmtDur(dur)}</div>
          <div className="nemo-session-lbl">Durasi</div>
        </div>
        <div className="nemo-session-cell">
          <Zap size={16} /><div className="nemo-session-num">{total}</div>
          <div className="nemo-session-lbl">Kartu</div>
        </div>
        <div className="nemo-session-cell">
          <TrendingUp size={16} /><div className="nemo-session-num">{tahu + sulit}</div>
          <div className="nemo-session-lbl">Paham</div>
        </div>
      </div>
      <div className="nemo-session-breakdown">
        <span className="bd lupa">Lupa {lupa}</span>
        <span className="bd sulit">Sulit {sulit}</span>
        <span className="bd tahu">Tahu {tahu}</span>
      </div>
    </div>
  )
}

// Daftar riwayat sesi (terbaru di atas).
export function SessionHistory({ sessions, limit = 10 }) {
  const list = (sessions || []).slice(0, limit)
  if (list.length === 0) {
    return <p className="nemo-history-empty">Belum ada riwayat sesi.</p>
  }
  return (
    <div className="nemo-history">
      {list.map((s) => (
        <div className="nemo-history-row" key={s.ts}>
          <div className="nemo-history-main">
            <span className="nemo-history-acc">{s.accuracy}%</span>
            <span className="nemo-history-meta">{s.total} kartu · {fmtDur(s.dur)}</span>
          </div>
          <span className="nemo-history-date">{fmtDate(s.ts)}</span>
        </div>
      ))}
    </div>
  )
}
