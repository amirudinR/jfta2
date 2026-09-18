const fs = require('fs');

const kanjiNos = [11, 32, 60, 61, 103, 118, 124, 125, 134, 144, 150, 201, 218, 221, 246, 265, 320, 345];
const data = JSON.parse(fs.readFileSync('public/nemonik/data.json', 'utf-8'));

let output = `# Prompts Ilustrasi Kanji (Kategori D)\n\nKarena API AI Image Generation sedang limit (Error 429), silakan generate ulang 18 gambar ini menggunakan Google Flow (Nano Banana Pro) dengan aspect ratio 1:1. Setelah selesai di-generate dan di-download, taruh di satu folder dan saya akan mengganti namanya secara otomatis seperti sebelumnya.\n\n`;

for (const no of kanjiNos) {
    const d = data.find(x => x.no == no);
    if (!d) continue;

    // Get primary reading
    let reading = d.baca_utama;
    if (d.contoh_bacaan) {
        reading = d.contoh_bacaan;
    } else {
        if (d.kosakata_kunyomi && d.kosakata_kunyomi.length > 0) {
            reading = d.kosakata_kunyomi[0].kana;
        } else if (d.kosakata_onyomi && d.kosakata_onyomi.length > 0) {
            reading = d.kosakata_onyomi[0].kana;
        }
    }

    output += `### No. ${no} - ${d.kanji} (${reading})\n`;
    output += `**Arti:** ${d.arti}\n\n`;
    output += `**Prompt:**\n`;
    output += `A flat vector cartoon-style study illustration for the Japanese Kanji '${d.kanji}' (${reading}, meaning: '${d.arti}'). The design features a cute chibi mascot interacting with an element representing the meaning of the kanji. Above the kanji character, write the furigana '${reading}' in clear, readable hiragana. The background should be a solid soft pastel color, keeping the overall design simple, engaging, and suitable for a mnemonic flashcard.\n\n---\n\n`;
}

fs.writeFileSync('C:\\Users\\Amir\\.gemini\\antigravity-ide\\brain\\8e182eb4-b22e-4877-92c7-eb00d3be0790\\prompts_for_category_d.md', output);
console.log('Prompts artifact created.');
