const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Build dictionary for mapping
const allKanjis = data.map(d => {
    let keywords = [d.kanji];
    
    const extract = (kosaArr) => {
        if (!kosaArr) return;
        for (let k of kosaArr) {
            if (k.kana) keywords.push(k.kana);
            if (k.kata) keywords.push(k.kata);
        }
    };
    extract(d.kosakata_onyomi);
    extract(d.kosakata_kunyomi);
    
    // Add primary readings
    if (d.baca_utama) keywords.push(d.baca_utama);
    if (d.onyomi) keywords.push(d.onyomi);
    if (d.kunyomi) keywords.push(d.kunyomi);
    if (d.contoh_bacaan) keywords.push(d.contoh_bacaan);
    
    keywords = keywords.filter(k => k && k.length > 0);
    return { no: d.no, kanji: d.kanji, keywords: Array.from(new Set(keywords)) };
});

async function main() {
    console.log('Initializing Tesseract for Japanese...');
    const worker = await createWorker('jpn');

    let mdOutput = `# Laporan Verifikasi OCR Otomatis (361 Kanji)\n\nLaporan ini dibuat dengan memindai teks pada 361 gambar (menggunakan Tesseract) dan mencocokkannya dengan *data.json*.\n\n`;
    mdOutput += `## Daftar Ketidakcocokan (Potential Swaps / Mismatches)\n\n`;
    mdOutput += `| No | Kanji | OCR Keyword | Kemungkinan Milik Kanji No. | Status |\n`;
    mdOutput += `|---|---|---|---|---|\n`;

    let mismatchCount = 0;
    
    // Test on all 361
    for (const item of data) {
        if (!item.img_kanji_nama) continue;
        
        const imgPath = path.join('public/nemonik', item.img_kanji_nama);
        if (!fs.existsSync(imgPath)) continue;
        
        console.log(`Checking No. ${item.no} (${item.kanji})...`);
        const { data: { text } } = await worker.recognize(imgPath);
        const flatText = text.replace(/\s+/g, '').toLowerCase(); // flat matching
        
        let bestMatchNo = null;
        let bestMatchKanji = '';
        let maxScore = 0;
        let matchedKeyword = '';

        for (const k of allKanjis) {
            for (const kw of k.keywords) {
                const kwFlat = kw.replace(/\s+/g, '').toLowerCase();
                if (kwFlat.length > 1 && flatText.includes(kwFlat)) {
                    if (kwFlat.length > maxScore) {
                        maxScore = kwFlat.length;
                        bestMatchNo = k.no;
                        bestMatchKanji = k.kanji;
                        matchedKeyword = kw;
                    }
                }
            }
        }

        // If it found a match but it's not the current kanji
        if (bestMatchNo && bestMatchNo !== item.no) {
            // Check if the actual kanji also matches somewhere
            let selfMatch = false;
            const selfObj = allKanjis.find(x => x.no === item.no);
            for(const kw of selfObj.keywords) {
                if (kw.length > 1 && flatText.includes(kw.replace(/\s+/g, '').toLowerCase())) {
                    selfMatch = true;
                    break;
                }
            }
            if (!selfMatch) {
                mdOutput += `| ${item.no} | ${item.kanji} | \`${matchedKeyword}\` | **No. ${bestMatchNo} (${bestMatchKanji})** | ⚠️ Mismatch |\n`;
                mismatchCount++;
            }
        }
    }
    
    mdOutput += `\n**Total Mismatch Terdeteksi:** ${mismatchCount} dari 361 gambar.\n`;
    
    fs.writeFileSync('C:\\Users\\Amir\\.gemini\\antigravity-ide\\brain\\8e182eb4-b22e-4877-92c7-eb00d3be0790\\ocr_report.md', mdOutput);
    console.log('Full OCR verification completed! Report generated.');
    await worker.terminate();
}

main().catch(console.error);
