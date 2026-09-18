const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/nemonik/data.json', 'utf8'));
const check = (no) => {
    const d = data.find(x => x.no === no);
    return d ? `No.${no}(${d.kanji}): ${d.img_kanji_nama}` : `No.${no} not found`;
};
[334, 109, 352, 221, 327, 28, 264, 242, 243, 246, 260, 234].forEach(n => console.log(check(n)));
