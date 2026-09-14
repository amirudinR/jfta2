export default function UjianSummary({
  score,
  order,
  wrongRef,
  difficulty,
  onRetry,
  onBack,
  onShowReview,
  DIFFICULTIES,
}) {
  const total = order.length
  const pct = total ? Math.round((score / total) * 100) : 0
  const emoji = pct >= 85 ? '🏆' : pct >= 70 ? '👍' : '📚'
  const note =
    pct >= 85
      ? 'Luar biasa! Kamu benar-benar paham.'
      : pct >= 70
        ? 'Bagus, sedikit lagi sempurna!'
        : 'Masih perlu latihan. Ulangi materinya ya.'
  const diffLabel = DIFFICULTIES.find((d) => d.key === difficulty)?.label || ''
  const hasWrong = wrongRef.current.length > 0

  return (
    <div className="panel">
      <div className="big-emoji">{emoji}</div>
      <h3>
        {score}/{total} ({pct}%)
      </h3>
      <p>{note}</p>
      <p className="muted" style={{ fontSize: 12 }}>Kesulitan: {diffLabel}</p>
      <div className="row mt no-print" style={{ flexDirection: 'column', alignItems: 'center' }}>
        {hasWrong ? (
          <button className="primary-btn" onClick={onShowReview}>
            Lihat Jawaban Salah ({wrongRef.current.length})
          </button>
        ) : null}
        <button className={hasWrong ? 'link-btn' : 'primary-btn'} onClick={onRetry}>
          Ujian lagi
        </button>
        <button className="link-btn" onClick={onBack}>
          Kembali
        </button>
      </div>
    </div>
  )
}
