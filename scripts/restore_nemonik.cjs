const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dataPath = 'd:/Projek/jfta2/public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const mappingPath = 'D:/vibekanban/nemonik/nggak_kepakai/audit_data/audit_mapping_full.json';
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

const srcDir = 'D:/vibekanban/nemonik/nggak_kepakai/gambar lengkap';
const destDir = 'd:/Projek/jfta2/public/nemonik/kanji_nama_opt';

async function restore() {
  let restoredCount = 0;
  
  for (let d of data) {
    if (!d.img_kanji_nama) {
      // Find original file from mapping
      const origFile = Object.keys(mapping).find(key => mapping[key] === d.kanji);
      
      if (origFile) {
        const srcPath = path.join(srcDir, origFile);
        if (fs.existsSync(srcPath)) {
          // Format number
          const paddedNo = String(d.no).padStart(3, '0');
          // Clean baca
          const safeBaca = d.baca_utama.replace(/[\/\\?%*:|"<>]/g, '_');
          const webpName = `${paddedNo}_${d.kanji}_${safeBaca}.webp`;
          const destPath = path.join(destDir, webpName);
          
          // Convert to webp
          await sharp(srcPath)
            .webp({ quality: 80 })
            .toFile(destPath);
            
          // Update data.json
          d.img_kanji_nama = `kanji_nama_opt/${webpName}`;
          restoredCount++;
          console.log(`Restored ${d.kanji} (${d.no}) -> ${webpName}`);
        } else {
          console.error(`Source file not found for kanji ${d.kanji}: ${srcPath}`);
        }
      } else {
        console.error(`No mapping found for kanji ${d.kanji}`);
      }
    }
  }
  
  // Save updated data.json
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully restored ${restoredCount} images and updated data.json.`);
}

restore().catch(err => console.error(err));
