const fs = require('fs');

const dataPath = 'public/nemonik/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const targetNumbers = [11, 26, 51, 57, 60, 61, 72, 99, 103, 109, 112, 118, 124, 125, 126, 127, 134, 141, 144, 150, 201, 214, 215, 218, 221, 225, 229, 230, 242, 243, 246, 260, 271, 286, 291, 294, 306, 320, 321, 322, 326, 327, 334, 345, 347, 352, 353, 357, 360];

const targets = data.filter(d => targetNumbers.includes(d.no));

let outputPrompt = `# Prompts Ilustrasi Kanji Lengkap (49 Kanji)\n\nSilakan copy-paste prompt di bawah ini ke Google Flow (Nano Banana Pro) dengan aspect ratio 1:1.\n\n`;

for (const d of targets) {
    let reading = d.baca_utama || (d.kosakata_kunyomi && d.kosakata_kunyomi.length > 0 ? d.kosakata_kunyomi[0].kana : (d.kosakata_onyomi && d.kosakata_onyomi.length > 0 ? d.kosakata_onyomi[0].kana : ""));

    outputPrompt += `### No. ${d.no} - ${d.kanji} (${reading})\n`;
    outputPrompt += `**Arti:** ${d.arti}\n\n`;
    outputPrompt += `**Prompt:**\n`;
    outputPrompt += `A flat vector cartoon-style study illustration for the Japanese Kanji '${d.kanji}' (${reading}, meaning: '${d.arti}'). The design features a cute chibi mascot interacting with an element representing the meaning of the kanji. Above the mascot, write the furigana '${reading}' in clear, readable hiragana.\n`;
    outputPrompt += `**CRITICAL LEGIBILITY REQUIREMENT:** The large Kanji '${d.kanji}' MUST be written extremely clearly and legibly using a bold, standard font style. It must be placed prominently where it does not overlap, blend, or merge with any background decorations or characters. Ensure high contrast so it is instantly readable at a glance without any visual ambiguity.\n`;
    outputPrompt += `The background should be a solid soft pastel color, keeping the overall design simple, engaging, and suitable for a mnemonic flashcard.\n\n---\n\n`;
}

fs.writeFileSync('C:\\Users\\Amir\\.gemini\\antigravity-ide\\brain\\8e182eb4-b22e-4877-92c7-eb00d3be0790\\prompts_49_lengkap.md', outputPrompt);
console.log('File prompts_49_lengkap.md created successfully.');
