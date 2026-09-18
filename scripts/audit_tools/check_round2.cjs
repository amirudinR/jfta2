const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/nemonik/data.json', 'utf8'));
const check = (no) => {
    const d = data.find(x => x.no === no);
    return d ? `No.${no}(${d.kanji}): ${d.img_kanji_nama}` : `No.${no} not found`;
};
const toCheck = [126, 347, 144, 201, 264, 61, 265, 322, 271, 357, 356, 26, 334, 109, 352, 221, 327];
console.log(toCheck.map(check).join('\n'));
