// Hapus entri filler "(lihat …)" di kanji.js lalu renumber id berurutan.
import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('../src/data/kanji.js', import.meta.url)
let src = readFileSync(path, 'utf8')

const before = [...src.matchAll(/E\(\d+,/g)].length
const lines = src.split('\n').filter((l) => !/lihat|lihat /.test(l))
src = lines.join('\n')

let n = 0
src = src.replace(/E\(\d+,/g, () => `E(${n++},`)

const after = [...src.matchAll(/E\(\d+,/g)].length
writeFileSync(path, src)
console.log(`sebelum: ${before} · filler dihapus: ${before - after} · sesudah: ${after}`)
