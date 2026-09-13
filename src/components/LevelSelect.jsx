import { GraduationCap } from 'lucide-react'

const LEVELS = [
  {
    key: 'a2',
    label: 'JFT-A2',
    kanji: '基礎',
    sub: 'JFT Basic — Hiragana, Katakana, Kotoba, Kanji, Bunpou',
    color: 'var(--kin)',
  },
  {
    key: 'n3',
    label: 'JLPT N3',
    kanji: 'N3',
    sub: 'Kosakata & pola lanjutan',
    color: 'var(--moss)',
  },
  {
    key: 'n2',
    label: 'JLPT N2',
    kanji: 'N2',
    sub: 'Kosakata tingkat menengah-atas',
    color: '#6b8cce',
  },
  {
    key: 'n1',
    label: 'JLPT N1',
    kanji: 'N1',
    sub: 'Kosakata tingkat mahir',
    color: 'var(--shu)',
  },
]

export default function LevelSelect({ onSelect }) {
  return (
    <div className="level-select">
      <div className="level-header">
        <span className="level-title-jp">暗記帳</span>
        <h1 className="level-title">Pilih Level</h1>
        <p className="level-subtitle">Tentukan level yang ingin kamu pelajari</p>
      </div>

      <div className="level-grid">
        {LEVELS.map((lv) => (
          <button
            key={lv.key}
            className="level-card"
            onClick={() => onSelect(lv.key)}
            style={{ '--lv-accent': lv.color }}
          >
            <span className="level-kanji">{lv.kanji}</span>
            <span className="level-label">{lv.label}</span>
            <span className="level-sub">{lv.sub}</span>
          </button>
        ))}
      </div>

      <p className="level-foot">
        Kamu bisa pindah level kapan saja dari menu atas.
      </p>
    </div>
  )
}
