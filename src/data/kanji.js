// Kanji — huruf kanji dasar JFT-A2.
// { id, front, reading, backShort, backFull, group, groupLabel }

const G = (group, groupLabel) => ({ group, groupLabel })

export const KANJI = [
  // Angka
  { id: 'kan-1', front: '一', reading: 'いち / ひと', backShort: 'satu', backFull: `Bilangan satu. Goresan tunggal.`, ...G('kazu', 'Angka') },
  { id: 'kan-2', front: '二', reading: 'に / ふた', backShort: 'dua', backFull: `Bilangan dua.`, ...G('kazu', 'Angka') },
  { id: 'kan-3', front: '三', reading: 'さん / みっ', backShort: 'tiga', backFull: `Bilangan tiga.`, ...G('kazu', 'Angka') },
  { id: 'kan-4', front: '四', reading: 'よん / し / よっ', backShort: 'empat', backFull: `Bilangan empat.`, ...G('kazu', 'Angka') },
  { id: 'kan-5', front: '五', reading: 'ご / いつ', backShort: 'lima', backFull: `Bilangan lima.`, ...G('kazu', 'Angka') },
  { id: 'kan-6', front: '六', reading: 'ろく / むっ', backShort: 'enam', backFull: `Bilangan enam.`, ...G('kazu', 'Angka') },
  { id: 'kan-7', front: '七', reading: 'なな / しち', backShort: 'tujuh', backFull: `Bilangan tujuh.`, ...G('kazu', 'Angka') },
  { id: 'kan-8', front: '八', reading: 'はち / やっ', backShort: 'delapan', backFull: `Bilangan delapan.`, ...G('kazu', 'Angka') },
  { id: 'kan-9', front: '九', reading: 'きゅう / ここの', backShort: 'sembilan', backFull: `Bilangan sembilan.`, ...G('kazu', 'Angka') },
  { id: 'kan-10', front: '十', reading: 'じゅう / とお', backShort: 'sepuluh', backFull: `Bilangan sepuluh.`, ...G('kazu', 'Angka') },
  { id: 'kan-11', front: '百', reading: 'ひゃく', backShort: 'ratus', backFull: `Seratus.`, ...G('kazu', 'Angka') },
  { id: 'kan-12', front: '千', reading: 'せん', backShort: 'seribu', backFull: `Seribu.`, ...G('kazu', 'Angka') },
  { id: 'kan-13', front: '万', reading: 'まん', backShort: 'sepuluh ribu', backFull: `Man (10.000).`, ...G('kazu', 'Angka') },
  { id: 'kan-14', front: '円', reading: 'えん', backShort: 'yen', backFull: `Mata uang Jepang.`, ...G('kazu', 'Angka') },

  // Hari & waktu
  { id: 'kan-20', front: '日', reading: 'にち / ひ', backShort: 'hari, matahari', backFull: `Hari/matahari.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-21', front: '月', reading: 'げつ / つき', backShort: 'bulan, senin', backFull: `Bulan (benda langit & bulan takwim).`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-22', front: '火', reading: 'か / ひ', backShort: 'api, selasa', backFull: `Api.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-23', front: '水', reading: 'すい / みず', backShort: 'air, rabu', backFull: `Air.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-24', front: '木', reading: 'もく / き', backShort: 'pohon, kamis', backFull: `Pohon/kayu.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-25', front: '金', reading: 'きん / かね', backShort: 'emas, jumat', backFull: `Emas, logam, uang.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-26', front: '土', reading: 'ど / つち', backShort: 'tanah, sabtu', backFull: `Tanah.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-27', front: '年', reading: 'ねん / とし', backShort: 'tahun', backFull: `Tahun, umur.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-28', front: '時', reading: 'じ / とき', backShort: 'jam', backFull: `Jam, waktu.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-29', front: '分', reading: 'ふん / わ', backShort: 'menit', backFull: `Menit, bagian.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-30', front: '午', reading: 'ご', backShort: 'siang', backFull: `Tengah (午前 am, 午後 pm).`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-31', front: '前', reading: 'ぜん / まえ', backShort: 'depan, sebelum', backFull: `Sebelum/di depan.`, ...G('jikan', 'Hari & Waktu') },
  { id: 'kan-32', front: '後', reading: 'ご / あと', backShort: 'belakang, sesudah', backFull: `Sesudah/di belakang.`, ...G('jikan', 'Hari & Waktu') },

  // Orang & keluarga
  { id: 'kan-40', front: '人', reading: 'じん / ひと', backShort: 'orang', backFull: `Orang.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-41', front: '男', reading: 'だん / おとこ', backShort: 'laki-laki', backFull: `Laki-laki.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-42', front: '女', reading: 'じょ / おんな', backShort: 'perempuan', backFull: `Perempuan.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-43', front: '子', reading: 'し / こ', backShort: 'anak', backFull: `Anak.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-44', front: '母', reading: 'ぼ / はは', backShort: 'ibu', backFull: `Ibu.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-45', front: '父', reading: 'ふ / ちち', backShort: 'ayah', backFull: `Ayah.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-46', front: '友', reading: 'ゆう / とも', backShort: 'teman', backFull: `Teman.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-47', front: '先', reading: 'せん', backShort: 'sebelum, senior', backFull: `Senior, sebelumnya.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-48', front: '生', reading: 'せい / い', backShort: 'hidup, pelajar', backFull: `Hidup; akhiran pelajar.`, ...G('jin', 'Orang & Keluarga') },
  { id: 'kan-49', front: '学', reading: 'がく / まな', backShort: 'belajar', backFull: `Belajar.`, ...G('jin', 'Orang & Keluarga') },

  // Tempat
  { id: 'kan-60', front: '上', reading: 'じょう / うえ', backShort: 'atas', backFull: `Atas.`, ...G('basho', 'Tempat') },
  { id: 'kan-61', front: '下', reading: 'か / した', backShort: 'bawah', backFull: `Bawah.`, ...G('basho', 'Tempat') },
  { id: 'kan-62', front: '中', reading: 'ちゅう / なか', backShort: 'tengah, dalam', backFull: `Dalam/tengah.`, ...G('basho', 'Tempat') },
  { id: 'kan-63', front: '外', reading: 'がい / そと', backShort: 'luar', backFull: `Luar.`, ...G('basho', 'Tempat') },
  { id: 'kan-64', front: '東', reading: 'とう / ひがし', backShort: 'timur', backFull: `Timur.`, ...G('basho', 'Tempat') },
  { id: 'kan-65', front: '西', reading: 'せい / にし', backShort: 'barat', backFull: `Barat.`, ...G('basho', 'Tempat') },
  { id: 'kan-66', front: '南', reading: 'なん / みなみ', backShort: 'selatan', backFull: `Selatan.`, ...G('basho', 'Tempat') },
  { id: 'kan-67', front: '北', reading: 'ほく / きた', backShort: 'utara', backFull: `Utara.`, ...G('basho', 'Tempat') },
  { id: 'kan-68', front: '山', reading: 'さん / やま', backShort: 'gunung', backFull: `Gunung.`, ...G('basho', 'Tempat') },
  { id: 'kan-69', front: '川', reading: 'せん / かわ', backShort: 'sungai', backFull: `Sungai.`, ...G('basho', 'Tempat') },
  { id: 'kan-70', front: '田', reading: 'でん / た', backShort: 'sawah', backFull: `Sawah.`, ...G('basho', 'Tempat') },
  { id: 'kan-71', front: '学校', reading: 'がっこう', backShort: 'sekolah', backFull: `Sekolah.`, ...G('basho', 'Tempat') },
  { id: 'kan-72', front: '会社', reading: 'かいしゃ', backShort: 'perusahaan', backFull: `Kantor/perusahaan.`, ...G('basho', 'Tempat') },
  { id: 'kan-73', front: '駅', reading: 'えき', backShort: 'stasiun', backFull: `Stasiun.`, ...G('basho', 'Tempat') },
  { id: 'kan-74', front: '店', reading: 'てん / みせ', backShort: 'toko', backFull: `Toko.`, ...G('basho', 'Tempat') },
  { id: 'kan-75', front: '国', reading: 'こく / くに', backShort: 'negara', backFull: `Negara.`, ...G('basho', 'Tempat') },

  // Kata kerja & kata sifat inti
  { id: 'kan-90', front: '行', reading: 'こう / い', backShort: 'pergi', backFull: `Pergi (行く = いく).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-91', front: '食', reading: 'しょく / た', backShort: 'makan', backFull: `Makan (食べる).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-92', front: '飲', reading: 'いん / の', backShort: 'minum', backFull: `Minum (飲む).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-93', front: '見', reading: 'けん / み', backShort: 'melihat', backFull: `Melihat (見る).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-94', front: '聞', reading: 'ぶん / き', backShort: 'mendengar', backFull: `Mendengar (聞く).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-95', front: '買', reading: 'ばい / か', backShort: 'membeli', backFull: `Membeli (買う).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-96', front: '読', reading: 'どく / よ', backShort: 'membaca', backFull: `Membaca (読む).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-97', front: '書', reading: 'しょ / か', backShort: 'menulis', backFull: `Menulis (書く).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-98', front: '話', reading: 'わ / はな', backShort: 'bicara', backFull: `Berbicara (話す).`, ...G('doshi', 'Kata Kerja') },
  { id: 'kan-99', front: '大', reading: 'だい / おお', backShort: 'besar', backFull: `Besar (大きい).`, ...G('keiyoshi', 'Kata Sifat') },
  { id: 'kan-100', front: '小', reading: 'しょう / ちい', backShort: 'kecil', backFull: `Kecil (小さい).`, ...G('keiyoshi', 'Kata Sifat') },
  { id: 'kan-101', front: '高', reading: 'こう / たか', backShort: 'tinggi/mahal', backFull: `Tinggi/mahal (高い).`, ...G('keiyoshi', 'Kata Sifat') },
  { id: 'kan-102', front: '安', reading: 'あん / やす', backShort: 'murah', backFull: `Murah (安い).`, ...G('keiyoshi', 'Kata Sifat') },
  { id: 'kan-103', front: '新', reading: 'しん / あたら', backShort: 'baru', backFull: `Baru (新しい).`, ...G('keiyoshi', 'Kata Sifat') },
  { id: 'kan-104', front: '古', reading: 'こ / ふる', backShort: 'lama/kuno', backFull: `Lama (古い).`, ...G('keiyoshi', 'Kata Sifat') },
  { id: 'kan-105', front: '好', reading: 'こう / す', backShort: 'suka', backFull: `Suka (好き).`, ...G('keiyoshi', 'Kata Sifat') },
  { id: 'kan-106', front: '休', reading: 'きゅう / やす', backShort: 'istirahat', backFull: `Istirahat (休む).`, ...G('kado', 'Kata Kerja & Sifat') },

  // Bahasa & umum
  { id: 'kan-120', front: '日本語', reading: 'にほんご', backShort: 'bahasa Jepang', backFull: `Bahasa Jepang.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-121', front: '英語', reading: 'えいご', backShort: 'bahasa Inggris', backFull: `Bahasa Inggris.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-122', front: '語', reading: 'ご', backShort: 'bahasa', backFull: `Akhiran bahasa/kata.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-123', front: '本', reading: 'ほん', backShort: 'buku', backFull: `Buku.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-124', front: '今', reading: 'こん / いま', backShort: 'sekarang', backFull: `Sekarang.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-125', front: '天気', reading: 'てんき', backShort: 'cuaca', backFull: `Cuaca.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-126', front: '電車', reading: 'でんしゃ', backShort: 'kereta', backFull: `Kereta listrik.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-127', front: '元気', reading: 'げんき', backShort: 'sehat, semangat', backFull: `Sehat/baik-baik saja.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-128', front: '料理', reading: 'りょうり', backShort: 'masakan', backFull: `Masakan/memasak.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-129', front: '映画', reading: 'えいが', backShort: 'film', backFull: `Film.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-130', front: '音', reading: 'おん / おと', backShort: 'suara', backFull: `Suara/bunyi.`, ...G('gengo', 'Bahasa & Umum') },
  { id: 'kan-131', front: '言', reading: 'げん / い', backShort: 'kata, berkata', backFull: `Berkata.`, ...G('gengo', 'Bahasa & Umum') },
]

export default KANJI