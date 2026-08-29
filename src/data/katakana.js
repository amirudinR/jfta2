// Katakana dataset.

const G = (group, groupLabel) => ({ group, groupLabel })

export const KATAKANA = [
  ...['ア', 'イ', 'ウ', 'エ', 'オ'].map((k, i) => ({ id: `k-${i + 1}`, front: k, backShort: ['a', 'i', 'u', 'e', 'o'][i], backFull: `Bunyi /a/. Dipakai untuk kata serapan.`, ...G('a', 'Vokal') })),
  ...['カ', 'キ', 'ク', 'ケ', 'コ'].map((k, i) => ({ id: `k-k${i + 1}`, front: k, backShort: ['ka', 'ki', 'ku', 'ke', 'ko'][i], backFull: `Konsonan K + vokal.`, ...G('k', 'K-gyo') })),
  ...['サ', 'シ', 'ス', 'セ', 'ソ'].map((k, i) => ({ id: `k-s${i + 1}`, front: k, backShort: ['sa', 'shi', 'su', 'se', 'so'][i], backFull: `Konsonan S. 「シ」berbunyi "shi".`, ...G('s', 'S-gyo') })),
  ...['タ', 'チ', 'ツ', 'テ', 'ト'].map((k, i) => ({ id: `k-t${i + 1}`, front: k, backShort: ['ta', 'chi', 'tsu', 'te', 'to'][i], backFull: `Konsonan T. 「チ」=chi, 「ツ」=tsu.`, ...G('t', 'T-gyo') })),
  ...['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'].map((k, i) => ({ id: `k-n${i + 1}`, front: k, backShort: ['na', 'ni', 'nu', 'ne', 'no'][i], backFull: `Konsonan N.`, ...G('n', 'N-gyo') })),
  ...['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'].map((k, i) => ({ id: `k-h${i + 1}`, front: k, backShort: ['ha', 'hi', 'fu', 'he', 'ho'][i], backFull: `Konsonan H. 「フ」=fu.`, ...G('h', 'H-gyo') })),
  ...['マ', 'ミ', 'ム', 'メ', 'モ'].map((k, i) => ({ id: `k-m${i + 1}`, front: k, backShort: ['ma', 'mi', 'mu', 'me', 'mo'][i], backFull: `Konsonan M.`, ...G('m', 'M-gyo') })),
  ...['ヤ', 'ユ', 'ヨ'].map((k, i) => ({ id: `k-y${i + 1}`, front: k, backShort: ['ya', 'yu', 'yo'][i], backFull: `Konsonan Y.`, ...G('y', 'Y-gyo') })),
  ...['ラ', 'リ', 'ル', 'レ', 'ロ'].map((k, i) => ({ id: `k-r${i + 1}`, front: k, backShort: ['ra', 'ri', 'ru', 're', 'ro'][i], backFull: `Konsonan R.`, ...G('r', 'R-gyo') })),
  ...['ワ', 'ヲ'].map((k, i) => ({ id: `k-w${i + 1}`, front: k, backShort: ['wa', 'o'][i], backFull: `Konsonan W.`, ...G('w', 'W-gyo') })),
  { id: 'k-n-1', front: 'ン', backShort: 'n', backFull: `Nasal "n".`, ...G('w', 'W-gyo') },

  ...['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'].map((k, i) => ({ id: `k-g${i + 1}`, front: k, backShort: ['ga', 'gi', 'gu', 'ge', 'go'][i], backFull: `K / dakuten → G.`, ...G('g', 'Dakuten G') })),
  ...['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'].map((k, i) => ({ id: `k-z${i + 1}`, front: k, backShort: ['za', 'ji', 'zu', 'ze', 'zo'][i], backFull: `S / dakuten → Z.`, ...G('z', 'Dakuten Z') })),
  ...['ダ', 'ヂ', 'ヅ', 'デ', 'ド'].map((k, i) => ({ id: `k-d${i + 1}`, front: k, backShort: ['da', 'ji', 'zu', 'de', 'do'][i], backFull: `T / dakuten → D.`, ...G('d', 'Dakuten D') })),
  ...['バ', 'ビ', 'ブ', 'ベ', 'ボ'].map((k, i) => ({ id: `k-b${i + 1}`, front: k, backShort: ['ba', 'bi', 'bu', 'be', 'bo'][i], backFull: `H / dakuten → B.`, ...G('b', 'Dakuten B') })),
  ...['パ', 'ピ', 'プ', 'ペ', 'ポ'].map((k, i) => ({ id: `k-p${i + 1}`, front: k, backShort: ['pa', 'pi', 'pu', 'pe', 'po'][i], backFull: `H / handakuten → P.`, ...G('p', 'Handakuten P') })),

  ...['キャ', 'キュ', 'キョ'].map((k, i) => ({ id: `k-ky${i + 1}`, front: k, backShort: ['kya', 'kyu', 'kyo'][i], backFull: `キャ + ャ/ュ/ョ.`, ...G('yoon', 'Yōon') })),
  ...['シャ', 'シュ', 'ショ'].map((k, i) => ({ id: `k-shy${i + 1}`, front: k, backShort: ['sha', 'shu', 'sho'][i], backFull: `シ + ャ/ュ/ョ.`, ...G('yoon', 'Yōon') })),
  ...['チャ', 'チュ', 'チョ'].map((k, i) => ({ id: `k-chy${i + 1}`, front: k, backShort: ['cha', 'chu', 'cho'][i], backFull: `チ + ャ/ュ/ョ.`, ...G('yoon', 'Yōon') })),
  ...['ニャ', 'ニュ', 'ニョ'].map((k, i) => ({ id: `k-ny${i + 1}`, front: k, backShort: ['nya', 'nyu', 'nyo'][i], backFull: `ニ + ャ/ュ/ョ.`, ...G('yoon', 'Yōon') })),
  ...['ヒャ', 'ヒュ', 'ヒョ'].map((k, i) => ({ id: `k-hy${i + 1}`, front: k, backShort: ['hya', 'hyu', 'hyo'][i], backFull: `ヒ + ャ/ュ/ョ.`, ...G('yoon', 'Yōon') })),
  ...['ミャ', 'ミュ', 'ミョ'].map((k, i) => ({ id: `k-my${i + 1}`, front: k, backShort: ['mya', 'myu', 'myo'][i], backFull: `ミ + ャ/ュ/ョ.`, ...G('yoon', 'Yōon') })),
  ...['リャ', 'リュ', 'リョ'].map((k, i) => ({ id: `k-ry${i + 1}`, front: k, backShort: ['rya', 'ryu', 'ryo'][i], backFull: `リ + ャ/ュ/ョ.`, ...G('yoon', 'Yōon') })),
  ...['ギャ', 'ギュ', 'ギョ'].map((k, i) => ({ id: `k-gy${i + 1}`, front: k, backShort: ['gya', 'gyu', 'gyo'][i], backFull: `ギ + ャ/ュ/ョ.`, ...G('yoon-d', 'Yōon Dakuten') })),
  ...['ジャ', 'ジュ', 'ジョ'].map((k, i) => ({ id: `k-jy${i + 1}`, front: k, backShort: ['ja', 'ju', 'jo'][i], backFull: `ジ + ャ/ュ/ョ.`, ...G('yoon-d', 'Yōon Dakuten') })),
  ...['ビャ', 'ビュ', 'ビョ'].map((k, i) => ({ id: `k-by${i + 1}`, front: k, backShort: ['bya', 'byu', 'byo'][i], backFull: `ビ + ャ/ュ/ョ.`, ...G('yoon-d', 'Yōon Dakuten') })),
  ...['ピャ', 'ピュ', 'ピョ'].map((k, i) => ({ id: `k-py${i + 1}`, front: k, backShort: ['pya', 'pyu', 'pyo'][i], backFull: `ピ + ャ/ュ/ョ.`, ...G('yoon-p', 'Yōon Handakuten') })),

  // Tanda panjang & khusus
  { id: 'k-know-1', front: 'ー', backShort: 'Tanda panjang', backFull: `Memperpanjang vokal sebelumnya (mis. コーヒー = kōhī).`, ...G('khusus', 'Khusus') },
  { id: 'k-know-2', front: 'ッ', backShort: 'Tsu kecil', backFull: `Sokuon: bunyi konsonan ganda (mis. ベッド = beddo).`, ...G('khusus', 'Khusus') },
  { id: 'k-know-3', front: 'ファ', backShort: 'fa', backFull: `フ + kecil ァ → "fa" (kata serapan).`, ...G('khusus', 'Khusus') },
  { id: 'k-know-4', front: 'ウィ', backShort: 'wi', backFull: `ウ + kecil ィ → "wi".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-5', front: 'ウェ', backShort: 'we', backFull: `ウ + kecil ェ → "we".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-6', front: 'ヴォ', backShort: 'vo', backFull: `ヴ (vu) + kecil ォ → "vo".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-7', front: 'ティ', backShort: 'ti', backFull: `テ + kecil ィ → "ti".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-8', front: 'ディ', backShort: 'di', backFull: `デ + kecil ィ → "di".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-9', front: 'ドゥ', backShort: 'du', backFull: `ド + kecil ゥ → "du".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-10', front: 'チェ', backShort: 'che', backFull: `チ + kecil ェ → "che".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-11', front: 'シェ', backShort: 'she', backFull: `シ + kecil ェ → "she".`, ...G('khusus', 'Khusus') },
  { id: 'k-know-12', front: 'ジェ', backShort: 'je', backFull: `ジ + kecil ェ → "je".`, ...G('khusus', 'Khusus') },
]

export default KATAKANA