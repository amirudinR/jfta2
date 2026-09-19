import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, Timer, Play } from 'lucide-react'
import { penalizeNemonik } from '../../lib/nemonik'
import { logDailyReview } from '../../lib/nemonik-sessions'

// Opsi konfigurasi kuis.
const QUESTION_COUNTS = [10, 20]
const OPTION_COUNTS = [2, 4, 6]
const TIMER_SECONDS = 15

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

// Bangun soal. `pool` = kumpulan target kandidat, `all` = seluruh data (untuk pengecoh).
function buildQuestion(pool, all, optionCount) {
  if (!pool || pool.length === 0 || !all || all.length < 2) return null
  const target = pool[Math.floor(Math.random() * pool.length)]
  const type = Math.floor(Math.random() * 3) + 1
  const correct = answerOf(target, type)

  const options = [correct]
  let guard = 0
  while (options.length < optionCount && guard < 300) {
    guard++
    const cand = all[Math.floor(Math.random() * all.length)]
    const wrong = answerOf(cand, type)
    if (wrong && wrong !== '—' && !options.includes(wrong)) options.push(wrong)
  }

  // Jika pengecoh kurang dari target (data seragam), pakai apa adanya.
  return {
    target,
    type,
    correct,
    prompt: promptOf(type),
    questionText: type === 1 ? target.kanji : type === 2 ? target.arti : target.kanji,
    options: shuffle(options),
  }
}

// Layar setup pra-kuis.
function QuizSetup({ data, srs, onStart, onCancel }) {
  const [count, setCount] = useState(10)
  const [options, setOptions] = useState(4)
  const [timer, setTimer] = useState(false)
  const [focusWeak, setFocusWeak] = useState(false)

  // Berapa kanji lemah (ulang/belajar) untuk info.
  const weakCount = useMemo(() => {
    if (!data) return 0
    return data.filter((k) => {
      const s = srs[String(k.no)]
      return s && (s.status === 'ulang' || s.status === 'belajar')
    }).length
  }, [data, srs])

  return (
    <div className="nemo-quiz-setup">
      <h2 className="nemo-setup-title">Pengaturan Kuis</h2>

      <div className="nemo-setup-row">
        <span className="nemo-setup-label">Jumlah soal</span>
        <div className="nemo-seg">
          {QUESTION_COUNTS.map((c) => (
            <button key={c} className={`nemo-seg-btn ${count === c ? 'on' : ''}`} onClick={() => setCount(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="nemo-setup-row">
        <span className="nemo-setup-label">Jumlah pilihan</span>
        <div className="nemo-seg">
          {OPTION_COUNTS.map((o) => (
            <button key={o} className={`nemo-seg-btn ${options === o ? 'on' : ''}`} onClick={() => setOptions(o)}>{o}</button>
          ))}
        </div>
      </div>

      <div className="nemo-setup-row">
        <span className="nemo-setup-label">Timer {TIMER_SECONDS}s / soal</span>
        <button className={`nemo-toggle ${timer ? 'on' : ''}`} onClick={() => setTimer((v) => !v)} aria-pressed={timer}>
          {timer ? 'Aktif' : 'Mati'}
        </button>
      </div>

      <div className="nemo-setup-row">
        <span className="nemo-setup-label">Fokus kanji lemah{weakCount > 0 ? ` (${weakCount})` : ''}</span>
        <button className={`nemo-toggle ${focusWeak ? 'on' : ''}`} onClick={() => setFocusWeak((v) => !v)} aria-pressed={focusWeak}>
          {focusWeak ? 'Aktif' : 'Mati'}
        </button>
      </div>

      <div className="nemo-setup-actions">
        <button className="nemo-btn primary full" onClick={() => onStart({ count, options, timer, focusWeak })}>
          <Play size={16} /> Mulai Kuis
        </button>
        <button className="nemo-btn" onClick={onCancel}>Batal</button>
      </div>
    </div>
  )
}

// Mode Kuis — configurable. Salah → penalti SRS ('ulang').
export default function NemonikQuiz({ data, srs, onSrsChange, onFinish }) {
  const [config, setConfig] = useState(null)     // { count, options, timer, focusWeak } | null
  const [q, setQ] = useState(null)
  const [answered, setAnswered] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const [picked, setPicked] = useState(null)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)

  const srsRef = useRef(srs)
  useEffect(() => { srsRef.current = srs }, [srs])

  // Kumpulan target kandidat sesuai konfigurasi (fokus lemah / semua).
  const candidatePool = useCallback((cfg, srsMap) => {
    if (!data || !cfg) return []
    if (cfg.focusWeak) {
      const weak = data.filter((k) => {
        const s = srsMap[String(k.no)]
        return s && (s.status === 'ulang' || s.status === 'belajar')
      })
      if (weak.length > 0) return weak
    }
    return data
  }, [data])

  const startQuiz = useCallback((cfg) => {
    setConfig(cfg)
    setQ(buildQuestion(candidatePool(cfg, srsRef.current), data, cfg.options))
  }, [candidatePool, data])

  const next = useCallback((cfg) => {
    setPicked(null)
    setQ(buildQuestion(candidatePool(cfg, srsRef.current), data, cfg.options))
    setTimeLeft(TIMER_SECONDS)
  }, [candidatePool, data])

  const finishQuiz = useCallback(() => setFinished(true), [])

  // Pilih jawaban (opt bisa null = waktu habis).
  const choose = useCallback((opt) => {
    if (picked !== null || !q || !config) return
    setPicked(opt ?? '__timeout__')
    const isCorrect = opt === q.correct
    let nextSrs = srsRef.current
    if (isCorrect) {
      setScore((s) => s + 1)
      logDailyReview(3)
    } else {
      setMistakes((m) => [...m, q.target])
      logDailyReview(1)
      nextSrs = penalizeNemonik(srsRef.current, q.target.no)
      onSrsChange(nextSrs)
    }

    const answeredNow = answered + 1
    setAnswered(answeredNow)

    setTimeout(() => {
      if (answeredNow >= config.count) finishQuiz()
      else next(config)
    }, 350)
  }, [picked, q, config, answered, next, onSrsChange, finishQuiz])

  // Timer per-soal.
  useEffect(() => {
    if (!config?.timer || finished || !q || picked !== null) return
    if (timeLeft <= 0) { choose(null); return }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [config, finished, q, picked, timeLeft, choose])

  // ── Setup dulu ──
  if (!config) {
    return <QuizSetup data={data} srs={srs} onStart={startQuiz} onCancel={onFinish} />
  }

  // ── Hasil ──
  if (finished) {
    const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0
    const uniqueMistakes = [...new Set(mistakes)]
    return (
      <div className="nemo-quiz-result">
        <h2>Kuis Selesai!</h2>
        <div className="nemo-result-stats">
          <p>Skor Akhir: <span className="nemo-highlight">{score} / {answered}</span></p>
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
        <span className="nemo-quiz-count">{answered} / {config.count}</span>
        {config.timer && (
          <span className={`nemo-quiz-timer ${timeLeft <= 5 ? 'low' : ''}`}>
            <Timer size={14} /> {timeLeft}s
          </span>
        )}
        <button className="nemo-quiz-close" onClick={onFinish} aria-label="Akhiri kuis">
          <X size={16} /> Akhiri
        </button>
      </div>

      <p className="nemo-quiz-prompt">{q.prompt}</p>
      <div className="nemo-quiz-question">{q.questionText}</div>

      <div className={`nemo-quiz-options ${config.options === 2 ? 'cols-2' : ''}`}>
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
