import { useRef } from 'react'

// Urutan hierarki navigasi (indeks makin besar = makin "dalam").
// Dipakai untuk menentukan arah transisi ala iOS:
//   maju (indeks naik)  → konten baru masuk dari KANAN (slide-in kanan)
//   mundur (indeks turun) → konten baru masuk dari KIRI (slide-in kiri)
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

// Membungkus konten halaman dengan animasi transisi halus (iOS-like).
// `mode` = kunci halaman. `key={mode}` memaksa remount → animasi masuk
// dijalankan ulang. Arah dihitung IDEMPOTEN (aman untuk StrictMode render
// ganda): bandingkan `mode` dengan mode yang tersimpan, dan hanya simpan mode
// bila benar-benar berubah — sehingga render kedua dgn mode sama tak
// membalik arah.
export default function PageTransition({ mode, children }) {
  // stateRef: { prev, dir } — dihitung sekali per perubahan mode.
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
