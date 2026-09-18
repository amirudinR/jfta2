const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const imgDir = 'C:\\Users\\Amir\\Downloads\\Sep 18 - 06_04';
const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.jpg'));

const toGenerate = [
    347, 322, 271, 26, 109, 352, // From Category B empty slots
    11, 60, 118, 125, 134, 215, 218, 242, 243, 246, 291, 294, 306, 320, 345, // Category C
    51, 57, 72, 103, 150, 214, 225, 229, 230, 321, 326 // Category F
];
const targets = data.filter(d => toGenerate.includes(d.no));

(async () => {
    console.log(`Found ${files.length} images. Processing...`);
    for (const file of files) {
        const filePath = path.join(imgDir, file);
        try {
            const result = await Tesseract.recognize(filePath, 'jpn', { logger: () => {} });
            const text = result.data.text.replace(/\s+/g, '');
            console.log(`\nFile: ${file}`);
            console.log(`OCR: ${text}`);
            
            // Try to match with our targets
            let matched = null;
            for (const t of targets) {
                if (text.includes(t.kanji)) {
                    matched = t;
                    break;
                }
            }
            if (matched) {
                console.log(`>>> MATCHED! belongs to No. ${matched.no} (${matched.kanji})`);
            } else {
                console.log(`>>> NO MATCH FOUND`);
            }
        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    }
})();
