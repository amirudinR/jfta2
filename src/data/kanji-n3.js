// Kanji N3 — struktur siap pakai, konten awal (seed) bertahap per pelajaran.
//
// STATUS KONTEN: SEED / PENDING — daftar di bawah baru sebagian kanji N3 sebagai
// contoh agar tab 漢字, progress, heatmap, dan Ujian Harian berfungsi. Isi penuh
// kanji N3 (target ± 370 kanji) menyusul dengan mengganti/menambah entri `E(...)`
// di bawah. Skema sama dengan `kanji.js` (A2):
//   E(id, front, reading, backShort, backFull, group)
//   → { id, front, frontSub:'', backShort, backFull, group, groupLabel:String(group), reading }
//
// `group` = nomor pelajaran (boleh dipakai untuk filter pelajaran di Controls).

const E = (id, front, reading, backShort, backFull, group) => ({
  id, front, frontSub: '', backShort, backFull, group, groupLabel: String(group), reading,
})

export const KANJI_N3 = [
  // Pelajaran 1 — kanji benda & kata kerja dasar menengah
  E(0, '愛', 'あい', 'Cinta', '愛 — cinta / kasih sayang', 1),
  E(1, '圧', 'あつ', 'Tekanan', '圧 — tekanan / desakan', 1),
  E(2, '案', 'あん', 'Rencana', '案 — rancangan / usulan', 1),
  E(3, '以', 'い', 'Sejak / dengan', '以 — batas/patokan (以上, 以下)', 1),
  E(4, '位', 'い', 'Pangkat / posisi', '位 — kedudukan / urutan', 1),
  E(5, '違', 'ちが', 'Berbeda', '違 — berbeda / salah', 1),
  E(6, '域', 'いき', 'Wilayah', '域 — daerah / kawasan', 1),
  E(7, '育', 'いく', 'Membesarkan', '育 — mendidik / menumbuhkan', 1),

  // Pelajaran 2 — kanji abstrak & sifat
  E(8, '員', 'いん', 'Anggota', '員 — personel / anggota', 2),
  E(9, '委', 'い', 'Menyerahkan', '委 — mempercayakan (委員)', 2),
  E(10, '映', 'えい', 'Memantul / proyeksi', '映 — memancarkan gambar', 2),
  E(11, '営', 'えい', 'Mengelola', '営 — menjalankan usaha', 2),
  E(12, '益', 'えき', 'Manfaat', '益 — keuntungan / faedah', 2),
  E(13, '演', 'えん', 'Pertunjukan', '演 — memainkan / menggelar', 2),
  E(14, '応', 'おう', 'Menanggapi', '応 — respons / menyesuaikan', 2),
  E(15, '欧', 'おう', 'Eropa', '欧 — benua Eropa', 2),

  // Pelajaran 3 — kanji lanjutan
  E(16, '億', 'おく', 'Ratus juta', '億 — satuan 100.000.000', 3),
  E(17, '屋', 'おく', 'Rumah / toko', '屋 — bangunan / penjual', 3),
  E(18, '改', 'かい', 'Memperbaiki', '改 — mengubah ke arah lebih baik', 3),
  E(19, '解', 'かい', 'Memecahkan', '解 — mengurai / memahami', 3),
  E(20, '格', 'かく', 'Status / tipe', '格 — kedudukan / mutu', 3),
  E(21, '確', 'かく', 'Pasti', '確 — kokoh / terjamin', 3),
  E(22, '各', 'かく', 'Tiap', '各 — masing-masing', 3),
  E(23, '覚', 'かく', 'Ingat / sadar', '覚 — menyadari / menghafal', 3),
]
