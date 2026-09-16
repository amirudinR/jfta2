// Bunpo N3 — struktur siap pakai, konten awal (seed) bertahap per pelajaran.
//
// STATUS KONTEN: SEED / PENDING — daftar di bawah baru sebagian pola tata bahasa
// N3 sebagai contoh agar tab 文法, progress, heatmap, dan Ujian Harian berfungsi.
// Isi penuh pola N3 (± 120 pola) menyusul. Skema sama dengan `bunpo.js` (A2):
//   E(id, front, frontSub, backShort, backFull, group)
//   → { id, front, frontSub, backShort, backFull, group, groupLabel:String(group) }
//
// front     = pola (mis. 〜ようになる)
// frontSub  = bacaan kana
// backShort = arti singkat
// backFull  = penjelasan + contoh (boleh multi-baris dengan \n)

const E = (id, front, frontSub, backShort, backFull, group) => ({
  id, front, frontSub, backShort, backFull, group, groupLabel: String(group),
})

export const BUNPO_N3 = [
  // Pelajaran 1 — perubahan keadaan & kebiasaan
  E(0, '〜ようになる', '〜ようになる', 'menjadi (biasa)...', 'Menyatakan perubahan kebiasaan/kemampuan.\n例: 日本語が話せるようになった。', 1),
  E(1, '〜ことにする', '〜ことにする', 'memutuskan untuk...', 'Keputusan yang diambil sendiri.\n例: 毎日勉強することにした。', 1),
  E(2, '〜ことになる', '〜ことになる', 'menjadi (keputusan)...', 'Keputusan dari pihak lain/aturan.\n例: 来月転勤することになった。', 1),
  E(3, '〜ようにする', '〜ようにする', 'berusaha agar...', 'Usaha/kebiasaan yang diupayakan.\n例: 早く寝るようにしている。', 1),
  E(4, '〜ばかり', '〜ばかり', 'hanya / terus-menerus', 'Menyatakan kebiasaan berlebihan atau hal yang baru selesai.\n例: 遊んでばかりいる。', 1),

  // Pelajaran 2 — sebab-akibat & kondisi
  E(5, '〜ために', '〜ために', 'karena / demi', 'Menyatakan sebab atau tujuan.\n例: 試験のために勉強する。', 2),
  E(6, '〜ように', '〜ように', 'agar / supaya', 'Menyatakan tujuan (dengan bentuk kamus/negatif).\n例: 忘れないようにメモする。', 2),
  E(7, '〜おかげで', '〜おかげで', 'berkat...', 'Sebab yang membawa hasil baik.\n例: 先生のおかげで合格した。', 2),
  E(8, '〜せいで', '〜せいで', 'gara-gara...', 'Sebab yang membawa hasil buruk.\n例: 雨のせいで遅れた。', 2),
  E(9, '〜たびに', '〜たびに', 'setiap kali...', 'Menyatakan hal yang berulang tiap kali sesuatu terjadi.\n例: 会うたびに大きくなる。', 2),

  // Pelajaran 3 — perbandingan & pengandaian
  E(10, '〜たとえ〜ても', 'たとえ〜ても', 'walaupun...', 'Pengandaian yang menegaskan tidak terpengaruh.\n例: たとえ雨でも行く。', 3),
  E(11, '〜として', '〜として', 'sebagai...', 'Menyatakan peran/kapasitas.\n例: 彼は先生として働く。', 3),
  E(12, '〜によって', '〜によって', 'bergantung pada / oleh', 'Variasi, pelaku pasif, atau sebab.\n例: 人によって違う。', 3),
  E(13, '〜わりに', '〜わりに', 'padahal / relatif', 'Harapan tidak sesuai dengan kenyataan.\n例: 安いわりに美味しい。', 3),
  E(14, '〜みたいだ', '〜みたいだ', 'seperti / sepertinya', 'Perumpamaan atau dugaan (kasual).\n例: 彼は子どもみたいだ。', 3),
]
