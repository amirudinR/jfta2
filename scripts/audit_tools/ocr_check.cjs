const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function recognizeText(worker, imgPath) {
    if (!fs.existsSync(imgPath)) return null;
    const { data: { text } } = await worker.recognize(imgPath);
    return text.trim();
}

async function main() {
    console.log('Initializing Tesseract for Japanese...');
    const worker = await createWorker('jpn');

    const kanjisToCheck = [271, 357, 291, 280, 294, 263, 306, 207, 109, 352, 126, 347, 
                           214, 215, 361, 234, 260, 334, 229, 230, 242, 243, 327, 88, 232,
                           205, 321, 322];
                           
    for (const no of kanjisToCheck) {
        const item = data.find(d => d.no === no);
        if (!item) continue;
        
        const imgPath = path.join('public/nemonik', item.img_kanji_nama);
        console.log(`\nChecking No. ${no} (${item.kanji})... Image: ${item.img_kanji_nama}`);
        
        try {
            const text = await recognizeText(worker, imgPath);
            // Replace newlines with spaces for single-line print
            const flatText = text ? text.replace(/\s+/g, ' ') : '';
            console.log(`OCR Result: ${flatText}`);
        } catch (e) {
            console.error(`OCR Failed: ${e.message}`);
        }
    }
    await worker.terminate();
}

main().catch(console.error);
