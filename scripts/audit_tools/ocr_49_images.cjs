const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const targetNumbers = [11, 26, 51, 57, 60, 61, 72, 99, 103, 109, 112, 118, 124, 125, 126, 127, 134, 141, 144, 150, 201, 214, 215, 218, 221, 225, 229, 230, 242, 243, 246, 260, 271, 286, 291, 294, 306, 320, 321, 322, 326, 327, 334, 345, 347, 352, 353, 357, 360];

const targets = data.filter(d => targetNumbers.includes(d.no));
const kanjiMap = {};
for (const t of targets) {
    kanjiMap[t.kanji] = t;
}

const inputDir = 'C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55';
const processedDir = 'C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55\\processed';

if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
}

async function run() {
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.webp') || f.endsWith('.png'));
    let matched = 0;
    
    console.log(`Found ${files.length} images. Starting OCR...`);

    const worker = await Tesseract.createWorker('jpn');

    for (const file of files) {
        const filePath = path.join(inputDir, file);
        
        try {
            const ret = await worker.recognize(filePath);
            const text = ret.data.text.replace(/\s/g, '');
            
            let foundKanji = null;
            let foundData = null;
            
            // Check if any of our target kanjis is in the OCR text
            for (const [kanji, d] of Object.entries(kanjiMap)) {
                if (text.includes(kanji)) {
                    foundKanji = kanji;
                    foundData = d;
                    break; // found one!
                }
            }
            
            if (foundKanji) {
                // Determine new filename
                const paddedNo = String(foundData.no).padStart(3, '0');
                const newFilename = `${paddedNo}_${foundKanji}.jpeg`;
                const newPath = path.join(processedDir, newFilename);
                
                fs.copyFileSync(filePath, newPath);
                console.log(`[MATCH] ${file} -> ${newFilename} (Text: ${text.substring(0, 10)}...)`);
                matched++;
                
                // Remove from kanjiMap so we don't map duplicates
                delete kanjiMap[foundKanji];
            } else {
                console.log(`[UNMATCHED] ${file} (Text: ${text.substring(0, 15)}...)`);
            }
        } catch (e) {
            console.log(`[ERROR] ${file}: ${e.message}`);
        }
    }
    
    await worker.terminate();
    
    console.log(`\nFinished! Matched ${matched}/${files.length} images.`);
    
    const remaining = Object.keys(kanjiMap);
    if (remaining.length > 0) {
        console.log(`Remaining unmapped Kanji (${remaining.length}):`);
        for (const k of remaining) {
            console.log(`- No. ${kanjiMap[k].no}: ${k}`);
        }
    }
}

run();
