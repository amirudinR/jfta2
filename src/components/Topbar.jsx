import { MATERIALS } from '../data/materials'

export default function Topbar({ onReset }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="jp">暗記帳</span> Annkijou
        <span className="tag">JFT-Basic A2 &middot; Hiragana · Katakana · Kotoba · Kanji · Bunpo</span>
      </div>
      <div className="header-right">
        <button className="btn" onClick={onReset} title="Hapus semua progres hafalan">
          Reset
        </button>
      </div>
    </header>
  )
}