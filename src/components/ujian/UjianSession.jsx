// Metadata kategori ujian → ikon (kanji) + label. Dipakai indikator kategori.
const CATEGORY_META = {
  kotoba: { label: 'Kotoba', kanji: '言葉', icon: '📖' },
  kanji: { label: 'Kanji', kanji: '漢字', icon: '🈁' },
  bunpou: { label: 'Bunpou', kanji: '文法', icon: '📐' },
  mix: { label: 'Campuran', kanji: '混合', icon: '🎯' },
}

function formatTime(sec) {
  const s = Math.max(0, sec | 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function UjianSession({
  entry,
  opts,
  choice,
  score,
  q,
  order,
  difficulty,
  category,
  streak = 0,
  bestStreak = 0,
  elapsed = 0,
  onPick,
  onNext,
}) {
  if (!entry) return null

  const { label, options } = opts || { label: '', options: [] }
  const question = entry.front
  const diffTag = difficulty === 'sulit' ? 'Sulit' : difficulty === 'mudah' ? 'Mudah' : 'Biasa'
  const total = order.length
  const current = q + 1
  const done = q + (choice ? 1 : 0)
  const pct = total ? Math.round((done / total) * 100) : 0
  const answered = choice ? q + 1 : q
  const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0
  const cat = CATEGORY_META[category] || CATEGORY_META.mix

  return (
    <div className="ujian-session">
      <div className="ujian-session-main">
        <div className="quiz-stats no-print">
          <span className="qstat">
            Soal <b>{current}</b>/{total}
          </span>
          <span className="qstat ok">
            Benar <b>{score}</b>
          </span>
          <span className="qstat err">
            Salah <b>{q - score}</b>
          </span>
          <span className="qstat qstat-diff" style={{ marginLeft: 'auto', fontSize: 11 }}>
            {diffTag}
          </span>
        </div>

        {/* Progress bar visual — menggantikan sekadar teks "Soal 33/160". */}
        <div className="exam-progress no-print" aria-hidden="true">
          <div className="exam-progress-track">
            <div className="exam-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="exam-progress-pct">{pct}%</span>
        </div>

        <div className="quiz-card" key={q}>
          <div className="card-top">
            <span className="exam-cat-badge" title={cat.label}>
              <span className="exam-cat-icon" aria-hidden="true">{cat.icon}</span>
              <span className="exam-cat-kanji">{cat.kanji}</span>
              <span className="exam-cat-label">{cat.label}</span>
            </span>
            <span className="exam-card-top-group">
              Ujian · {entry.groupLabel || entry.material || 'Umum'}
            </span>
          </div>
          <div className="card-body exam-card-body">
            <div className="word" style={{ fontSize: 'clamp(1.9rem, 8vw, 2.6rem)' }}>
              {question}
            </div>
            {entry.reading ? <div className="word-reading">{entry.reading}</div> : null}
            {entry.frontSub ? <div className="meaning-sub">{entry.frontSub}</div> : null}
          </div>
        </div>

        <div className="opt-grid">
          {options.map((opt) => {
            let tone = ''
            if (choice) {
              if (opt === label) tone = 'correct'
              else if (opt === choice) tone = 'wrong'
            }
            return (
              <button key={opt} className={`opt ${tone}`} disabled={!!choice} onClick={() => onPick(opt)}>
                {opt}
              </button>
            )
          })}
        </div>

        {choice ? (
          <>
            <p className={`mt feedback ${choice === label ? 'feedback-ok' : 'feedback-err'}`}>
              {choice === label ? 'Benar!' : `Salah — jawaban: ${label}`}
            </p>
            <div className="next-row no-print">
              <button className="primary-btn" onClick={onNext}>
                {q + 1 >= order.length ? 'Lihat hasil' : 'Lanjut'}
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Panel statistik sesi — mengisi ruang vertikal & berguna. */}
      <aside className="exam-side no-print">
        <div className="exam-side-card">
          <div className="exam-side-title">Sesi ini</div>
          <div className="exam-stat-grid">
            <div className="exam-stat">
              <span className="exam-stat-val">{streak}</span>
              <span className="exam-stat-label">Streak 🔥</span>
            </div>
            <div className="exam-stat">
              <span className="exam-stat-val">{bestStreak}</span>
              <span className="exam-stat-label">Terbaik</span>
            </div>
            <div className="exam-stat">
              <span className="exam-stat-val">{formatTime(elapsed)}</span>
              <span className="exam-stat-label">Waktu</span>
            </div>
            <div className="exam-stat">
              <span className="exam-stat-val">{accuracy}%</span>
              <span className="exam-stat-label">Akurasi</span>
            </div>
          </div>
        </div>

        <div className="exam-side-card">
          <div className="exam-side-title">Kategori</div>
          <div className="exam-side-cat">
            <span className="exam-side-cat-icon" aria-hidden="true">{cat.icon}</span>
            <div>
              <div className="exam-side-cat-label">{cat.label}</div>
              <div className="exam-side-cat-sub">{cat.kanji} · {diffTag}</div>
            </div>
          </div>
        </div>

        <div className="exam-side-card">
          <div className="exam-side-title">Kemajuan</div>
          <div className="exam-side-progress">
            <div className="exam-side-progress-track">
              <div className="exam-side-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="exam-side-progress-meta">
              <span>{current} / {total} soal</span>
              <span>{pct}%</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
