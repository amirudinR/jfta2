const fs = require('fs');
const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Kategori A
const swap = (n1, n2) => {
    const k1 = data.find(x => x.no === n1);
    const k2 = data.find(x => x.no === n2);
    const temp = k1.img_kanji_nama;
    k1.img_kanji_nama = k2.img_kanji_nama;
    k2.img_kanji_nama = temp;
    console.log(`Swapped ${n1} and ${n2}`);
};
swap(99, 286);
swap(127, 141);

const getKanji = n => data.find(x => x.no === n);

// Kategori B - Rantai 1 (347 -> 126 -> 144, 347 KOSONG)
const k347 = getKanji(347);
const k126 = getKanji(126);
const k144 = getKanji(144);
k144.img_kanji_nama = k126.img_kanji_nama; // Langkah 2
k126.img_kanji_nama = k347.img_kanji_nama; // Langkah 1
k347.img_kanji_nama = ""; // Langkah 4
console.log('Executed Rantai 1');

// Kategori B - Rantai 2 (201 -> discard (karena 264 benar), 61 -> 201, 265 -> 61, 322 -> 265, 322 KOSONG)
const k201 = getKanji(201);
const k61 = getKanji(61);
const k265 = getKanji(265);
const k322 = getKanji(322);
k201.img_kanji_nama = k61.img_kanji_nama; // Langkah 2
k61.img_kanji_nama = k265.img_kanji_nama; // Langkah 3
k265.img_kanji_nama = k322.img_kanji_nama; // Langkah 4
k322.img_kanji_nama = ""; // Langkah 5
console.log('Executed Rantai 2');

// Kategori B - Rantai 3 (271 -> 357, 271 KOSONG)
const k271 = getKanji(271);
const k357 = getKanji(357);
k357.img_kanji_nama = k271.img_kanji_nama;
k271.img_kanji_nama = "";
console.log('Executed Rantai 3');

// Kategori B - Rantai 4 (26 -> 334, 26 KOSONG)
const k26 = getKanji(26);
const k334 = getKanji(334);
k334.img_kanji_nama = k26.img_kanji_nama;
k26.img_kanji_nama = "";
console.log('Executed Rantai 4');

// Rantai 5 (109 dan 352 -> KOSONG / Generate Baru)
getKanji(109).img_kanji_nama = "";
getKanji(352).img_kanji_nama = "";
console.log('Executed Rantai 5 (set to empty)');

// Write back
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('data.json updated successfully.');

// Generate Prompts for Category C + B(empties) + F
const toGenerate = [
    347, 322, 271, 26, 109, 352, // From Category B empty slots
    11, 60, 118, 125, 134, 215, 218, 242, 243, 246, 291, 294, 306, 320, 345, // Category C
    51, 57, 72, 103, 150, 214, 225, 229, 230, 321, 326 // Category F
];

let outputPrompt = `# Prompts Ilustrasi Kanji (Audit Round 2)\n\nSilakan generate gambar-gambar berikut menggunakan Google Flow (Nano Banana Pro) dengan aspect ratio 1:1.\n\n`;

for (const no of toGenerate) {
    const d = getKanji(no);
    if (!d) continue;

    let reading = d.baca_utama || (d.kosakata_kunyomi && d.kosakata_kunyomi.length > 0 ? d.kosakata_kunyomi[0].kana : (d.kosakata_onyomi && d.kosakata_onyomi.length > 0 ? d.kosakata_onyomi[0].kana : ""));

    outputPrompt += `### No. ${no} - ${d.kanji} (${reading})\n`;
    outputPrompt += `**Arti:** ${d.arti}\n\n`;
    outputPrompt += `**Prompt:**\n`;
    outputPrompt += `A flat vector cartoon-style study illustration for the Japanese Kanji '${d.kanji}' (${reading}, meaning: '${d.arti}'). The design features a cute chibi mascot interacting with an element representing the meaning of the kanji. Above the mascot, write the furigana '${reading}' in clear, readable hiragana.\n`;
    outputPrompt += `**CRITICAL LEGIBILITY REQUIREMENT:** The large Kanji '${d.kanji}' MUST be written extremely clearly and legibly using a bold, standard font style. It must be placed prominently where it does not overlap, blend, or merge with any background decorations or characters. Ensure high contrast so it is instantly readable at a glance without any visual ambiguity.\n`;
    outputPrompt += `The background should be a solid soft pastel color, keeping the overall design simple, engaging, and suitable for a mnemonic flashcard.\n\n---\n\n`;
}

fs.writeFileSync('C:\\Users\\Amir\\.gemini\\antigravity-ide\\brain\\8e182eb4-b22e-4877-92c7-eb00d3be0790\\prompts_round2.md', outputPrompt);
console.log('File prompts_round2.md created successfully.');
