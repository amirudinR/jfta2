// Normalisasi id E(...) di kotoba.js → berurutan mulai 0.
import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('../src/data/kotoba.js', import.meta.url)
let src = readFileSync(path, 'utf8')

let n = 0
src = src.replace(/E\(\d+,/g, () => `E(${n++},`)

const ids = [...src.matchAll(/E\(\d+,/g)].map((m) => Number(m[0].slice(2)))
const dups = ids.filter((v, i) => ids.indexOf(v) !== i)

writeFileSync(path, src)
console.log(`total: ${n} · dup: ${JSON.stringify(dups)}`)
