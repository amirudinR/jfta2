import { RotateCcw } from 'lucide-react'

export default function RecallSummary({
  result,
  order,
  onRepeatAll,
  onBack,
  onSetPhase,
  ALL_CATS,
  CAT_LABEL,
}) {
  const labelOf = (c) => CAT_LABEL[c] || c

  if (!result) return null

  const { perCat, notPassed, wrongIds } = result
  const total = order.length
  const finalScore = total - wrongIds.length
  const pct = total ? Math.round((finalScore / total) * 100) : 0
  const catKeys = ALL_CATS.filter((c) => perCat[c])

  return (
    <div className="recall-summary">
      <h3 className="recall-summary-title">Hasil Recall</h3>
      <div className="recall-score-line">
        <span className="recall-score-big">{pct}%</span>
        <span className="muted">{finalScore}/{total} benar</span>
      </div>

      <div className="recall-cat-list">
        {catKeys.map((c) => {
          const s = perCat[c]
          const p = Math.round(s.rate * 100)
          return (
            <div className="recall-cat-row" key={c}>
              <span className="recall-cat-name">{labelOf(c)}</span>
              <div className="recall-bar">
                <i className={s.passed ? 'ok' : 'no'} style={{ width: `${p}%` }} />
              </div>
              <span className="recall-cat-num">{s.correct}/{s.total}</span>
              <span className={`recall-cat-badge ${s.passed ? 'ok' : 'no'}`}>
                {s.passed ? 'Hafal' : 'Belum'}
              </span>
            </div>
          )
        })}
      </div>

      {notPassed.length ? (
        <p className="recall-note warn">
          {notPassed.map(labelOf).join(', ')} belum hafal — otomatis diulang besok.
        </p>
      ) : (
        <p className="recall-note ok">Semua kategori sudah hafal. Mantap!</p>
      )}

      <div className="recall-actions no-print">
        {notPassed.length ? (
          <button className="primary-btn" onClick={onRepeatAll}>
            <RotateCcw size={14} /> Ulangi Semua
          </button>
        ) : null}
        <button
          className={notPassed.length ? 'link-btn' : 'primary-btn'}
          onClick={() => onSetPhase('setup')}
        >
          {notPassed.length ? 'Lanjut' : 'Selesai'}
        </button>
        {wrongIds.length ? (
          <button className="link-btn" onClick={() => onSetPhase('review')}>
            Lihat Jawaban Salah ({wrongIds.length})
          </button>
        ) : null}
        <button className="link-btn" onClick={onBack}>Kembali</button>
      </div>
    </div>
  )
}
