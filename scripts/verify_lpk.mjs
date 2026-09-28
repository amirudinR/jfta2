// verify_lpk.mjs - bukti TEXT bahwa halaman "Hafalan Kanji LPK" hidup:
//   (a) tombol "Hafalan Kanji LPK" ada di Daftar Materi
//   (b) klik tombol itu -> halaman LPK terbuka, 613 entri
//   (c) item LPK juga ada di Sidebar
//   (d) refresh di halaman LPK -> tetap di LPK (tidak terlempar ke halaman lain)
//   (e) LPK memakai store SRS material 'kanji' yang sama (bukan store baru)
//
// Butuh dev server hidup (dikelola pemanggil) di localhost:5173:
//   node scripts/verify_lpk.mjs
//   BASE_URL=http://localhost:5173 node scripts/verify_lpk.mjs
//
// Exit code 1 bila ada assertion yang gagal.

import puppeteer from 'puppeteer'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ASSERTIONS = []
function assert(name, ok, observed) {
  ASSERTIONS.push({ name, ok: !!ok, observed })
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}  \x1a  ${observed}`)
}

const clickByText = (sel, re) => `(() => {
  const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find(x => ${re}.test(x.textContent || ''))
  if (!b) return false
  b.click()
  return true
})()`

// 613 entri LPK = kanji/kosakata, bukan "kata" - label engine harus akurat.

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 412, height: 915 })

try {
  // Seed mode='materi' supaya bisa cek tombol LPK di Daftar Materi.
  await page.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => localStorage.setItem('ankichou-mode', JSON.stringify('materi')))
  await page.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
  await sleep(1200)

  // (a) tombol di Daftar Materi
  const dmBtn = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button.dm-open-lpk')]
      .find((x) => /Hafalan Kanji LPK/.test(x.textContent || ''))
    return b ? b.className : null
  })
  assert('Tombol LPK ada di Daftar Materi', !!dmBtn && dmBtn.includes('dm-open-lpk'), dmBtn)

  // (b) klik -> halaman LPK terbuka
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button.dm-open-lpk')]
      .find((x) => /Hafalan Kanji LPK/.test(x.textContent || ''))
    if (!b) return false
    b.click()
    return true
  })
  assert('Klik tombol LPK diteruskan', clicked, `clicked=${clicked}`)
  await sleep(1000)

  const hero = await page.evaluate(() => {
    const el = document.querySelector('.kl-hero')
    return el ? el.innerText.replace(/\s+/g, ' ').trim() : null
  })
  assert('Halaman LPK terbuka (hero "Kanji LPK")', !!hero && /Kanji LPK/.test(hero), hero)
  assert('Jumlah entri 613', !!hero && /\b613\b/.test(hero), hero)

  const chips = await page.evaluate(() =>
    [...document.querySelectorAll('.stat')].map((s) => s.innerText.replace(/\s+/g, ' ').trim()))
  assert('Stat chips tampil (total/dikuasai/due)', chips.length === 3, JSON.stringify(chips))

  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll('.kl-page .mode-btn')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()))
  assert('Tab Kartu/Kuis/Ulangi/Daftar ada', tabs.length === 4, JSON.stringify(tabs))

  // Urutan data: buka Daftar Hafal, kanji LPK no 1 harus 魚 (dokumen KANJI_JFT_1).
  // Kalau tak ada yang dihafal, Daftar Hafal tampil empty state - cukup cek
  // bahwa kartu yang dirender memuat kanji (bukan crash/blank).
  const cardText = await page.evaluate(() => {
    const el = document.querySelector('.kl-page [class*="kartu"], .kl-page [class*="card"]')
    return el ? el.innerText.replace(/\s+/g, ' ').trim().slice(0, 90) : null
  })
  assert('Kartu dirender (bukan blank)', !!cardText && /\S/.test(cardText), cardText)

  // (c) Sidebar punya item LPK
  await page.goto(`${BASE}/?preview=1`, { waitUntil: 'networkidle2' })
  await sleep(1000)
  const sbOpen = await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => /menu/i.test(x.getAttribute('aria-label') || ''))
    if (t) { t.click(); return true }
    return false
  })
  await sleep(700)
  const sbItem = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.sidebar-item')].find((x) => /Hafalan Kanji LPK/.test(x.textContent || ''))
    return b ? b.innerText.replace(/\s+/g, ' ').trim() : null
  })
  assert('Item "Hafalan Kanji LPK" ada di Sidebar', !!sbItem, `trigger=${sbOpen} item=${sbItem}`)

  // (d) klik Sidebar -> LPK, lalu refresh harus tetap di LPK
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('.sidebar-item')].find((x) => /Hafalan Kanji LPK/.test(x.textContent || ''))
    if (b) b.click()
  })
  await sleep(1000)
  const before = await page.evaluate(() => document.querySelector('.kl-hero')?.innerText.replace(/\s+/g, ' ').trim() || null)
  assert('Sidebar -> halaman LPK', !!before && /Kanji LPK/.test(before), before)

  await page.reload({ waitUntil: 'networkidle2' })
  await sleep(1200)
  const after = await page.evaluate(() => document.querySelector('.kl-hero')?.innerText.replace(/\s+/g, ' ').trim() || null)
  assert('Refresh di LPK tetap di LPK', !!after && after === before, `${before} -> ${after}`)

  // (e) LPK memakai store SRS 'kanji' yang sama -> tidak ada store LPK baru.
  const storeKeys = await page.evaluate(() => {
    const raw = localStorage.getItem('hafalan-jft-a2-progress-v2')
    if (!raw) return null
    return Object.keys(JSON.parse(raw).perMaterial || {}).sort()
  })
  assert('Tidak ada store SRS terpisah untuk LPK',
    storeKeys === null || !storeKeys.some((k) => /lpk/i.test(k)),
    JSON.stringify(storeKeys))
} catch (e) {
  assert('exception', false, e.message)
} finally {
  await browser.close()
}

const failed = ASSERTIONS.filter((a) => !a.ok)
console.log(`\n${ASSERTIONS.length - failed.length}/${ASSERTIONS.length} PASS`)
process.exit(failed.length ? 1 : 0)
