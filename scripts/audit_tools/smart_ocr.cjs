const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Build dictionary for mapping
const allKanjis = data.map(d => {
    let keywords = [d.kanji];
    if (d.arti) keywords.push(d.arti.toLowerCase());
    
    // Helper to extract words from kosakata
    const extract = (kosaArr) => {
        if (!kosaArr) return;
        for (let k of kosaArr) {
            if (k.kana) keywords.push(k.kana);
            if (k.kata) keywords.push(k.kata);
        }
    };
    extract(d.kosakata_onyomi);
    extract(d.kosakata_kunyomi);
    
    // filter short keywords
    keywords = keywords.filter(k => k.length > 0);
    return { no: d.no, keywords: Array.from(new Set(keywords)) };
});

async function main() {
    console.log('Initializing Tesseract for Japanese...');
    const worker = await createWorker('jpn');

    const mismatches = [];

    // Let's do a fast pass just on the files we extracted to artifacts to verify the script
    const kanjisToCheck = [271, 357, 291, 280, 294, 263, 306, 207, 109, 352, 126, 347, 
                           214, 215, 361, 234, 260, 334, 229, 230, 242, 243, 327, 88, 232,
                           205, 321, 322];
                           
    for (const no of kanjisToCheck) {
        const item = data.find(d => d.no === no);
        if (!item || !item.img_kanji_nama) continue;
        
        const imgPath = path.join('public/nemonik', item.img_kanji_nama);
        if (!fs.existsSync(imgPath)) continue;
        
        const { data: { text } } = await worker.recognize(imgPath);
        const flatText = text.replace(/\s+/g, '').toLowerCase(); // remove all spaces for JP text matching
        
        let bestMatch = null;
        let maxScore = 0;
        let matchedKeyword = '';

        for (const k of allKanjis) {
            for (const kw of k.keywords) {
                if (flatText.includes(kw.replace(/\s+/g, '').toLowerCase())) {
                    // prefer longer keyword matches
                    if (kw.length > maxScore) {
                        maxScore = kw.length;
                        bestMatch = k.no;
                        matchedKeyword = kw;
                    }
                }
            }
        }

        if (bestMatch && bestMatch !== no) {
            console.log(`[MISMATCH] File for No.${no} (${item.kanji}) actually contains text for No.${bestMatch} (matched '${matchedKeyword}')`);
            mismatches.push({ file_kanji: no, actual_kanji: bestMatch, keyword: matchedKeyword });
        } else if (bestMatch === no) {
            console.log(`[OK] File for No.${no} is correct (matched '${matchedKeyword}')`);
        } else {
            console.log(`[UNKNOWN] No match found for file No.${no}`);
        }
    }
    await worker.terminate();
    console.log('\nSuggested Swaps/Reassignments:');
    console.log(mismatches);
}

main().catch(console.error);
