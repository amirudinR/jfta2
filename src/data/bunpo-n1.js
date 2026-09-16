// Bunpo N1 — struktur siap pakai, konten awal (seed) bertahap per pelajaran.
//
// STATUS KONTEN: SEED / PENDING — daftar di bawah baru sebagian pola tata bahasa
// N1 sebagai contoh agar tab 文法, progress, heatmap, dan Ujian Harian berfungsi.
// Isi penuh pola N1 (± 180 pola) menyusul. Skema sama dengan `bunpo.js` (A2):
//   E(id, front, frontSub, backShort, backFull, group)

const E = (id, front, frontSub, backShort, backFull, group) => ({
  id, front, frontSub, backShort, backFull, group, groupLabel: String(group),
})

export const BUNPO_N1 = [
  // Pelajaran 1
  E(0, '〜なり〜なり', 'なり', 'entah... entah...', 'Memberi contoh pilihan (biasanya disuruh).\n例: 電話なりメールなり連絡して。', 1),
  E(1, '〜であれ', 'であれ', 'betapapun / walaupun', 'Menyatakan kondisi apa pun (formal).\n例: 誰であれ規則は守るべきだ。', 1),
  E(2, '〜たるもの', 'たるもの', 'sebagai (yang seharusnya)', 'Kewajiban sesuai kedudukan.\n例: 医者たるもの患者を第一に考える。', 1),
  E(3, '〜べく', 'べく', 'demi / untuk', 'Menyatakan tujuan dengan niat kuat (formal).\n例: 真実を明らかにすべく行動した。', 1),
  E(4, '〜んばかりに', 'んばかりに', 'seakan-akan hendak', 'Menunjukkan keadaan yang hampir terjadi.\n例: 泣かんばかりに訴えた。', 1),

  // Pelajaran 2
  E(5, '〜ずにはおかない', 'ずにはおかない', 'pasti akan...', 'Menimbulkan reaksi yang tak terelakkan.\n例: 観客を感動させずにはおかない。', 2),
  E(6, '〜ずにはすまない', 'ずにはすまない', 'tidak bisa tidak...', 'Kewajiban sosial yang harus dilakukan.\n例: 謝らずにはすまない。', 2),
  E(7, '〜にたえない', 'にたえない', 'tak tahan / sukar', 'Perasaan yang tak tertahankan (juga: tak layak).\n例: 見るにたえない光景だ。', 2),
  E(8, '〜の至りだ', 'のいたりだ', 'puncak dari...', 'Perasaan ekstrem (formal, sering dalam surat).\n例: 光栄の至りです。', 2),
  E(9, '〜極まりない', 'きわまりない', 'sangat / amat', 'Menyatakan derajat tertinggi (sering negatif).\n例: 失礼極まりない態度だ。', 2),

  // Pelajaran 3
  E(10, '〜を余儀なくされる', 'をよぎなくされる', 'terpaksa...', 'Terpaksa menerima keadaan (formal).\n例: 計画の変更を余儀なくされた。', 3),
  E(11, '〜に至るまで', 'にいたるまで', 'sampai-sampai', 'Menunjuk cakupan yang sangat luas.\n例: 服装に至るまで注意された。', 3),
  E(12, '〜が早いか', 'がはやいか', 'begitu saja...', 'Dua hal terjadi hampir bersamaan.\n例: ベルが鳴るが早いか飛び出した。', 3),
  E(13, '〜そばから', 'そばから', 'begitu... langsung', 'Hal yang selalu terulang sia-sia.\n例: 覚えるそばから忘れる。', 3),
  E(14, '〜とあって', 'とあって', 'karena (istimewa)', 'Sebab khusus yang menimbulkan keadaan khas.\n例: 連休とあって混雑していた。', 3),
]
