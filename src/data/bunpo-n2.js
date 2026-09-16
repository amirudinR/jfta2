// Bunpo N2 — struktur siap pakai, konten awal (seed) bertahap per pelajaran.
//
// STATUS KONTEN: SEED / PENDING — daftar di bawah baru sebagian pola tata bahasa
// N2 sebagai contoh agar tab 文法, progress, heatmap, dan Ujian Harian berfungsi.
// Isi penuh pola N2 (± 150 pola) menyusul. Skema sama dengan `bunpo.js` (A2):
//   E(id, front, frontSub, backShort, backFull, group)

const E = (id, front, frontSub, backShort, backFull, group) => ({
  id, front, frontSub, backShort, backFull, group, groupLabel: String(group),
})

export const BUNPO_N2 = [
  // Pelajaran 1
  E(0, '〜に際して', 'さいして', 'pada saat / menjelang', 'Menyatakan momen khusus/formal.\n例: 出発に際して挨拶した。', 1),
  E(1, '〜にあたって', 'あたって', 'ketika / dalam rangka', 'Menyatakan saat penting melakukan sesuatu.\n例: 開会にあたって一言。', 1),
  E(2, '〜に先立って', 'さきだって', 'sebelum / mendahului', 'Sesuatu dilakukan lebih dulu.\n例: 会議に先立って資料を配る。', 1),
  E(3, '〜をめぐって', 'めぐって', 'seputar / mengenai', 'Perdebatan/pertentangan tentang suatu hal.\n例: 遺産をめぐって争う。', 1),
  E(4, '〜に伴って', 'ともなって', 'seiring dengan', 'Perubahan yang menyertai hal lain.\n例: 人口増に伴って問題も増えた。', 1),

  // Pelajaran 2
  E(5, '〜がたい', 'がたい', 'sulit untuk...', 'Sulit dilakukan (perasaan penutur).\n例: 信じがたい話だ。', 2),
  E(6, '〜かねない', 'かねない', 'bisa jadi (buruk)', 'Ada kemungkinan hasil negatif.\n例: 事故になりかねない。', 2),
  E(7, '〜かねる', 'かねる', 'tidak bisa / sulit', 'Menolak dengan halus.\n例: お答えしかねます。', 2),
  E(8, '〜つつある', 'つつある', 'sedang dalam proses', 'Perubahan yang sedang berlangsung.\n例: 景気は回復しつつある。', 2),
  E(9, '〜次第だ', 'しだいだ', 'bergantung pada / segera', 'Hasil bergantung pada, atau begitu selesai.\n例: 詳細は後日連絡次第です。', 2),

  // Pelajaran 3
  E(10, '〜に限らず', 'にかぎらず', 'tidak hanya...', 'Cakupan yang lebih luas.\n例: 若者に限らず人気だ。', 3),
  E(11, '〜を問わず', 'をとわず', 'tanpa memandang', 'Tidak terbatas pada kondisi tertentu.\n例: 経験を問わず応募できる。', 3),
  E(12, '〜ぬきで', 'ぬきで', 'tanpa...', 'Melakukan sesuatu tanpa hal tertentu.\n例: 朝食ぬきで出かけた。', 3),
  E(13, '〜がてら', 'がてら', 'sambil / sekalian', 'Melakukan dua hal dalam satu kesempatan.\n例: 散歩がてら買い物した。', 3),
  E(14, '〜ことなく', 'ことなく', 'tanpa (pernah)...', 'Tanpa melakukan hal yang biasanya terjadi.\n例: 休むことなく働いた。', 3),
]
