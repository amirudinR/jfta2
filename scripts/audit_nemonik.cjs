const fs = require('fs');
const path = require('path');

const dataPath = 'd:/Projek/jfta2/public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const publicDir = 'd:/Projek/jfta2/public/nemonik/kanji_nama_opt';
const backupDir = 'D:/vibekanban/kanji nama'; 

const publicFiles = new Set(fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : []);
const backupFiles = new Set(fs.existsSync(backupDir) ? fs.readdirSync(backupDir) : []);

const report = [];

data.forEach(d => {
  let issue = null;
  let reason = '';
  let solution = '';

  if (!d.img_kanji_nama) {
    issue = 'Field kosong (null)';
    
    // Check if it exists in backup
    const matchBackup = Array.from(backupFiles).find(f => f.includes(`_${d.kanji}_`));
    if (matchBackup) {
      reason = 'File ada di backup (D:/vibekanban/kanji nama)';
      solution = `Restore from backup: ${matchBackup}`;
    } else {
      reason = 'File tidak ditemukan di backup sama sekali';
      solution = 'Biarkan null (sah by design/tidak ada gambar)';
    }
  } else {
    // Check if the file exists in publicDir
    const fileName = path.basename(d.img_kanji_nama);
    if (!publicFiles.has(fileName)) {
      issue = 'File tidak ditemukan di repo (public/nemonik/kanji_nama_opt)';
      
      const matchBackup = Array.from(backupFiles).find(f => f.includes(`_${d.kanji}_`));
      if (matchBackup) {
        reason = 'File ada di backup (D:/vibekanban/kanji nama)';
        solution = `Restore from backup: ${matchBackup}`;
      } else {
        reason = 'File tidak ditemukan di backup sama sekali';
        solution = 'Biarkan null (atau cari nama file yang salah)';
      }
    }
  }

  if (issue) {
    report.push({
      no: d.no,
      kanji: d.kanji,
      issue,
      reason,
      solution
    });
  }
});

fs.writeFileSync('d:/Projek/jfta2/scripts/audit_report.json', JSON.stringify(report, null, 2), 'utf8');
console.log(`\nTotal bermasalah: ${report.length}`);
