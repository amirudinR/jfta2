import { X, BookOpen, Eye, Pencil, EyeOff, RotateCcw, ArrowRight } from 'lucide-react'

// Tutorial menulis kanji: aturan urutan goresan (筆順 hitsujun) + alur latihan.
// Ditulis sebagai modal-ish panel di dalam halaman (bukan fixed) agar aman dari
// containing-block ancestor ber-transform.

// 7 aturan dasar urutan goresan — berlaku universal untuk kanji standar.
const RULES = [
  { n: 1, title: 'Atas → bawah', desc: 'Goresan atas ditulis lebih dulu, lalu turun ke bawah.', glyph: '三' },
  { n: 2, title: 'Kiri → kanan', desc: 'Goresan kiri ditulis lebih dulu, lalu ke kanan.', glyph: '川' },
  { n: 3, title: 'Horizontal dulu', desc: 'Garis mendatar didahulukan sebelum garis tegak yang menyilangnya.', glyph: '十' },
  { n: 4, title: 'Tengah sebelum tepi', desc: 'Pada kanji simetris, garis tengah ditulis dulu, baru sisi kiri-kanan.', glyph: '小' },
  { n: 5, title: 'Luar sebelum dalam', desc: 'Bingkai/kotak luar didahulukan, isinya menyusul.', glyph: '国' },
  { n: 6, title: 'Isi lalu tutup', desc: 'Saat ada kotak, isi dulu, goresan penutup (dasar) paling akhir.', glyph: '回' },
  { n: 7, title: 'Titik/garis kecil terakhir', desc: 'Goresan kecil seperti titik atau sayap kanan-kanan ditulis paling belakang.', glyph: '犬' },
]

// Jenis goresan dasar (garis) yang perlu dikuasai.
const STROKES = [
  { glyph: '一', name: 'Tome (止め)', desc: 'Berhenti — hentikan kuas di ujung tanpa diangkat miring.' },
  { glyph: '亅', name: 'Hane (跳ね)', desc: 'Pantulan — akhiri tegak lalu belokkan naik/menyamping dengan cepat.' },
  { glyph: '丿', name: 'Harai (払い)', desc: 'Sapuan — gerakkan melebar & menipis saat mengangkat kuas.' },
]

// Alur latihan 5 langkah.
const FLOW = [
  { Icon: Eye, title: 'Amati', desc: 'Lihat bentuk kanji & bayangan pada grid genkou (田字格). Perhatikan proporsi terhadap garis tengah.' },
  { Icon: BookOpen, title: 'Pahami arah', desc: 'Terapkan aturan urutan: atas→bawah, kiri→kanan. Bayangkan goresan sebelum menulis.' },
  { Icon: Pencil, title: 'Jiplak', desc: 'Tulis mengikuti bayangan kanji di belakang. Gunakan tekanan sesuai jenis goresan (tome/hane/harai).' },
  { Icon: EyeOff, title: 'Uji ingatan', desc: 'Tekan "Panduan" untuk menyembunyikan grid & bayangan, lalu tulis kanji dari ingatan.' },
  { Icon: RotateCcw, title: 'Ulangi & koreksi', desc: 'Bandingkan hasil dengan bentuk asli. Ulangi 3–5 kali agar bentuknya makin mantap di tangan.' },
]

export default function KanjiTutorial({ onClose }) {
  return (
    <div className="nemo-tut">
      <div className="nemo-tut-head">
        <span className="nemo-tut-title"><Pencil size={16} /> Tutorial Menulis Kanji</span>
        <button type="button" className="nemo-tut-close" onClick={onClose} aria-label="Tutup tutorial">
          <X size={16} />
        </button>
      </div>

      {/* Bagian A — jenis goresan */}
      <div className="nemo-tut-section">
        <p className="nemo-tut-lead">
          Menulis kanji tidak asal mencontoh bentuk — ada <b>urutan goresan</b> (筆順, hitsujun)
          yang membuat tulisan rapi dan mudah diingat. Pelajari dasarnya di bawah ini.
        </p>
        <div className="nemo-tut-strokes">
          {STROKES.map((s) => (
            <div key={s.name} className="nemo-tut-stroke">
              <span className="nemo-tut-glyph" aria-hidden>{s.glyph}</span>
              <div>
                <div className="nemo-tut-stroke-name">{s.name}</div>
                <div className="nemo-tut-stroke-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bagian B — 7 aturan urutan */}
      <div className="nemo-tut-section">
        <div className="nemo-tut-h">7 Aturan Urutan Goresan</div>
        <ol className="nemo-tut-rules">
          {RULES.map((r) => (
            <li key={r.n} className="nemo-tut-rule">
              <span className="nemo-tut-num">{r.n}</span>
              <span className="nemo-tut-rule-glyph" aria-hidden>{r.glyph}</span>
              <span className="nemo-tut-rule-body">
                <b>{r.title}</b>
                <em>{r.desc}</em>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Bagian C — alur latihan */}
      <div className="nemo-tut-section">
        <div className="nemo-tut-h">Alur Latihan (5 Langkah)</div>
        <ol className="nemo-tut-flow">
          {FLOW.map(({ Icon, title, desc }, i) => (
            <li key={title} className="nemo-tut-step">
              <span className="nemo-tut-step-icon"><Icon size={16} /></span>
              <div className="nemo-tut-step-body">
                <div className="nemo-tut-step-title">
                  <span className="nemo-tut-step-num">{i + 1}</span> {title}
                </div>
                <div className="nemo-tut-step-desc">{desc}</div>
              </div>
              {i < FLOW.length - 1 && <ArrowRight size={14} className="nemo-tut-step-arrow" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>

      <button type="button" className="nemo-tut-done" onClick={onClose}>
        Mengerti, mulai menulis
      </button>
    </div>
  )
}
