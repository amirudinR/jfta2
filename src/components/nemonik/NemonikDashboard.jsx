import { useState } from 'react'
import { BookOpen, RotateCcw, Gamepad2, List, History, Award, AlertTriangle } from 'lucide-react'
import ProgressRing from '../ui/ProgressRing'
import NemonikHeatmap from './NemonikHeatmap'
import { SessionHistory } from './NemonikSessionStats'
import { levelInfo } from '../../lib/nemonik-achievements'

// Bar bertingkat status SRS: Baru · Belajar · Perlu Diulang · Hafal.
function SegmentedBar({ baru, belajar, ulang, hafal, total }) {
  const seg = (n) => (total > 0 ? (n / total) * 100 : 0)
  const parts = [
    { key: 'baru', n: baru, cls: 'seg-baru' },
    { key: 'belajar', n: belajar, cls: 'seg-belajar' },
    { key: 'ulang', n: ulang, cls: 'seg-ulang' },
    { key: 'hafal', n: hafal, cls: 'seg-hafal' },
  ]
  return (
    <div className="nemo-segbar" role="img"
      aria-label={`Baru ${baru}, Belajar ${belajar}, Perlu diulang ${ulang}, Hafal ${hafal}`}>
      {parts.map((p) => (
        p.n > 0 && (
          <span
            key={p.key}
            className={`nemo-segbar-part ${p.cls}`}
            style={{ width: `${seg(p.n)}%` }}
            title={`${p.key}: ${p.n}`}
          />
        )
      ))}
    </div>
  )
}

// Dashboard Nemonik — ringkasan progres + pintu masuk 3 mode.
export default function NemonikDashboard({
  stats, streak, sessions, ach, forgetting,
  onLearn, onReview, onQuiz, onBrowseAll, onAchievements, onReviewForgetting,
}) {
  const [showHistory, setShowHistory] = useState(false)
  // Semua hook dipanggil sebelum guard agar urutan hooks stabil antar render.
  if (!stats) return null
  const { total, baru, belajar, hafal, ulang, reviewCount } = stats
  const pctHafal = total > 0 ? Math.round((hafal / total) * 100) : 0
  const sessionCount = (sessions || []).length
  const lv = ach ? levelInfo(ach.xp) : null
  const forgettingCount = (forgetting || []).length

  return (
    <div className="nemo-dashboard">
      {/* Ring progres + ringkasan utama */}
      <div className="nemo-hero">
        <ProgressRing pct={pctHafal} />
        <div className="nemo-hero-info">
          <div className="nemo-hero-title">Progres Hafal</div>
          <div className="nemo-hero-sub">
            <strong>{hafal}</strong> dari {total} kanji ({pctHafal}%)
          </div>
          <div className="nemo-hero-streak">🔥 Streak {streak} hari</div>
          {lv && (
            <div className="nemo-hero-level">⭐ Level {lv.level} · {ach.xp} XP</div>
          )}
        </div>
      </div>

      {/* Kartu risiko lupa (prediksi SRS) */}
      {forgettingCount > 0 && (
        <button
          type="button"
          className="nemo-forget-card"
          onClick={onReviewForgetting}
        >
          <AlertTriangle size={18} />
          <div className="nemo-forget-body">
            <div className="nemo-forget-title">{forgettingCount} kanji berisiko lupa</div>
            <div className="nemo-forget-sub">Tap untuk review sekarang →</div>
          </div>
        </button>
      )}

      {/* Bar bertingkat status SRS */}
      <div className="nemo-progress">
        <SegmentedBar baru={baru} belajar={belajar} ulang={ulang} hafal={hafal} total={total} />
        <div className="nemo-progress-legend">
          <span><i className="dot seg-baru" /> Baru {baru}</span>
          <span><i className="dot seg-belajar" /> Belajar {belajar}</span>
          <span><i className="dot seg-ulang" /> Perlu Diulang {ulang}</span>
          <span><i className="dot seg-hafal" /> Hafal {hafal}</span>
        </div>
      </div>

      {/* Heatmap aktivitas belajar */}
      <NemonikHeatmap />

      {/* Riwayat sesi (collapsible) */}
      <div className="nemo-history-block">
        <button
          type="button"
          className="nemo-history-toggle"
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
        >
          <History size={15} />
          Riwayat Sesi {sessionCount > 0 && <span className="nemo-history-count">{sessionCount}</span>}
          <span className="nemo-history-caret">{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && <SessionHistory sessions={sessions} limit={10} />}
      </div>

      <div className="nemo-actions">
        <button className="nemo-btn primary" onClick={onLearn}>
          <BookOpen size={16} /> Lanjutkan Belajar
        </button>
        <button className="nemo-btn primary" onClick={onBrowseAll} style={{ backgroundColor: '#6366f1' }}>
          <List size={16} /> Jelajahi Semua ({total})
        </button>
        <button className="nemo-btn warning" onClick={onReview} disabled={reviewCount === 0}>
          <RotateCcw size={16} /> Review Kartu ({reviewCount})
        </button>
        <button className="nemo-btn danger" onClick={onQuiz}>
          <Gamepad2 size={16} /> Mode Kuis
        </button>
        <button className="nemo-btn" onClick={onAchievements}>
          <Award size={16} /> Pencapaian{lv ? ` · Lv ${lv.level}` : ''}
        </button>
      </div>
    </div>
  )
}
