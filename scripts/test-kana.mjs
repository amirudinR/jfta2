import { kanaToRomaji } from '../src/lib/kana.js'

const cases = [
  ['きょう', 'kyou'],
  ['ちょっと', 'chotto'],
  ['しんぶん', 'shinbun'],
  ['カタカナ', 'katakana'],
  ['がっこう', 'gakkou'],
  ['あ', 'a'],
  ['ジュース', 'juusu'],
  ['でんしゃ', 'densha'],
  ['こんにちは', 'konnichiha'],
  ['ありがとう', 'arigatou'],
  ['ぜんぶ', 'zenbu'],
  ['ひゃく', 'hyaku'],
]

let fail = 0
for (const [input, want] of cases) {
  const got = kanaToRomaji(input)
  if (got !== want) {
    fail++
    console.log(`FAIL ${input} → ${got} (harusnya ${want})`)
  }
}
console.log(fail === 0 ? `OK — semua ${cases.length} kasus lolos` : `${fail} kasus gagal`)
process.exit(fail === 0 ? 0 : 1)
