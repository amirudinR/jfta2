const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dataPath = 'd:/Projek/jfta2/public/nemonik/data.json';
const publicDir = 'd:/Projek/jfta2/public/nemonik';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function checkImage(imgPath, kanji) {
  if (!imgPath) return { status: 'OK (Null, Sah by design)', issue: false };
  
  const fullPath = path.join(publicDir, imgPath);
  if (!fs.existsSync(fullPath)) {
    return { status: 'Missing (File tidak ada)', issue: true };
  }
  
  const filename = path.basename(imgPath);
  if (!filename.includes(kanji)) {
    return { status: `Mismatch (Nama file "${filename}" tidak mengandung kanji "${kanji}")`, issue: true };
  }
  
  try {
    const img = sharp(fullPath);
    const stats = await img.stats();
    // A completely blank/solid image will have very low standard deviation across all channels
    let isBlank = true;
    for (let c of stats.channels) {
      if (c.stdev > 1.0) isBlank = false;
    }
    
    if (isBlank) {
      return { status: 'Blank (Gambar solid/kosong)', issue: true };
    }
    
    return { status: 'OK', issue: false };
  } catch (err) {
    return { status: `Corrupt (${err.message})`, issue: true };
  }
}

async function run() {
  const report = [];
  
  console.log(`Starting audit for ${data.length} entries...`);
  
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    
    const bersihRes = await checkImage(d.img_kanji_bersih, d.kanji);
    const namaRes = await checkImage(d.img_kanji_nama, d.kanji);
    const selesaiRes = await checkImage(d.img_selesai_potong, d.kanji);
    
    // For kanji_nama, if it is null, but we expect only some to be null, we might want to flag it?
    // User wants a report of ALL entries that are problematic. We will flag if anything has an issue, OR if kanji_nama is null.
    // Wait, the user said "Fokus laporkan HANYA entri yang bermasalah... tidak perlu tulis 361 baris"
    
    let isProblematic = bersihRes.issue || namaRes.issue || selesaiRes.issue;
    
    // If kanji_nama is null, we log it as a finding to let the user decide if it's missing or legitimate.
    if (!d.img_kanji_nama) {
      isProblematic = true;
    }
    
    if (isProblematic) {
      report.push({
        no: d.no,
        kanji: d.kanji,
        kanji_bersih: bersihRes.status,
        kanji_nama: !d.img_kanji_nama ? 'Field kosong (null)' : namaRes.status,
        selesai_potong: selesaiRes.status
      });
    }
    
    if (i % 50 === 0) console.log(`Checked ${i}/${data.length}...`);
  }
  
  console.log('Audit complete.');
  
  // Format report as markdown
  let md = '| No | Kanji | Status kanji_bersih | Status kanji_nama | Status selesai_potong |\n';
  md += '|---|---|---|---|---|\n';
  
  for (const r of report) {
    md += `| ${r.no} | ${r.kanji} | ${r.kanji_bersih} | ${r.kanji_nama} | ${r.selesai_potong} |\n`;
  }
  
  fs.writeFileSync('d:/Projek/jfta2/scripts/image_audit_report.md', md, 'utf8');
  console.log(`Report generated. Total problematic entries: ${report.length}`);
}

run();
