const fs = require('fs');

// We perform swaps that were identified
const swaps = [
    [271, 357],
    [291, 280],
    [109, 352],
    [126, 347],
    [88, 232]
];

// One way moves
const moves = [
    { from: 215, to: 361 },
    { from: 334, to: 234 }
];

const dataPath = 'public/nemonik/data.json';
let data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

for (const pair of swaps) {
    const k1 = data.find(d => d.no === pair[0]);
    const k2 = data.find(d => d.no === pair[1]);
    if (k1 && k2) {
        const temp = k1.img_kanji_nama;
        k1.img_kanji_nama = k2.img_kanji_nama;
        k2.img_kanji_nama = temp;
        console.log(`Swapped ${k1.no} <-> ${k2.no}`);
    }
}

for (const move of moves) {
    const k1 = data.find(d => d.no === move.from);
    const k2 = data.find(d => d.no === move.to);
    if (k1 && k2) {
        k2.img_kanji_nama = k1.img_kanji_nama;
        console.log(`Moved ${k1.no} -> ${k2.no}`);
    }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Category B & C swaps/moves completed!');
