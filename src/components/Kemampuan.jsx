import { useMemo, useState } from 'react'
import { computeStats } from '../lib/srs'
import { fmtInterval, fmtDue } from '../lib/ui'
import {
  dueCount, totalStudied, avgEase, totalReviews,
  perMaterialStats, groupStats, weekActivity,
} from '../lib/stats'
import ProgressRing from './ui/ProgressRing'
import StatsBar from './ui/StatsBar'
import StatBox from './ui/StatBox'


export default function Kemampuan({ entries, cards, material, history, streak, allEntries }) {
  const [openMat, setOpenMat] = useState(null)

  const stats = useMemo(() => computeStats(cards), [cards])
  const dueToday = useMemo(() => dueCount(cards), [cards])
  const totalStudiedCount = useMemo(() => totalStudied(cards), [cards])
  const avgEaseVal = useMemo(() => avgEase(cards), [cards])
  const reviewsCount = useMemo(() => totalReviews(history), [history])
  const perMaterial = useMemo(
    () => perMaterialStats(allEntries, cards, material),
    [allEntries, cards, material],
  )
  const groups = useMemo(() => groupStats(entries, cards), [entries, cards])
  const activity = useMemo(() => weekActivity(history), [history])

  const anyActivity = activity.some((a) => a.count > 0)
  const maxCount = Math.max(1, ...activity.map((a) => a.count))

  return (
    <div className="kp-dashboard">
      <header className="kp-dash-header">
        <h1 className="kp-dash-title">Kemampuan</h1>
        <p className="kp-dash-sub">Statistik belajarmu</p>
      </header>

      <div className="kp-stats-row">
        <div className="kp-stat kp-stat-mastery kp-card">
          <div className="kp-stat-main">
            <ProgressRing pct={stats.masteryPct} />
            <div>
              <div className="kp-label">Dikuasai</div>
              <div className="kp-stat-value" title={fmtInterval(21, 1)}>
                {stats.mastered} / {stats.total} kartu
              </div>
            </div>
          </div>
        </div>

        <div className="kp-stat kp-stat-streak kp-card">
          <div className="kp-stat-emoji">🔥</div>
          <div className="kp-stat-hl">{streak.current} hari</div>
          <div className="kp-label">Streak</div>
          <div className="kp-stat-note">
            Terpanjang: {streak.longest}
          </div>
        </div>

        <div className="kp-stat kp-stat-due kp-card">
          <div className="kp-stat-emoji">📚</div>
          <div className="kp-stat-hl">{dueToday} kartu</div>
          <div className="kp-label">Jatuh tempo hari ini</div>
        </div>

        <div className="kp-stat kp-stat-studied kp-card">
          <div className="kp-stat-emoji">📖</div>
          <div className="kp-stat-hl">{totalStudiedCount} kartu</div>
          <div className="kp-label">Total dipelajari</div>
        </div>
      </div>

      <section className="kp-material">
        <h2 className="kp-section-title">Per Materi</h2>
        <div className="kp-card-stack">
          {perMaterial.map((m) => {
            const open = openMat === m.key
            return (
              <div
                key={m.key}
                className="kp-card kp-click"
                onClick={() => setOpenMat(open ? null : m.key)}
              >
                <div className="kp-mat-main">
                  <span className="kp-mat-label">
                    {m.label} <span className="kp-mat-kanji">{m.kanji}</span>
                  </span>
                  <StatsBar pct={m.pct} />
                  <span className="kp-pct">
                    {m.pct}%
                  </span>
                  <span className="kp-soft">
                    {m.started}/{m.total}
                  </span>
                  <span className="kp-soft">{open ? '▴' : '▾'}</span>
                </div>
                {open ? (
                  <div className="kp-mat-detail">
                    <span>✓ {m.mastered} dikuasai</span>
                    <span>📘 {m.learning} belajar</span>
                    <span>🆕 {m.newCards} baru</span>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <section className="kp-groups">
        <h2 className="kp-section-title">Per Kelompok</h2>
        {groups.length ? (
          <div className="kp-card-stack">
            {groups.map((g) => (
              <div key={g.name} className="kp-card">
                <div className="kp-grp-main">
                  <span className="kp-grp-name">{g.name}</span>
                  <StatsBar pct={g.pct} color="var(--moss)" />
                  <span className="kp-pct kp-pct-moss">
                    {g.pct}%
                  </span>
                  <span className="kp-soft">
                    {g.mastered}/{g.total}
                  </span>
                </div>
                <div className="kp-grp-detail">
                  <span>✓ {g.mastered} dikuasai</span>
                  <span>📘 {g.learning} belajar</span>
                  <span>🆕 {g.newCards} baru</span>
                  {g.nextDue != null ? <span>⏰ {fmtDue(g.nextDue)}</span> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="kp-empty">Belum ada kelompok.</p>
        )}
      </section>

      <section className="kp-activity kp-activity-card">
        <h2 className="kp-section-title">Aktivitas 7 Hari</h2>
        {anyActivity ? (
          <div className="kp-act-chart">
            {activity.map((a) => (
              <div
                key={a.key}
                className="kp-act-col"
              >
                <span className="kp-act-val">
                  {a.count || ''}
                </span>
                <div
                  title={`${a.key}: ${a.count} kartu`}
                  className={`kp-act-bar ${a.count ? '' : 'empty'}`}
                  style={{
                    height: a.count ? `${(a.count / maxCount) * 100}%` : 3,
                  }}
                />
                <span className="kp-act-label">{a.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="kp-empty">Belum ada aktivitas</p>
        )}
      </section>

      <section className="kp-srs kp-activity-card">
        <h2 className="kp-section-title">Statistik SRS</h2>
        <div className="kp-srs-grid">
          <StatBox label="Total ulasan" value={reviewsCount} />
          <StatBox label="Ease rata-rata" value={avgEaseVal} />
          <StatBox label="Sedang belajar" value={stats.learning} />
          <StatBox label="Dikuasai" value={stats.mastered} />
          <StatBox label="Kartu baru" value={stats.newCards} />
        </div>
      </section>
    </div>
  )
}