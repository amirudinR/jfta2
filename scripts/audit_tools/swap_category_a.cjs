const fs = require('fs');

const pairs = [
    [53, 301],
    [91, 289],
    [99, 286],
    [127, 141],
    [170, 251],
    [212, 309],
    [213, 275],
    [250, 116],
    [315, 316],
    [159, 341],
    [152, 337],
    [66, 329],
    [112, 353],
    [225, 360]
];

const dataPath = 'public/nemonik/data.json';
let data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

for (const pair of pairs) {
    const k1 = data.find(d => d.no === pair[0]);
    const k2 = data.find(d => d.no === pair[1]);
    
    if (k1 && k2) {
        const temp = k1.img_kanji_nama;
        k1.img_kanji_nama = k2.img_kanji_nama;
        k2.img_kanji_nama = temp;
        console.log(`Swapped: No. ${k1.no} (${k1.kanji}) <--> No. ${k2.no} (${k2.kanji})`);
    } else {
        console.log(`Error finding pair: ${pair}`);
    }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Category A swaps completed!');
