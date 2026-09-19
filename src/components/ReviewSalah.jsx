import { ArrowLeft, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'

// ReviewSalah — halaman review jawaban salah setelah ujian
export default function ReviewSalah({ wrongItems, score, total, difficulty, onRetry, onBack }) {
  const pct = total ? Math.round((score / total) * 100) : 0

  return (
    <div className="review-salah">
      <button className="ujian-setup-back" onClick={onBack} title="Kembali">
        <ArrowLeft size={18} />
      </button>

      {/* Summary header */}
      <div className="review-summary">
        <div className="review-score-ring">
          <span className="review-score-num">{pct}%</span>
          <span className="review-score-label">{score}/{total} benar</span>
        </div>
        <p className="review-diff">Kesulitan: {difficulty}</p>
      </div>

      {/* Wrong items list */}
      {wrongItems.length > 0 ? (
        <>
          <div className="review-section-header">
            <AlertCircle size={16} />
            <span>Jawaban Salah ({wrongItems.length})</span>
          </div>

          <div className="review-list">
            {wrongItems.map((item, i) => (
              <div key={`${item.id ?? item.question}-${i}`} className="review-item">
                <div className="review-item-q">
                  <span className="review-num">{i + 1}</span>
                  <span className="review-question">{item.question}</span>
                  {item.reading ? <span className="review-reading">{item.reading}</span> : null}
                </div>
                <div className="review-answers">
                  <div className="review-wrong-answer">
                    <span className="review-x-mark">✗</span>
                    <span>Jawabanmu: <b>{item.userAnswer}</b></span>
                  </div>
                  <div className="review-correct-answer">
                    <CheckCircle size={14} />
                    <span>Benar: <b>{item.correctAnswer}</b></span>
                  </div>
                </div>
                {item.explanation ? (
                  <div className="review-explanation">{item.explanation}</div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="review-perfect">
          <CheckCircle size={28} />
          <p>Sempurna! Tidak ada jawaban salah.</p>
        </div>
      )}

      <div className="review-actions">
        <button className="primary-btn" onClick={onRetry}>
          <RotateCcw size={14} />
          <span>Ujian Lagi</span>
        </button>
        <button className="link-btn" onClick={onBack}>
          Kembali
        </button>
      </div>
    </div>
  )
}
