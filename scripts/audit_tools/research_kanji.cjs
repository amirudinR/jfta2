const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/nemonik/data.json', 'utf8'));

const check = (no) => {
    const d = data.find(x => x.no === no);
    return d ? `No.${no} (${d.kanji}): ${d.img_kanji_nama}` : `No.${no} not found`;
};

console.log('--- A-7 Verification ---');
console.log(check(126));
console.log(check(144));
console.log(check(347));

console.log('\n--- B-5 Verification ---');
console.log(check(260));
console.log(check(234));

console.log('\n--- B-4 Verification ---');
console.log(check(60));
console.log(check(345));

console.log('\n--- Kategori D Verification ---');
const dList = [34, 48, 79, 97, 121, 164, 166, 177, 182, 203, 205, 210, 233, 254, 258, 296, 298, 332];
dList.forEach(n => console.log(check(n)));
