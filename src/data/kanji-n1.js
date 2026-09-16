// Kanji N1 — struktur siap pakai, konten awal (seed) bertahap per pelajaran.
//
// STATUS KONTEN: SEED / PENDING — daftar di bawah baru sebagian kanji N1 sebagai
// contoh agar tab 漢字, progress, heatmap, dan Ujian Harian berfungsi. Isi penuh
// kanji N1 (target ± 850 kanji, termasuk bacaan majemuk) menyusul. Skema sama
// dengan `kanji.js` (A2):
//   E(id, front, reading, backShort, backFull, group)

const E = (id, front, reading, backShort, backFull, group) => ({
  id, front, frontSub: '', backShort, backFull, group, groupLabel: String(group), reading,
})

export const KANJI_N1 = [
  // Pelajaran 1
  E(0, '亜', 'あ', 'Asia / sekunder', '亜 — Asia, urutan kedua', 1),
  E(1, '哀', 'あい', 'Duka', '哀 — kesedihan / belas kasih', 1),
  E(2, '挨', 'あい', 'Menyapa', '挨 — membuka percakapan (挨拶)', 1),
  E(3, '曖', 'あい', 'Kabur', '曖 — samar / tidak jelas', 1),
  E(4, '悪', 'あく', 'Buruk', '悪 — jahat / tidak baik', 1),
  E(5, '握', 'あく', 'Menggenggam', '握 — memegang erat', 1),
  E(6, '圧', 'あつ', 'Tekanan', '圧 — desakan / penekanan', 1),
  E(7, '宛', 'あて', 'Ditujukan', '宛 — alamat / sasaran', 1),

  // Pelajaran 2
  E(8, '暗', 'あん', 'Gelap', '暗 — gelap / samar', 2),
  E(9, '案', 'あん', 'Rencana', '案 — gagasan / usulan', 2),
  E(10, '闇', 'やみ', 'Kegelapan', '闇 — gelap gulita / kekacauan', 2),
  E(11, '以', 'い', 'Sejak', '以 — mulai dari / sandaran', 2),
  E(12, '伊', 'い', 'Italia', '伊 — Itali (nama negara)', 2),
  E(13, '位', 'い', 'Kedudukan', '位 — pangkat / posisi', 2),
  E(14, '依', 'い', 'Bergantung', '依 — bersandar / meminta', 2),
  E(15, '偉', 'えら', 'Agung', '偉 — luhur / hebat', 2),

  // Pelajaran 3
  E(16, '威', 'い', 'Wibawa', '威 — kekuatan / martabat', 3),
  E(17, '尉', 'い', 'Perwira', '尉 — pangkat dalam militer', 3),
  E(18, '畏', 'い', 'Segen', '畏 — hormat / takut', 3),
  E(19, '慰', 'い', 'Menghibur', '慰 — melipur / menenteramkan', 3),
  E(20, '意', 'い', 'Maksud', '意 — niat / makna', 3),
  E(21, '易', 'い', 'Mudah', '易 — gampang / perubahan', 3),
  E(22, '為', 'ため', 'Untuk / demi', '為 — tujuan / sebab', 3),
  E(23, '異', 'い', 'Berbeda', '異 — lain / ganjil', 3),
]
