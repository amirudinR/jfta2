import { BookOpen, RotateCcw, Gamepad2 } from 'lucide-react'

// Dashboard Nemonik — ringkasan progres + pintu masuk 3 mode.
export default function NemonikDashboard({ stats, streak, onLearn, onReview, onQuiz }) {
  if (!stats) return null
  const { total, baru, belajar, hafal, ulang, reviewCount } = stats

  return (
    <div className="nemo-dashboard">
      <div className="nemo-stats">
        <div className="nemo-stat-card">
          <h3>Total Kanji</h3>
          <div className="nemo-stat-num">{total}</div>
        </div>
        <div className="nemo-stat-card nemo-streak">
          <h3>🔥 Streak Belajar</h3>
          <div className="nemo-stat-num">{streak} Hari</div>
        </div>
      </div>

      <div className="nemo-srs-stats">
        <div className="nemo-srs-box box-baru">
          <h4>Baru</h4>
          <div className="nemo-srs-num">{baru}</div>
        </div>
        <div className="nemo-srs-box box-belajar">
          <h4>Belajar</h4>
          <div className="nemo-srs-num">{belajar}</div>
        </div>
        <div className="nemo-srs-box box-ulang">
          <h4>Perlu Diulang</h4>
          <div className="nemo-srs-num">{ulang}</div>
        </div>
        <div className="nemo-srs-box box-hafal">
          <h4>Hafal</h4>
          <div className="nemo-srs-num">{hafal}</div>
        </div>
      </div>

      <div className="nemo-actions">
        <button className="nemo-btn primary" onClick={onLearn}>
          <BookOpen size={16} /> Lanjutkan Belajar
        </button>
        <button className="nemo-btn warning" onClick={onReview} disabled={reviewCount === 0}>
          <RotateCcw size={16} /> Review Kartu ({reviewCount})
        </button>
        <button className="nemo-btn danger" onClick={onQuiz}>
          <Gamepad2 size={16} /> Mode Kuis
        </button>
      </div>
    </div>
  )
}
