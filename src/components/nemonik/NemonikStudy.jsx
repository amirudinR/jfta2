import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { imgUrl } from '../../lib/nemonik'

// Kartu nemonik — layout 3 gambar (sesuai spesifikasi):
//   1. KIRI ATAS  : kanji_bersih_opt  → kanji polos
//   2. KANAN ATAS : kanji_nama_opt    → ilustrasi mnemonic berwarna
//   3. BAWAH      : selesai_potong_opt→ KARTU LENGKAP (kanji, arti, onyomi,
//                   kunyomi, kosakata) dalam SATU gambar → tampil apa adanya.
// Semua info teks sudah ada di gambar "selesai_potong", jadi TIDAK ada
// generate ulang teks di React.
function CardBody({ entry }) {
  const imgBersih = imgUrl(entry.img_kanji_bersih)
  const imgKonteks = imgUrl(entry.img_kanji_nama)
  const imgSelesai = imgUrl(entry.img_selesai_potong)

  return (
    <div className="nemo-flashcard">
      <div className="nemo-flashcard-top">
        <div className="nemo-img-left">
          {imgBersih
            ? <img src={imgBersih} alt={`Kanji ${entry.kanji}`} loading="lazy" />
            : <div className="nemo-img-missing">Kanji tidak tersedia</div>}
        </div>
        <div className="nemo-img-right">
          {imgKonteks
            ? <img src={imgKonteks} alt={`Mnemonic ${entry.kanji}`} loading="lazy" />
            : <div className="nemo-img-missing">Mnemonic tidak tersedia</div>}
        </div>
      </div>

      <div className="nemo-flashcard-bottom">
        {imgSelesai
          ? <img src={imgSelesai} alt={`Kartu lengkap ${entry.kanji}`} loading="lazy" />
          : <div className="nemo-img-missing">Kartu lengkap tidak tersedia</div>}
      </div>
    </div>
  )
}

// Sesi belajar: tampilkan kartu satu per satu.
// Tombol "Saya Tidak Tahu" / "Saya Tahu" di paling bawah (rating 1 / 3).
export default function NemonikStudy({ queue, onGrade, onFinish }) {
  const [index, setIndex] = useState(0)

  if (!queue || queue.length === 0) {
    return (
      <div className="nemo-study">
        <p className="nemo-empty">Tidak ada kartu untuk dipelajari saat ini.</p>
        <button className="nemo-btn primary" onClick={onFinish}>Kembali ke Dashboard</button>
      </div>
    )
  }

  if (index >= queue.length) {
    return (
      <div className="nemo-study">
        <div className="nemo-done">
          <Check size={40} className="nemo-done-icon" />
          <h2>Sesi selesai!</h2>
          <p>Kamu menyelesaikan {queue.length} kartu.</p>
          <button className="nemo-btn primary" onClick={onFinish}>Kembali ke Dashboard</button>
        </div>
      </div>
    )
  }

  const entry = queue[index]

  const rate = (rating) => {
    onGrade(String(entry.no), rating)
    setIndex((i) => i + 1)
  }

  return (
    <div className="nemo-study">
      <div className="nemo-study-progress">
        {index + 1} / {queue.length}
      </div>

      <CardBody entry={entry} />

      <div className="nemo-rating">
        <button className="nemo-rating-btn wrong" onClick={() => rate(1)}>
          <X size={15} /> Saya Tidak Tahu
        </button>
        <button className="nemo-rating-btn easy" onClick={() => rate(3)}>
          <Check size={15} /> Saya Tahu
        </button>
      </div>
    </div>
  )
}
