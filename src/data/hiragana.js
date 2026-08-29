// Hiragana dataset. Entry schema:
// { id, front, frontSub, backShort, backFull, group, groupLabel, reading? }

const G = (group, groupLabel) => ({ group, groupLabel })

export const HIRAGANA = [
  // Gojūon dasar
  ...['あ', 'い', 'う', 'え', 'お'].map((k, i) => ({ id: `h-${i + 1}`, front: k, backShort: ['a', 'i', 'u', 'e', 'o'][i], backFull: `Bunyi /a/. Keluarga vokal A.`, ...G('a', 'Vokal') })),
  ...['か', 'き', 'く', 'け', 'こ'].map((k, i) => ({ id: `h-k${i + 1}`, front: k, backShort: ['ka', 'ki', 'ku', 'ke', 'ko'][i], backFull: `Konsonan K + vokal.`, ...G('k', 'K-gyo') })),
  ...['さ', 'し', 'す', 'せ', 'そ'].map((k, i) => ({ id: `h-s${i + 1}`, front: k, backShort: ['sa', 'shi', 'su', 'se', 'so'][i], backFull: `Konsonan S. 「し」 berbunyi "shi".`, ...G('s', 'S-gyo') })),
  ...['た', 'ち', 'つ', 'て', 'と'].map((k, i) => ({ id: `h-t${i + 1}`, front: k, backShort: ['ta', 'chi', 'tsu', 'te', 'to'][i], backFull: `Konsonan T. 「ち」=chi, 「つ」=tsu.`, ...G('t', 'T-gyo') })),
  ...['な', 'に', 'ぬ', 'ね', 'の'].map((k, i) => ({ id: `h-n${i + 1}`, front: k, backShort: ['na', 'ni', 'nu', 'ne', 'no'][i], backFull: `Konsonan N.`, ...G('n', 'N-gyo') })),
  ...['は', 'ひ', 'ふ', 'へ', 'ほ'].map((k, i) => ({ id: `h-h${i + 1}`, front: k, backShort: ['ha', 'hi', 'fu', 'he', 'ho'][i], backFull: `Konsonan H. 「ふ」=fu (u bibir rata).`, ...G('h', 'H-gyo') })),
  ...['ま', 'み', 'む', 'め', 'も'].map((k, i) => ({ id: `h-m${i + 1}`, front: k, backShort: ['ma', 'mi', 'mu', 'me', 'mo'][i], backFull: `Konsonan M.`, ...G('m', 'M-gyo') })),
  ...['や', 'ゆ', 'よ'].map((k, i) => ({ id: `h-y${i + 1}`, front: k, backShort: ['ya', 'yu', 'yo'][i], backFull: `Konsonan Y.`, ...G('y', 'Y-gyo') })),
  ...['ら', 'り', 'る', 'れ', 'ろ'].map((k, i) => ({ id: `h-r${i + 1}`, front: k, backShort: ['ra', 'ri', 'ru', 're', 'ro'][i], backFull: `Konsonan R (dibunyikan antara R-L).`, ...G('r', 'R-gyo') })),
  ...['わ', 'を'].map((k, i) => ({ id: `h-w${i + 1}`, front: k, backShort: ['wa', 'o'][i], backFull: `Konsonan W. 「を」dibaca "o" (tanda objek).`, ...G('w', 'W-gyo') })),
  { id: 'h-n-1', front: 'ん', backShort: 'n', backFull: `Nasal "n" di akhir suku kata.`, ...G('w', 'W-gyo') },

  // Dakuten & handakuten
  ...['が', 'ぎ', 'ぐ', 'げ', 'ご'].map((k, i) => ({ id: `h-g${i + 1}`, front: k, backShort: ['ga', 'gi', 'gu', 'ge', 'go'][i], backFull: `K / dakuten → G.`, ...G('g', 'Dakuten G') })),
  ...['ざ', 'じ', 'ず', 'ぜ', 'ぞ'].map((k, i) => ({ id: `h-z${i + 1}`, front: k, backShort: ['za', 'ji', 'zu', 'ze', 'zo'][i], backFull: `S / dakuten → Z. 「じ」=ji, 「ず」=zu.`, ...G('z', 'Dakuten Z') })),
  ...['だ', 'ぢ', 'づ', 'で', 'ど'].map((k, i) => ({ id: `h-d${i + 1}`, front: k, backShort: ['da', 'ji', 'zu', 'de', 'do'][i], backFull: `T / dakuten → D.`, ...G('d', 'Dakuten D') })),
  ...['ば', 'び', 'ぶ', 'べ', 'ぼ'].map((k, i) => ({ id: `h-b${i + 1}`, front: k, backShort: ['ba', 'bi', 'bu', 'be', 'bo'][i], backFull: `H / dakuten → B.`, ...G('b', 'Dakuten B') })),
  ...['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'].map((k, i) => ({ id: `h-p${i + 1}`, front: k, backShort: ['pa', 'pi', 'pu', 'pe', 'po'][i], backFull: `H / handakuten → P.`, ...G('p', 'Handakuten P') })),

  // Yōon
  ...['きゃ', 'きゅ', 'きょ'].map((k, i) => ({ id: `h-ky${i + 1}`, front: k, backShort: ['kya', 'kyu', 'kyo'][i], backFull: `き + ゃ/ゅ/ょ.`, ...G('yoon', 'Yōon') })),
  ...['しゃ', 'しゅ', 'しょ'].map((k, i) => ({ id: `h-shy${i + 1}`, front: k, backShort: ['sha', 'shu', 'sho'][i], backFull: `し + ゃ/ゅ/ょ.`, ...G('yoon', 'Yōon') })),
  ...['ちゃ', 'ちゅ', 'ちょ'].map((k, i) => ({ id: `h-chy${i + 1}`, front: k, backShort: ['cha', 'chu', 'cho'][i], backFull: `ち + ゃ/ゅ/ょ.`, ...G('yoon', 'Yōon') })),
  ...['にゃ', 'にゅ', 'にょ'].map((k, i) => ({ id: `h-ny${i + 1}`, front: k, backShort: ['nya', 'nyu', 'nyo'][i], backFull: `に + ゃ/ゅ/ょ.`, ...G('yoon', 'Yōon') })),
  ...['ひゃ', 'ひゅ', 'ひょ'].map((k, i) => ({ id: `h-hy${i + 1}`, front: k, backShort: ['hya', 'hyu', 'hyo'][i], backFull: `ひ + ゃ/ゅ/ょ.`, ...G('yoon', 'Yōon') })),
  ...['みゃ', 'みゅ', 'みょ'].map((k, i) => ({ id: `h-my${i + 1}`, front: k, backShort: ['mya', 'myu', 'myo'][i], backFull: `み + ゃ/ゅ/ょ.`, ...G('yoon', 'Yōon') })),
  ...['りゃ', 'りゅ', 'りょ'].map((k, i) => ({ id: `h-ry${i + 1}`, front: k, backShort: ['rya', 'ryu', 'ryo'][i], backFull: `り + ゃ/ゅ/ょ.`, ...G('yoon', 'Yōon') })),
  ...['ぎゃ', 'ぎゅ', 'ぎょ'].map((k, i) => ({ id: `h-gy${i + 1}`, front: k, backShort: ['gya', 'gyu', 'gyo'][i], backFull: `ぎ + ゃ/ゅ/ょ.`, ...G('yoon-d', 'Yōon Dakuten') })),
  ...['じゃ', 'じゅ', 'じょ'].map((k, i) => ({ id: `h-jy${i + 1}`, front: k, backShort: ['ja', 'ju', 'jo'][i], backFull: `じ + ゃ/ゅ/ょ.`, ...G('yoon-d', 'Yōon Dakuten') })),
  ...['びゃ', 'びゅ', 'びょ'].map((k, i) => ({ id: `h-by${i + 1}`, front: k, backShort: ['bya', 'byu', 'byo'][i], backFull: `び + ゃ/ゅ/ょ.`, ...G('yoon-d', 'Yōon Dakuten') })),
  ...['ぴゃ', 'ぴゅ', 'ぴょ'].map((k, i) => ({ id: `h-py${i + 1}`, front: k, backShort: ['pya', 'pyu', 'pyo'][i], backFull: `ぴ + ゃ/ゅ/ょ.`, ...G('yoon-p', 'Yōon Handakuten') })),
]

export default HIRAGANA