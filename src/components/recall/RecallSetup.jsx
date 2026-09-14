import { ArrowLeft, History, CalendarClock, Check } from 'lucide-react'
import { friendlyDate } from '../../lib/ujian-harian'

export default function RecallSetup({
  days,
  itemsByDate,
  globalPool,
  duePool,
  stats,
  cats,
  setCats,
  selectedDates,
  setSelectedDates,
  onStart,
  CATS,
  ALL_CATS,
  MAX_Q,
  onBack,
  pool,
}) {
  const canStartDates = pool.length >= 4
  const dueCount = duePool.length

  const toggleDate = (d) =>
    setSelectedDates((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const selectRecent = (n) => setSelectedDates(days.slice(0, n).map((d) => d.date))

  const toggleCat = (k) =>
    setCats((prev) => {
      if (prev.includes(k)) return prev.length > 1 ? prev.filter((x) => x !== k) : prev
      return ALL_CATS.filter((c) => prev.includes(c) || c === k)
    })

  return (
    <div className="recall-root">
      <button className="ujian-setup-back" onClick={onBack} title="Kembali">
        <ArrowLeft size={18} />
      </button>

      <div className="ujian-setup-header">
        <History size={22} className="ujian-setup-icon" />
        <h2>Recall</h2>
        <p>Ulangi materi dari tanggal lampau</p>
      </div>

      {/* Item yang belum hafal & sudah jatuh tempo (dijadwalkan ulang otomatis). */}
      {stats.due > 0 ? (
        <div className="ujian-section">
          <label className="ujian-section-label">Perlu Diulang Hari Ini</label>
          <div className="recall-due-card">
            <div className="recall-due-head">
              <CalendarClock size={16} />
              <span>
                <b>{stats.due}</b> item belum hafal dari sesi sebelumnya
              </span>
            </div>
            <div className="recall-due-cats">
              {CATS.map((c) =>
                stats.byCat[c.key] ? (
                  <span key={c.key} className="recall-due-tag">
                    {c.label} · {stats.byCat[c.key]}
                  </span>
                ) : null,
              )}
            </div>
            <button
              className="primary-btn recall-due-btn"
              disabled={!dueCount}
              onClick={() => onStart(duePool)}
            >
              Ulangi Sekarang{dueCount ? ` (${dueCount})` : ''}
            </button>
          </div>
        </div>
      ) : null}

      <div className="ujian-section">
        <label className="ujian-section-label">Pilih Tanggal</label>

        {days.length ? (
          <>
            <div className="recall-quick">
              <button className="ujian-chip" onClick={() => selectRecent(3)}>3 hari terakhir</button>
              <button className="ujian-chip" onClick={() => selectRecent(7)}>7 hari terakhir</button>
              <button className="ujian-chip" onClick={() => setSelectedDates(days.map((d) => d.date))}>
                Semua
              </button>
              <button className="ujian-chip" onClick={() => setSelectedDates([])}>Kosongkan</button>
            </div>

            <div className="ujian-date-pick">
              {days.map((d) => (
                <button
                  key={d.date}
                  className={`ujian-date-chip ${selectedDates.includes(d.date) ? 'active' : ''}`}
                  onClick={() => toggleDate(d.date)}
                >
                  <span>{d.date === days[0]?.date ? 'Hari Ini' : friendlyDate(d.date)}</span>
                  <span className="ujian-date-count">{d.count}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="ujian-no-dates">
            Belum ada riwayat belajar. Centang materi di Hafalan Harian dulu.
          </p>
        )}
      </div>

      <div className="ujian-section">
        <label className="ujian-section-label">
          Kategori <span className="recall-hint">(boleh pilih lebih dari satu)</span>
        </label>
        <div className="ujian-chips">
          {CATS.map((c) => (
            <button
              key={c.key}
              className={`ujian-chip ${cats.includes(c.key) ? 'active' : ''}`}
              onClick={() => toggleCat(c.key)}
            >
              {cats.includes(c.key) ? <Check size={13} className="recall-check" /> : null}
              {c.label}
            </button>
          ))}
          <button
            className={`ujian-chip ${cats.length === CATS.length ? 'active' : ''}`}
            onClick={() => setCats(ALL_CATS)}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="ujian-start-row">
        <p className="ujian-pool-info">
          {selectedDates.length === 0 ? (
            stats.due > 0
              ? 'Punya item yang perlu diulang — tekan "Ulangi Sekarang" di atas, atau pilih tanggal.'
              : 'Pilih minimal satu tanggal di atas.'
          ) : canStartDates ? (
            <>
              Materi terkumpul: <span className="kin-count">{pool.length}</span> item dari{' '}
              {selectedDates.length} tanggal (maks {MAX_Q} soal).
            </>
          ) : (
            'Materi kurang dari 4 item. Pilih tanggal lain atau tambah kategori.'
          )}
        </p>
        <button className="primary-btn" disabled={!canStartDates} onClick={() => onStart(pool)}>
          Mulai Recall
        </button>
      </div>

      {stats.pending > 0 ? (
        <p className="recall-pending-note">
          Terjadwal ulang: {stats.pending} item ({stats.total - stats.due} belum jatuh tempo).
        </p>
      ) : null}
    </div>
  )
}
