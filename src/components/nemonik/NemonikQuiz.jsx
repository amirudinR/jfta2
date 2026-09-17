import { useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { penalizeNemonik } from '../../lib/nemonik'

const TOTAL_QUESTIONS = 10

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Ambil nilai jawaban sesuai tipe soal (1: arti, 2: kanji, 3: cara baca).
function answerOf(entry, type) {
  if (type === 1) return entry.arti
  if (type === 2) return entry.kanji
  return entry.kunyomi && entry.kunyomi !== '—' ? entry.kunyomi : entry.onyomi
}

function promptOf(type) {
  if (type === 1) return 'Apa arti dari kanji ini?'
  if (type === 2) return 'Pilih kanji yang memiliki arti berikut:'
  return 'Mana cara baca (Onyomi/Kunyomi) yang benar?'
}

function buildQuestion(data, srs) {
  if (!data || data.length < 4) return null
  // Prioritas: status 'ulang' & 'belajar' (sama seperti app.js asli).
  let pool = data.filter((k) => {
    const s = srs[String(k.no)]
    return s && (s.status === 'ulang' || s.status === 'belajar')
  })
  if (pool.length < 4) pool = data

  const target = pool[Math.floor(Math.random() * pool.length)]
  const type = Math.floor(Math.random() * 3) + 1
  const correct = answerOf(target, type)

  const options = [correct]
  let guard = 0
  while (options.length < 4 && guard < 200) {
    guard++
    const cand = data[Math.floor(Math.random() * data.length)]
    const wrong = answerOf(cand, type)
    if (wrong && wrong !== '—' && !options.includes(wrong)) options.push(wrong)
  }

  return {
    target,
    type,
    correct,
    prompt: promptOf(type),
    questionText: type === 1 ? target.kanji : type === 2 ? target.arti : target.kanji,
    options: shuffle(options),
  }
}

// Mode Kuis — 10 soal, 3 tipe. Salah → penalti SRS ('ulang'), sama seperti asli.
export default function NemonikQuiz({ data, srs, onSrsChange, onFinish }) {
  const [q, setQ] = useState(() => buildQuestion(data, srs))
  const [answered, setAnswered] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const [picked, setPicked] = useState(null) // untuk feedback warna
  const [finished, setFinished] = useState(false)

  const correctCount = useMemo(() => score, [score])

  const next = useCallback((nextSrs) => {
    setPicked(null)
    setQ(buildQuestion(data, nextSrs))
  }, [data])

  const choose = (opt) => {
    if (picked !== null || !q) return
    setPicked(opt)
    const isCorrect = opt === q.correct
    let nextSrs = srs
    if (isCorrect) {
      setScore((s) => s + 1)
    } else {
      setMistakes((m) => [...m, q.target])
      nextSrs = penalizeNemonik(srs, q.target.no)
      onSrsChange(nextSrs)
    }

    const answeredNow = answered + 1
    setAnswered(answeredNow)

    // Beri jeda singkat agar warna feedback terlihat sebelum lanjut.
    setTimeout(() => {
      if (answeredNow >= TOTAL_QUESTIONS) setFinished(true)
      else next(nextSrs)
    }, 350)
  }

  if (finished) {
    const accuracy = answered > 0 ? Math.round((correctCount / answered) * 100) : 0
    const uniqueMistakes = [...new Set(mistakes)]
    return (
      <div className="nemo-quiz-result">
        <h2>Kuis Selesai!</h2>
        <div className="nemo-result-stats">
          <p>Skor Akhir: <span className="nemo-highlight">{correctCount} / {answered}</span></p>
          <p>Akurasi: <span className="nemo-highlight">{accuracy}%</span></p>
        </div>
        {uniqueMistakes.length > 0 && (
          <div className="nemo-mistakes">
            <h3>Sering Salah:</h3>
            <ul>
              {uniqueMistakes.map((m) => (
                <li key={m.no}><strong>{m.kanji}</strong> — {m.arti}</li>
              ))}
            </ul>
          </div>
        )}
        <button className="nemo-btn primary full" onClick={onFinish}>Tutup</button>
      </div>
    )
  }

  if (!q) {
    return (
      <div className="nemo-quiz-result">
        <p>Data tidak cukup untuk kuis.</p>
        <button className="nemo-btn primary full" onClick={onFinish}>Tutup</button>
      </div>
    )
  }

  return (
    <div className="nemo-quiz">
      <div className="nemo-quiz-head">
        <span className="nemo-quiz-score">Skor: {score}</span>
        <span className="nemo-quiz-count">{answered} / {TOTAL_QUESTIONS}</span>
        <button className="nemo-quiz-close" onClick={onFinish} aria-label="Akhiri kuis">
          <X size={16} /> Akhiri
        </button>
      </div>

      <p className="nemo-quiz-prompt">{q.prompt}</p>
      <div className="nemo-quiz-question">{q.questionText}</div>

      <div className="nemo-quiz-options">
        {q.options.map((opt) => {
          let cls = 'nemo-quiz-option'
          if (picked !== null) {
            if (opt === q.correct) cls += ' correct'
            else if (opt === picked) cls += ' wrong'
          }
          return (
            <button key={opt} className={cls} onClick={() => choose(opt)} disabled={picked !== null}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
