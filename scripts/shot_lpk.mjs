// shot_lpk.mjs - screenshot halaman LPK (mobile + desktop) untuk QA visual.
// Butuh dev server hidup:  BASE_URL=... node scripts/shot_lpk.mjs
import puppeteer from 'puppeteer'

const BASE = process.env.BASE_URL || 'http://localhost:5210'
const OUT = process.env.OUT || 'shots-lpk'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })

for (const [name, vp] of [
  ['mobile', { width: 412, height: 915, deviceScaleFactor: 2 }],
  ['desktop', { width: 1280, height: 900, deviceScaleFactor: 1 }],
]) {
  const page = await browser.newPage()
  await page.setViewport(vp)
  await page.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => localStorage.setItem('ankichou-mode', JSON.stringify('lpk')))
  await page.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
  await sleep(1500)
  await page.screenshot({ path: `${OUT}-${name}.png`, fullPage: false })
  console.log(`wrote ${OUT}-${name}.png`)
  await page.close()
}

// Halaman Daftar Materi (tombol LPK) - mobile.
const p2 = await browser.newPage()
await p2.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 })
await p2.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
await p2.evaluate(() => localStorage.setItem('ankichou-mode', JSON.stringify('materi')))
await p2.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
await sleep(1500)
await p2.screenshot({ path: `${OUT}-materi.png`, fullPage: false })
console.log(`wrote ${OUT}-materi.png`)

await browser.close()
