const CAT_LABEL = { kotoba: 'Kotoba', kanji: 'Kanji', bunpou: 'Bunpou' }
const labelOf = (c) => CAT_LABEL[c] || c

export default function RecallSession({ entry, opts, choice, score, q, order, onPick, onNext }) {
  if (!entry) return null

  const { label, options } = opts || { label: '', options: [] }

  return (
    <>
      <div className="quiz-stats no-print">
        <span className="qstat">Soal <b>{q + 1}</b>/{order.length}</span>
        <span className="qstat ok">Benar <b>{score}</b></span>
        <span className="qstat err">Salah <b>{q - score}</b></span>
        <span className="qstat" style={{ marginLeft: 'auto', fontSize: 11 }}>· Recall</span>
      </div>

      <div className="quiz-card" key={q}>
        <div className="card-top">
          Recall · {labelOf(entry.category)} · {entry.groupLabel || 'Materi lama'}
        </div>
        <div className="card-body" style={{ padding: '14px 4px 8px' }}>
          <div className="word" style={{ fontSize: 'clamp(1.9rem, 8vw, 2.6rem)' }}>
            {entry.front}
          </div>
          {entry.reading ? <div className="word-reading">{entry.reading}</div> : null}
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
          <p className={`mt ${choice === label ? 'feedback-ok' : 'feedback-err'}`}>
            {choice === label ? 'Benar!' : `Salah — jawaban: ${label}`}
          </p>
          <div className="next-row no-print">
            <button className="primary-btn" onClick={onNext}>
              {q + 1 >= order.length ? 'Lihat hasil' : 'Lanjut'}
            </button>
          </div>
        </>
      ) : null}
    </>
  )
}
