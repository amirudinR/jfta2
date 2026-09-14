import { ArrowLeft, Settings2 } from 'lucide-react'
import { friendlyDate } from '../../lib/ujian-harian'

export default function UjianSetup({
  availCats,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  scope,
  setScope,
  days,
  selectedDates,
  toggleDate,
  pool,
  onStart,
  DIFFICULTIES,
  onBack,
}) {
  const canStart = pool.length >= 4
  return (
    <div className="ujian-setup">
      <button className="ujian-setup-back" onClick={onBack} title="Kembali">
        <ArrowLeft size={18} />
      </button>

      <div className="ujian-setup-header">
        <Settings2 size={22} className="ujian-setup-icon" />
        <h2>Ujian Baru</h2>
        <p>Atur ujianmu sebelum mulai</p>
      </div>

      <div className="ujian-section">
        <label className="ujian-section-label">Kategori Materi</label>
        <div className="ujian-chips">
          {availCats.map((c) => (
            <button
              key={c.key}
              className={`ujian-chip ${category === c.key ? 'active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              <span className="ujian-chip-icon">{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ujian-section">
        <label className="ujian-section-label">Tingkat Kesulitan</label>
        <div className="ujian-diff-grid">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              className={`ujian-diff ${difficulty === d.key ? 'active' : ''}`}
              onClick={() => setDifficulty(d.key)}
            >
              <span className="ujian-diff-icon">{d.icon}</span>
              <span className="ujian-diff-label">{d.label}</span>
              <span className="ujian-diff-desc">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ujian-section">
        <label className="ujian-section-label">Cakupan Materi</label>
        <div className="ujian-chips">
          <button className={`ujian-chip ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>
            Semua materi
          </button>
          <button className={`ujian-chip ${scope === 'today' ? 'active' : ''}`} onClick={() => setScope('today')}>
            Hari ini saja
          </button>
          <button className={`ujian-chip ${scope === 'dates' ? 'active' : ''}`} onClick={() => setScope('dates')}>
            Pilih tanggal
          </button>
        </div>

        {scope === 'dates' && (
          <div className="ujian-date-pick">
            {days.length ? (
              days.map((d) => (
                <button
                  key={d.date}
                  className={`ujian-date-chip ${selectedDates.includes(d.date) ? 'active' : ''}`}
                  onClick={() => toggleDate(d.date)}
                >
                  <span>{d.date === days[0]?.date ? 'Hari Ini' : friendlyDate(d.date)}</span>
                  <span className="ujian-date-count">{d.count}</span>
                </button>
              ))
            ) : (
              <p className="ujian-no-dates">Belum ada riwayat belajar.</p>
            )}
          </div>
        )}
      </div>

      <div className="ujian-start-row">
        <p className="ujian-pool-info">
          {canStart ? (
            <>Soal tersedia: <span className="kin-count">{pool.length}</span> (maks 30 soal per sesi)</>
          ) : (
            'Minimal 4 soal diperlukan. Ubah filter di atas.'
          )}
        </p>
        <button className="primary-btn" disabled={!canStart} onClick={onStart}>
          Mulai Ujian
        </button>
      </div>
    </div>
  )
}
