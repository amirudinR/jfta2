// verify_lpk_sequential.mjs - bukti bahwa kartu LPK BERURUTAN sesuai nomor Word
// (No. 1 -> 613), bukan diacak.
//
// Yang diperiksa:
//   (a) kartu pertama = No.1 (kanji id 0 = 魚)
//   (b) maju N kali lewat keyboard/markup, nomor naik 1,2,3... (bukan acak)
//   (c) nomor's kanji cocok id+1 (checksum: No.7 -> 打车? cek via data)
//   (d)Deck selesai -> tombol menyebut "Ulangi dari awal", bukan "Kocok ulang"
//
// Butuh dev server hidup: BASE_URL=... node scripts/verify_lpk_sequential.mjs

import puppeteer from 'puppeteer'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const A = []
const assert = (name, ok, obs) => {
  A.push({ name, ok: !!ok })
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}  \x1a  ${obs}`)
}

// Baca label progres: "1 / 613 · No. 1"
const readPlabel = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.plabel')
    return el ? el.innerText.replace(/\s+/g, ' ').trim() : null
  })

// Baca kanji di sisi depan kartu.
const readFront = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.card-face:not(.back) .word')
    return el ? el.innerText.trim() : null
  })

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 412, height: 915 })

try {
  await page.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => localStorage.setItem('ankichou-mode', JSON.stringify('lpk')))
  await page.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
  await sleep(1500)

  // (a) kartu pertama harus No.1
  const p0 = await readPlabel(page)
  assert('Deck mulai dari No. 1', !!p0 && /^1 \/ 613 · No\. 1$/.test(p0), p0)

  const f0 = await readFront(page)
  assert('No.1 = 魚 (baris pertama Word)', f0 === '魚', `front=${f0}`)

  // (b) maju 6 kartu, nomor harus naik tepat 1 (bukan acak)
  const seq = []
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('.nav-chev')].pop()
      b?.click()
    })
    await sleep(160)
    seq.push(await readPlabel(page))
  }
  const nums = seq.map((s) => {
    const m = s && s.match(/No\.\s*(\d+)/)
    return m ? Number(m[1]) : null
  })
  assert('Nomor naik berurutan 2..7',
    JSON.stringify(nums) === JSON.stringify([2, 3, 4, 5, 6, 7]),
    JSON.stringify(seq))

  // (c) checksum: No.5 = 食べます (id 4), No.7 = 大きい (id 6)
  const f7 = await readFront(page)
  assert('No.7 = 大きい (id 6 di kanji.js)', f7 === '大きい', `front=${f7}`)

  // (d) lompat ke kartu terakhir lalu下一页 -> deck selesai
  await page.evaluate(() => {
    // lompat dengan klik tombol kanan berkali-kali
  })
  // Cara murah: tekan ArrowRight banyak kali.
  for (let i = 0; i < 620; i++) await page.evaluate(() => {
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    window.dispatchEvent(ev)
  })
  await sleep(600)

  const donePanel = await page.evaluate(() => {
    const h = document.querySelector('.panel h3')
    const b = [...document.querySelectorAll('.panel .primary-btn')][0]
    return {
      title: h ? h.innerText.trim() : null,
      btn: b ? b.innerText.replace(/\s+/g, ' ').trim() : null,
    }
  })
  assert('Deck selesai tampil', donePanel.title === 'Deck selesai!', JSON.stringify(donePanel))
  assert('Tombol akhir = "Ulangi dari awal" (bukan kocok)',
    donePanel.btn === 'Ulangi dari awal', donePanel.btn)

  // (e) klik "Ulangi dari awal" -> balik ke No.1
  await page.evaluate(() => {
    document.querySelector('.panel .primary-btn')?.click()
  })
  await sleep(500)
  const again = await readPlabel(page)
  assert('Ulangi dari awal -> No. 1 lagi', !!again && /No\. 1\b/.test(again), again)
} catch (e) {
  assert('exception', false, e.message)
} finally {
  await browser.close()
}

const failed = A.filter((x) => !x.ok)
console.log(`\n${A.length - failed.length}/${A.length} PASS`)
process.exit(failed.length ? 1 : 0)
