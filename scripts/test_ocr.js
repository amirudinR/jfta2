import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';

const dataPath = 'd:/Projek/jfta2/public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function testOCR() {
  const worker = await createWorker('jpn');
  
  let i = 0;
  for (const d of data) {
    if (i > 10) break;
    
    if (d.img_kanji_bersih) {
      const imgPath = path.join('d:/Projek/jfta2/public/nemonik', d.img_kanji_bersih);
      try {
        const { data: { text } } = await worker.recognize(imgPath);
        console.log(`Kanji ${d.kanji}: OCR Output -> ${text.trim()}`);
      } catch (e) {
        console.log(`Failed for ${d.kanji}: ${e.message}`);
      }
    }
    i++;
  }
  
  await worker.terminate();
}

testOCR();
