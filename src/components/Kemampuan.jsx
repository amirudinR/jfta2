import { useMemo, useState } from 'react'
import { isMastered, isDue, computeStats } from '../lib/srs'
import { fmtInterval, fmtDue } from '../lib/ui'
import { MATERIALS } from '../data/materials'

const cardStyle = {
  background: 'var(--card-face)',
  border: '1px solid var(--panel-line)',
  borderRadius: 12,
  padding: 16,
}

const labelStyle = {
  color: 'var(--card-soft)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
}

const sectionTitle = { fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--card-ink)' }

function Ring({ pct }) {
  const r = 26
  const c = 2 * Math.PI * r
  const v = Math.min(Math.max(pct, 0), 100)
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ flex: '0 0 auto' }}>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--panel-line)" strokeWidth="9" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke="var(--kin)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v / 100)}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--card-ink)">
        {Math.round(v)}%
      </text>
    </svg>
  )
}

function bucket(list, cards) {
  let started = 0
  let mastered = 0
  let learning = 0
  let newCards = 0
  const dues = []
  for (const e of list) {
    const c = cards[e.id]
    if (!c) continue
    started++
    dues.push(c.due)
    if (isMastered(c)) mastered++
    else if (c.interval > 0) learning++
    else if (c.reps === 0) newCards++
  }
  return {
    started,
    mastered,
    learning,
    newCards,
    nextDue: dues.length ? Math.min(...dues) : null,
  }
}

function Bar({ pct, color = 'var(--kin)' }) {
  return (
    <div
      style={{
        flex: 1,
        height: 10,
        background: 'var(--card-line)',
        borderRadius: 5,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(Math.max(pct, 0), 100)}%`,
          height: '100%',
          background: color,
          borderRadius: 5,
          transition: 'width .3s',
        }}
      />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ background: 'var(--card-deep)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--card-soft)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function Kemampuan({ entries, cards, material, history, streak, allEntries }) {
  const [openMat, setOpenMat] = useState(null)

  const cardsArr = useMemo(() => Object.values(cards || {}), [cards])
  const stats = useMemo(() => computeStats(cards), [cards])

  const dueToday = useMemo(() => cardsArr.filter((c) => isDue(c)).length, [cardsArr])

  const totalStudied = useMemo(
    () => cardsArr.filter((c) => c && (c.reps > 0 || c.interval > 0)).length,
    [cardsArr],
  )

  const avgEase = useMemo(() => {
    const a = cardsArr.filter((c) => c && c.reps > 0)
    if (!a.length) return 0
    return Math.round((a.reduce((s, c) => s + c.ease, 0) / a.length) * 100) / 100
  }, [cardsArr])

  const totalReviews = useMemo(() => {
    const d = (history && history.days) || {}
    return Object.values(d).reduce((s, day) => s + (day.reviewed || 0), 0)
  }, [history])

  const perMaterial = useMemo(() => {
    const byMat = new Map()
    for (const e of allEntries || []) {
      const m = e.material || material
      if (!byMat.has(m)) byMat.set(m, [])
      byMat.get(m).push(e)
    }
    return MATERIALS.map((m) => {
      const list = byMat.get(m.key) || []
      const b = bucket(list, cards)
      return { ...m, ...b, total: list.length, pct: list.length ? Math.round((b.started / list.length) * 100) : 0 }
    })
  }, [allEntries, cards, material])

  const groups = useMemo(() => {
    const map = new Map()
    for (const e of entries || []) {
      const g = e.groupLabel || 'Umum'
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(e)
    }
    return [...map.entries()].map(([name, list]) => {
      const b = bucket(list, cards)
      return { name, total: list.length, ...b, pct: list.length ? Math.round((b.mastered / list.length) * 100) : 0 }
    })
  }, [entries, cards])

  const activity = useMemo(() => {
    const d = (history && history.days) || {}
    const out = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      const key =
        `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      const rec = d[key]
      out.push({
        key,
        label: dt.toLocaleDateString('id-ID', { weekday: 'short' }),
        count: rec ? rec.studied || 0 : 0,
      })
    }
    return out
  }, [history])

  const anyActivity = activity.some((a) => a.count > 0)
  const maxCount = Math.max(1, ...activity.map((a) => a.count))

  return (
    <div
      className="kp-dashboard"
      style={{ display: 'grid', gap: 18, color: 'var(--card-ink)', padding: '8px 0 32px' }}
    >
      <header style={{ textAlign: 'center', padding: '8px 0 2px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--page-ink)' }}>Kemampuan</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--page-soft)' }}>Statistik belajarmu</p>
      </header>

      <div
        className="kp-stats-row"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}
      >
        <div className="kp-stat kp-stat-mastery" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Ring pct={stats.masteryPct} />
            <div>
              <div style={labelStyle}>Dikuasai</div>
              <div style={{ fontSize: 14, marginTop: 4 }} title={fmtInterval(21, 1)}>
                {stats.mastered} / {stats.total} kartu
              </div>
            </div>
          </div>
        </div>

        <div className="kp-stat kp-stat-streak" style={cardStyle}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{streak.current} hari</div>
          <div style={labelStyle}>Streak</div>
          <div style={{ color: 'var(--card-soft)', fontSize: 12, marginTop: 4 }}>
            Terpanjang: {streak.longest}
          </div>
        </div>

        <div className="kp-stat kp-stat-due" style={cardStyle}>
          <div style={{ fontSize: 32 }}>📚</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{dueToday} kartu</div>
          <div style={labelStyle}>Jatuh tempo hari ini</div>
        </div>

        <div className="kp-stat kp-stat-studied" style={cardStyle}>
          <div style={{ fontSize: 32 }}>📖</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{totalStudied} kartu</div>
          <div style={labelStyle}>Total dipelajari</div>
        </div>
      </div>

      <section className="kp-material">
        <h2 style={sectionTitle}>Per Materi</h2>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {perMaterial.map((m) => {
            const open = openMat === m.key
            return (
              <div
                key={m.key}
                style={{ ...cardStyle, cursor: 'pointer' }}
                onClick={() => setOpenMat(open ? null : m.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ minWidth: 120, fontWeight: 700 }}>
                    {m.label} <span style={{ color: 'var(--card-soft)' }}>{m.kanji}</span>
                  </span>
                  <Bar pct={m.pct} />
                  <span style={{ minWidth: 44, textAlign: 'right', fontWeight: 700, color: 'var(--kin)' }}>
                    {m.pct}%
                  </span>
                  <span style={{ color: 'var(--card-soft)', fontSize: 12 }}>
                    {m.started}/{m.total}
                  </span>
                  <span style={{ color: 'var(--card-soft)' }}>{open ? '▴' : '▾'}</span>
                </div>
                {open ? (
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--card-soft)' }}>
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
        <h2 style={sectionTitle}>Per Kelompok</h2>
        {groups.length ? (
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {groups.map((g) => (
              <div key={g.name} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ minWidth: 120, fontWeight: 700 }}>{g.name}</span>
                  <Bar pct={g.pct} color="var(--moss)" />
                  <span style={{ minWidth: 44, textAlign: 'right', fontWeight: 700, color: 'var(--moss)' }}>
                    {g.pct}%
                  </span>
                  <span style={{ color: 'var(--card-soft)', fontSize: 12 }}>
                    {g.mastered}/{g.total}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--card-soft)' }}>
                  <span>✓ {g.mastered} dikuasai</span>
                  <span>📘 {g.learning} belajar</span>
                  <span>🆕 {g.newCards} baru</span>
                  {g.nextDue != null ? <span>⏰ {fmtDue(g.nextDue)}</span> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--card-soft)', marginTop: 10 }}>Belum ada kelompok.</p>
        )}
      </section>

      <section className="kp-activity" style={cardStyle}>
        <h2 style={sectionTitle}>Aktivitas 7 Hari</h2>
        {anyActivity ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, marginTop: 10 }}>
            {activity.map((a) => (
              <div
                key={a.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--card-soft)', marginBottom: 4 }}>
                  {a.count || ''}
                </span>
                <div
                  title={`${a.key}: ${a.count} kartu`}
                  style={{
                    width: '100%',
                    maxWidth: 40,
                    height: a.count ? `${(a.count / maxCount) * 100}%` : 3,
                    background: a.count ? 'var(--kin)' : 'var(--panel-line)',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--card-soft)', marginTop: 6 }}>{a.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--card-soft)', marginTop: 10 }}>Belum ada aktivitas</p>
        )}
      </section>

      <section className="kp-srs" style={cardStyle}>
        <h2 style={sectionTitle}>Statistik SRS</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginTop: 10,
          }}
        >
          <Stat label="Total ulasan" value={totalReviews} />
          <Stat label="Ease rata-rata" value={avgEase} />
          <Stat label="Sedang belajar" value={stats.learning} />
          <Stat label="Dikuasai" value={stats.mastered} />
          <Stat label="Kartu baru" value={stats.newCards} />
        </div>
      </section>
    </div>
  )
}
