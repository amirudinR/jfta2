const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dataPath = 'd:/Projek/jfta2/public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const srcDir = 'D:/vibekanban/kanji nama';
const destDir = 'd:/Projek/jfta2/public/nemonik/kanji_nama_opt';

async function restore() {
  const kanjisToRestore = ['赤', '兄'];
  
  for (let d of data) {
    if (kanjisToRestore.includes(d.kanji)) {
      // Find original file from srcDir
      const files = fs.readdirSync(srcDir);
      const origFile = files.find(f => f.includes(`_${d.kanji}_`));
      
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
          console.log(`Restored ${d.kanji} (${d.no}) -> ${webpName}`);
        }
      }
    }
  }
  
  // Save updated data.json
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

restore().catch(err => console.error(err));
