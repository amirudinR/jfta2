// Kanji N2 — struktur siap pakai, konten awal (seed) bertahap per pelajaran.
//
// STATUS KONTEN: SEED / PENDING — daftar di bawah baru sebagian kanji N2 sebagai
// contoh agar tab 漢字, progress, heatmap, dan Ujian Harian berfungsi. Isi penuh
// kanji N2 (target ± 380 kanji) menyusul. Skema sama dengan `kanji.js` (A2):
//   E(id, front, reading, backShort, backFull, group)

const E = (id, front, reading, backShort, backFull, group) => ({
  id, front, frontSub: '', backShort, backFull, group, groupLabel: String(group), reading,
})

export const KANJI_N2 = [
  // Pelajaran 1
  E(0, '握', 'あく', 'Menggenggam', '握 — memegang / menggenggam', 1),
  E(1, '扱', 'あつか', 'Menangani', '扱 — memperlakukan / mengurus', 1),
  E(2, '依', 'い', 'Bergantung', '依 — bersandar / meminta', 1),
  E(3, '偉', 'えら', 'Agung', '偉 — besar / terhormat', 1),
  E(4, '威', 'い', 'Wibawa', '威 — kekuatan / wibawa', 1),
  E(5, '尉', 'い', 'Perwira', '尉 — pangkat militer', 1),
  E(6, '慰', 'い', 'Menghibur', '慰 — menenangkan / melipur', 1),
  E(7, '胃', 'い', 'Lambung', '胃 — organ pencernaan', 1),

  // Pelajaran 2
  E(8, '異', 'い', 'Berbeda', '異 — lain / aneh', 2),
  E(9, '移', 'い', 'Berpindah', '移 — memindah / mengalih', 2),
  E(10, '維', 'い', 'Memelihara', '維 — menjaga / mengikat', 2),
  E(11, '緯', 'い', 'Lintang', '緯 — garis lintang', 2),
  E(12, '違', 'ちが', 'Berbeda / salah', '違 — menyimpang / keliru', 2),
  E(13, '遺', 'い', 'Meninggalkan', '遺 — mewariskan / tertinggal', 2),
  E(14, '域', 'いき', 'Wilayah', '域 — kawasan / zona', 2),
  E(15, '育', 'いく', 'Mendidik', '育 — membesarkan / menumbuhkan', 2),

  // Pelajaran 3
  E(16, '逸', 'いつ', 'Melepas / unggul', '逸 — lolos / menonjol', 3),
  E(17, '因', 'いん', 'Sebab', '因 — penyebab / faktor', 3),
  E(18, '姻', 'いん', 'Perkawinan', '姻 — hubungan pernikahan', 3),
  E(19, '引', 'ひ', 'Menarik', '引 — menarik / mengundang', 3),
  E(20, '印', 'いん', 'Tanda', '印 — cap / jejak', 3),
  E(21, '咽', 'いん', 'Tenggorokan', '咽 — kerongkongan', 3),
  E(22, '宇', 'う', 'Ruang / jagat', '宇 — semesta / ruang', 3),
  E(23, '羽', 'う', 'Bulu / sayap', '羽 — sayap burung', 3),
]
