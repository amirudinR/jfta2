// Konversi kana → romaji (port dari HTML asli).
// Mendukung digraph (きゃ=kya), sokuon (っ pengganda), chouon (ー), dan n.

const DIGRAPH = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', きぇ: 'kye',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho', しぇ: 'she',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', ちぇ: 'che',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo', じぇ: 'je',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
  うぃ: 'wi', うぇ: 'we', いぇ: 'ye',
  てぃ: 'ti', てゅ: 'tyu', でぃ: 'di', でゅ: 'dyu',
  とぅ: 'tu', どぅ: 'du', うぁ: 'wa',
  つぁ: 'tsa', つぃ: 'tsi', つぇ: 'tse', つぉ: 'tso',
  くぁ: 'kwa', くぃ: 'kwi', くぇ: 'kwe', くぉ: 'kwo',
  ぐぁ: 'gwa', ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo',
}

const KANA = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', ゐ: 'wi', ゑ: 'we', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ゔ: 'vu',
}

// Katakana → hiragana (kode 0x30A1–0x30F6 digeser 0x60).
function toHiragana(str) {
  let out = ''
  for (const ch of str) {
    const c = ch.charCodeAt(0)
    out += c >= 0x30a1 && c <= 0x30f6 ? String.fromCharCode(c - 0x60) : ch
  }
  return out
}

function chunkAt(s, i) {
  const two = s.slice(i, i + 2)
  if (DIGRAPH[two]) return DIGRAPH[two]
  return KANA[s[i]] || null
}

export function kanaToRomaji(input) {
  if (!input) return ''
  const s = toHiragana(String(input))
  let out = ''
  for (let i = 0; i < s.length; i++) {
    if (s[i] === 'っ') {
      const next = chunkAt(s, i + 1)
      if (next) out += next[0]
      continue
    }
    if (s[i] === 'ー') {
      const m = out.match(/[aeiou]$/)
      if (m) out += m[0]
      continue
    }
    const two = s.slice(i, i + 2)
    if (DIGRAPH[two]) {
      out += DIGRAPH[two]
      i++
      continue
    }
    if (KANA[s[i]]) {
      out += KANA[s[i]]
      continue
    }
    out += s[i]
  }
  return out
}
