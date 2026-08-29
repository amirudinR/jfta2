// Bunpo A2 — tata bahasa JFT-Basic.
// { id, front, backShort, backFull, group, groupLabel, example }

const G = (group, groupLabel) => ({ group, groupLabel })

export const BUNPO = [
  // Partikel inti
  { id: 'bun-1', front: 'は', backShort: 'Penanda topik', backFull: `Menandai topik kalimat. わたしは〜 = "Saya (sebagai topik)".`, example: 'わたしはがくせいです。', ...G('partikel', 'Partikel') },
  { id: 'bun-2', front: 'が', backShort: 'Penanda subjek', backFull: `Menandai subjek, terutama pertanyaan & hal baru.`, example: 'ねこがいます。', ...G('partikel', 'Partikel') },
  { id: 'bun-3', front: 'を', backShort: 'Penanda objek', backFull: `Menandai objek dari kata kerja transitif.`, example: 'ほんをよみます。', ...G('partikel', 'Partikel') },
  { id: 'bun-4', front: 'に', backShort: 'Waktu/tempat/arah/tujuan', backFull: `Menandai titik waktu, keberadaan, arah, atau penerima.`, example: '７じにおきます。', ...G('partikel', 'Partikel') },
  { id: 'bun-5', front: 'で', backShort: 'Tempat & alat', backFull: `Menandai tempat aksi atau alat/cara.`, example: 'がっこうでべんきょうします。', ...G('partikel', 'Partikel') },
  { id: 'bun-6', front: 'へ', backShort: 'Penanda arah', backFull: `Menandai arah tujuan (dibaca え).`, example: 'えきへいきます。', ...G('partikel', 'Partikel') },
  { id: 'bun-7', front: 'と', backShort: 'Dengan (teman)/dan', backFull: `"Dengan" seseorang atau "dan" (penghubung).`, example: 'ともだちとあそびます。', ...G('partikel', 'Partikel') },
  { id: 'bun-8', front: 'から・まで', backShort: 'Dari ... sampai ...', backFull: `Batas mulai dan akhir (waktu/tempat).`, example: 'くじから５じまではたらきます。', ...G('partikel', 'Partikel') },

  // Kalimat dasar
  { id: 'bun-20', front: '〜です', backShort: 'Pernyataan sopan (nominal)', backFull: `Pola predikat nominal "adalah".`, example: 'わたしはインドネシアじんです。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-21', front: '〜じゃないです', backShort: 'Negasi nominal', backFull: `"Bukan ...". Menolak bentuk です.`, example: 'きょうはげつようびじゃないです。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-22', front: '〜があります', backShort: 'Ada (benda mati)', backFull: `Keberadaan benda mati/tumbuhan.`, example: 'へやにつくえがあります。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-23', front: '〜がいます', backShort: 'Ada (makhluk hidup)', backFull: `Keberadaan orang/hewan.`, example: 'きょうしつにせんせいがいます。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-24', front: '〜ります（動詞）', backShort: 'Bentuk sopan kata kerja', backFull: `Bentuk -ます. たべる→たべます.`, example: 'すしをたべます。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-25', front: '〜ました', backShort: 'Lampau sopan', backFull: `Bentuk lampau. たべます→たべました.`, example: 'きのう えいがを みました。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-26', front: '〜ません', backShort: 'Negasi sopan', backFull: `Bentuk negatif sekarang.`, example: 'あさごはんをたべません。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-27', front: '〜ませんでした', backShort: 'Negasi lampau', backFull: `Bentuk negatif lampau.`, example: 'せんしゅう はたらきませんでした。', ...G('dasar', 'Kalimat Dasar') },
  { id: 'bun-28', front: '〜ましょう', backShort: 'Ajak (yuk)', backFull: `Mengajak: "mari ...".`, example: 'いっしょに いきましょう。', ...G('dasar', 'Kalimat Dasar') },

  // Katakata sifat
  { id: 'bun-40', front: '〜い です', backShort: 'Sifat -i bentuk sopan', backFull: `Kata sifat -i + です.`, example: 'このほんはたかいです。', ...G('kei', 'Kata Sifat') },
  { id: 'bun-41', front: '〜くないです', backShort: 'Negasi sifat -i', backFull: `たかい→たかくないです.`, example: 'このみせはたかくないです。', ...G('kei', 'Kata Sifat') },
  { id: 'bun-42', front: '〜な です', backShort: 'Sifat -na bentuk sopan', backFull: `Sifat -na + です.`, example: 'ここはしずかです。', ...G('kei', 'Kata Sifat') },
  { id: 'bun-43', front: '〜好きです', backShort: 'Suka akan ...', backFull: `〜がすきです = "suka ...".`, example: 'おんがくがすきです。', ...G('kei', 'Kata Sifat') },

  // Tanya
  { id: 'bun-60', front: '〜か', backShort: 'Partikel tanya', backFull: `Di akhir kalimat mengubah jadi pertanyaan ya/tidak.`, example: 'にほんじんですか。', ...G('tanya', 'Kalimat Tanya') },
  { id: 'bun-61', front: 'なに / なん', backShort: 'apa', backFull: `Kata tanya "apa".`, example: 'それはなんですか。', ...G('tanya', 'Kalimat Tanya') },
  { id: 'bun-62', front: 'どこ', backShort: 'di mana', backFull: `Kata tanya "di mana".`, example: 'トイレはどこですか。', ...G('tanya', 'Kalimat Tanya') },
  { id: 'bun-63', front: 'いつ', backShort: 'kapan', backFull: `Kata tanya "kapan".`, example: 'いつ にほんへ いきますか。', ...G('tanya', 'Kalimat Tanya') },
  { id: 'bun-64', front: 'だれ', backShort: 'siapa', backFull: `Kata tanya "siapa".`, example: 'あのひとは だれですか。', ...G('tanya', 'Kalimat Tanya') },
  { id: 'bun-65', front: 'なぜ', backShort: 'mengapa', backFull: `Kata tanya "mengapa" (formal).`, example: 'なぜ おくれたんですか。', ...G('tanya', 'Kalimat Tanya') },

  // Kegiatan & nuansa
  { id: 'bun-80', front: '〜ている', backShort: 'Sedang/kebiasaan', backFull: `Bentuk progresif atau keadaan hasil.`, example: 'いま ほんをよんでいます。', ...G('kegiatan', 'Kegiatan & Nuansa') },
  { id: 'bun-81', front: '〜てください', backShort: 'Tolong (perintah sopan)', backFull: `Permintaan sopan.`, example: 'まってください。', ...G('kegiatan', 'Kegiatan & Nuansa') },
  { id: 'bun-82', front: '〜ないでください', backShort: 'Tolong jangan ...', backFull: `Larangan sopan.`, example: 'ここで たばこを すわないでください。', ...G('kegiatan', 'Kegiatan & Nuansa') },
  { id: 'bun-83', front: '〜たい', backShort: 'Ingin (melakukan)', backFull: `Menyatakan keinginan melakukan.`, example: 'にほんへ いきたいです。', ...G('kegiatan', 'Kegiatan & Nuansa') },
  { id: 'bun-84', front: '〜ましょうか', backShort: 'Tawaran bantuan', backFull: `"Boleh saya bantu?"`, example: 'てつだいましょうか。', ...G('kegiatan', 'Kegiatan & Nuansa') },
  { id: 'bun-85', front: '〜てもいいですか', backShort: 'Bolehkah ...?', backFull: `Meminta izin.`, example: 'ここにすわってもいいですか。', ...G('kegiatan', 'Kegiatan & Nuansa') },
  { id: 'bun-86', front: '〜てはいけません', backShort: 'Tidak boleh ...', backFull: `Larangan keras.`, example: 'ここで しゃしんをとってはいけません。', ...G('kegiatan', 'Kegiatan & Nuansa') },
  { id: 'bun-87', front: '〜が あります', backShort: 'Ada pengalaman/kesempatan', backFull: `Menyatakan ada kegiatan 〜 (biasa dalam 〜たごとがあります).`, example: 'つごうが あります。', ...G('kegiatan', 'Kegiatan & Nuansa') },
]

export default BUNPO