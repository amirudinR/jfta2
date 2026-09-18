const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/Amir/Downloads/Sep 18 - 06_04';
const destDir = 'public/nemonik/kanji_nama_opt';

const mapping = [
    { file: 'Cartoon_illustration_depicting_e…_20260918061958.jpeg', no: 331, kanji: '毎' },
    { file: 'Cartoon_illustration_depicting_p…_20260918061958.jpeg', no: 204, kanji: '埼' },
    { file: 'Cartoon_illustration_depicting_t…_20260918061958.jpeg', no: 280, kanji: '十' },
    { file: 'Cartoon_illustration_for_kanji_f…_20260918061959.jpeg', no: 84, kanji: '喜' },
    { file: 'Cartoon_illustration_for_kanji_l…_20260918061958.jpeg', no: 158, kanji: '皇' },
    { file: 'Cartoon_illustration_for_study_f…_20260918061958.jpeg', no: 264, kanji: '部' },
    { file: 'Cartoon_illustration_of_horse_kanji_20260918061959.jpeg', no: 207, kanji: '馬' },
    { file: 'Cartoon_illustration_of_kanji_fl…_20260918061958.jpeg', no: 128, kanji: '場' },
    { file: 'Cartoon_illustration_of_kanji_広_20260918061958.jpeg', no: 313, kanji: '広' },
    { file: 'Cartoon_illustration_of_sky_mnem…_20260918061958.jpeg', no: 157, kanji: '天' },
    { file: 'Creating_cartoon_kanji_study_ill…_20260918061958.jpeg', no: 263, kanji: '全' },
    { file: 'Creating_cartoon_study_flashcard…_20260918061959.jpeg', no: 356, kanji: '史' },
    { file: 'Designing_kanji_flashcard_illust…_20260918061959.jpeg', no: 71, kanji: '画' },
    { file: 'Flat_cartoon_illustration_of_kanji_20260918061959.jpeg', no: 281, kanji: '通' },
    { file: 'Illustration_depicting_kanji_spe…_20260918061958.jpeg', no: 244, kanji: '費' },
    { file: 'Illustration_depicting_kanji_tes…_20260918061959.jpeg', no: 222, kanji: '験' },
    { file: 'Illustration_depicting_kanji_月_s…_20260918061958.jpeg', no: 98, kanji: '月' },
    { file: 'Illustration_explaining_kanji_me…_20260918061959.jpeg', no: 223, kanji: '紹' },
    { file: 'Illustration_for_kanji_return_20260918061958.jpeg', no: 131, kanji: '返' },
    { file: 'Illustration_teaching_kanji_true_20260918061958.jpeg', no: 235, kanji: '真' },
    { file: 'Kanji_illustration_study_aid_20260918061957.jpeg', no: 114, kanji: '出' },
    { file: 'Kanji_learning_illustration_for_光_20260918061959.jpeg', no: 149, kanji: '光' },
];

const dataPath = 'public/nemonik/data.json';
let data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

for (const item of mapping) {
    const srcPath = path.join(srcDir, item.file);
    if (!fs.existsSync(srcPath)) {
        console.error(`File not found: ${srcPath}`);
        continue;
    }
    
    // find item in data.json
    const kanjiData = data.find(d => d.no == item.no);
    if (!kanjiData) continue;

    // Delete old .jpg if it exists
    const oldFileName = String(item.no).padStart(3, '0') + '_' + item.kanji + '.jpg';
    const oldFilePath = path.join(destDir, oldFileName);
    if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
    }
    
    // Construct new filename
    const bacaan = (kanjiData.contoh_bacaan || '').replace(/\s+/g, '_');
    const newFileName = `${String(item.no).padStart(3, '0')}_${item.kanji}${bacaan ? '_' + bacaan : ''}.webp`;
    const newFilePath = path.join(destDir, newFileName);
    
    console.log(`Processing Kanji ${item.no} -> ${newFileName}...`);
    try {
        // convert and save using ffmpeg
        const cmd = `ffmpeg -y -i "${srcPath}" -c:v libwebp "${newFilePath}"`;
        execSync(cmd, { stdio: 'ignore' });
        
        // update data.json
        kanjiData.img_kanji_nama = 'kanji_nama_opt/' + newFileName;
    } catch (err) {
        console.error(`Error processing Kanji ${item.no}:`, err.message);
    }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log("Batch processing completed and data.json updated!");
