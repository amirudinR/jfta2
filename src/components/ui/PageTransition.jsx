import { useRef } from 'react'

// Urutan hierarki navigasi (indeks makin besar = makin "dalam").
// Dipakai untuk menentukan arah transisi ala iOS:
//   maju (indeks naik)  → konten baru masuk dari KANAN (push)
//   mundur (indeks turun) → konten baru masuk dari KIRI (pop)
// Mode yang tidak terdaftar diperlakukan "maju".
const NAV_ORDER = [
  'harian', 'kemampuan', 'referensi', 'daftar', 'materi', 'profil',
  'kartu', 'kuis', 'sprint', 'ulangi', 'recall',
  'kotoba-n3', 'kotoba-n2', 'kotoba-n1',
  'ujian', 'ujian-baru', 'nemonik',
]

function rankOf(mode) {
  const i = NAV_ORDER.indexOf(mode)
  return i === -1 ? NAV_ORDER.length : i
}

// Membungkus konten halaman dengan animasi transisi halus ala iOS.
//
// `mode` = kunci halaman. `key={mode}` memaksa remount → animasi masuk
// dijalankan ulang. Arah (push/pop) ditentukan dari perbandingan rank mode
// sebelumnya vs sekarang.
//
// CATATAN DESAIN: kita sengaja TIDAK merender konten lama secara paralel
// (parallax dua-layer) seperti di native. Merender dua React tree sekaligus
// membuat useEffect anak (auto-focus, timer, fetch) jalan dua kali — rapuh &
// boros pada web. Sebagai gantinya, konten baru masuk dengan kombinasi
// slide + scale + fade yang dikalibrasi agar terasa push/pop: cukup meyakinkan,
// tetap 60fps, dan nol risiko efek-samping ganda.
//
// Arah dihitung IDEMPOTEN (aman StrictMode render ganda): bandingkan `mode`
// dgn mode tersimpan & hanya simpan bila benar-benar berubah.
export default function PageTransition({ mode, children }) {
  const stateRef = useRef({ prev: mode, dir: 'forward' })
  if (mode !== stateRef.current.prev) {
    stateRef.current = {
      prev: mode,
      dir: rankOf(mode) >= rankOf(stateRef.current.prev) ? 'forward' : 'back',
    }
  }
  const dir = stateRef.current.dir

  return (
    <div key={mode} className={`page-transition page-${dir}`}>
      {children}
    </div>
  )
}
