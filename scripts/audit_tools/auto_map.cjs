const fs = require('fs');
const path = require('path');

const imgDir = 'C:\\Users\\Amir\\Downloads\\Sep 18 - 06_04';
const destDir = 'public/nemonik/kanji_nama_opt';
const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const files = fs.readdirSync(imgDir).filter(f => f.match(/\.(jpeg|jpg|png|webp)$/i));

// We are targeting the list of Kanjis the user gave us in the prompt (the 49 Kanjis)
// Just to be safe, we can match against any Kanji in data.json.
let matchedCount = 0;

for (const file of files) {
    const filePath = path.join(imgDir, file);
    let matchedKanji = null;
    
    // 1. Try to find actual Kanji characters in the filename
    for (const d of data) {
        if (file.includes(d.kanji)) {
            matchedKanji = d;
            break;
        }
    }
    
    // 2. Try to find English keywords in the filename matching the 'arti' (meaning)
    if (!matchedKanji) {
        const nameLower = file.toLowerCase();
        // Manually map some obvious ones from the filenames
        if (nameLower.includes('horse')) matchedKanji = data.find(d => d.arti.toLowerCase().includes('kuda'));
        else if (nameLower.includes('sky')) matchedKanji = data.find(d => d.kanji === '空');
        else if (nameLower.includes('return')) matchedKanji = data.find(d => d.arti.toLowerCase().includes('pulang') || d.kanji === '帰' || d.kanji === '返');
        else if (nameLower.includes('true')) matchedKanji = data.find(d => d.kanji === '正' || d.kanji === '真');
        else if (nameLower.includes('test')) matchedKanji = data.find(d => d.kanji === '試' || d.kanji === '験');
        else if (nameLower.includes('light')) matchedKanji = data.find(d => d.kanji === '光');
        else if (nameLower.includes('_e_') || nameLower.includes('_e…')) matchedKanji = data.find(d => d.no === 134); // from our OCR result
        else if (nameLower.includes('_t_') || nameLower.includes('_t…')) matchedKanji = data.find(d => d.no === 11); // from our OCR result
        else if (nameLower.includes('_f_') || nameLower.includes('_f…')) matchedKanji = data.find(d => d.no === 230); // from OCR result
    }
    
    if (matchedKanji) {
        // Construct new filename
        const ext = path.extname(file);
        const newFilename = `${String(matchedKanji.no).padStart(3, '0')}_${matchedKanji.kanji}${ext}`;
        const newPath = path.join(destDir, newFilename);
        
        // Copy file
        fs.copyFileSync(filePath, newPath);
        
        // Update data.json
        matchedKanji.img_kanji_nama = `kanji_nama_opt/${newFilename}`;
        console.log(`Matched ${file} -> No. ${matchedKanji.no} (${matchedKanji.kanji})`);
        matchedCount++;
    } else {
        console.log(`Could not map: ${file}`);
    }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Successfully mapped ${matchedCount} out of ${files.length} images.`);
