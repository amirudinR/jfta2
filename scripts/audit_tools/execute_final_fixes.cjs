const fs = require('fs');

// Step 1: Backup
const dataPath = 'public/nemonik/data.json';
const backupPath = 'public/nemonik/data.backup.json';
const rawData = fs.readFileSync(dataPath, 'utf-8');
fs.writeFileSync(backupPath, rawData);
console.log('Backup created successfully.');

const data = JSON.parse(rawData);

// Step 2: Swap Category A
const swapPairs = [
    [99, 286],
    [291, 280],
    [127, 141],
    [352, 109],
    [353, 112],
    [360, 225],
    [347, 126]
];

console.log('\n--- Eksekusi Swap Kategori A ---');
swapPairs.forEach(pair => {
    const k1 = data.find(d => d.no === pair[0]);
    const k2 = data.find(d => d.no === pair[1]);
    
    if (k1 && k2) {
        const temp = k1.img_kanji_nama;
        k1.img_kanji_nama = k2.img_kanji_nama;
        k2.img_kanji_nama = temp;
        
        console.log(`Swap sukses:`);
        console.log(`  -> No.${k1.no} (${k1.kanji}) kini memakai file: ${k1.img_kanji_nama}`);
        console.log(`  -> No.${k2.no} (${k2.kanji}) kini memakai file: ${k2.img_kanji_nama}`);
    } else {
        console.log(`Gagal swap: pasangan ${pair[0]} dan ${pair[1]} tidak lengkap.`);
    }
});

// Save modifications
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('\nSwap selesai. data.json telah di-update.');

// Step 3: Generate Prompts for Category B (plus 345)
const catB_Nos = [26, 125, 134, 60, 260, 234, 345];
let outputPrompt = `# Prompts Ilustrasi Kanji (Kategori B)\n\nSilakan generate gambar-gambar berikut menggunakan Google Flow (Nano Banana Pro) dengan aspect ratio 1:1.\n\n`;

for (const no of catB_Nos) {
    const d = data.find(x => x.no == no);
    if (!d) continue;

    let reading = d.baca_utama || (d.kosakata_kunyomi && d.kosakata_kunyomi.length > 0 ? d.kosakata_kunyomi[0].kana : (d.kosakata_onyomi && d.kosakata_onyomi.length > 0 ? d.kosakata_onyomi[0].kana : ""));

    outputPrompt += `### No. ${no} - ${d.kanji} (${reading})\n`;
    outputPrompt += `**Arti:** ${d.arti}\n\n`;
    outputPrompt += `**Prompt:**\n`;
    outputPrompt += `A flat vector cartoon-style study illustration for the Japanese Kanji '${d.kanji}' (${reading}, meaning: '${d.arti}'). The design features a cute chibi mascot interacting with an element representing the meaning of the kanji. Above the kanji character, write the furigana '${reading}' in clear, readable hiragana. The background should be a solid soft pastel color, keeping the overall design simple, engaging, and suitable for a mnemonic flashcard.\n\n---\n\n`;
}

fs.writeFileSync('C:\\Users\\Amir\\.gemini\\antigravity-ide\\brain\\8e182eb4-b22e-4877-92c7-eb00d3be0790\\prompts_for_category_b.md', outputPrompt);
console.log('File prompts_for_category_b.md berhasil dibuat.');
