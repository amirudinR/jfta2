const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/Amir/Downloads/Sep 18 - 06_04';
const destDir = 'public/nemonik/kanji_nama_opt';

const mapping = [
    { file: 'Cartoon_illustration_depicting_e…_20260918061958.jpeg', no: 331, kanji: '毎', bacaan: 'まいかい' },
    { file: 'Cartoon_illustration_depicting_p…_20260918061958.jpeg', no: 204, kanji: '埼', bacaan: 'さき' },
    { file: 'Cartoon_illustration_depicting_t…_20260918061958.jpeg', no: 280, kanji: '十', bacaan: 'とお' },
    { file: 'Cartoon_illustration_for_kanji_f…_20260918061959.jpeg', no: 84, kanji: '喜', bacaan: 'よろこぶ' },
    { file: 'Cartoon_illustration_for_kanji_l…_20260918061958.jpeg', no: 158, kanji: '皇', bacaan: 'きょうこう' },
    { file: 'Cartoon_illustration_for_study_f…_20260918061958.jpeg', no: 264, kanji: '部', bacaan: 'ぶもん' },
    { file: 'Cartoon_illustration_of_horse_kanji_20260918061959.jpeg', no: 207, kanji: '馬', bacaan: 'うま' },
    { file: 'Cartoon_illustration_of_kanji_fl…_20260918061958.jpeg', no: 128, kanji: '場', bacaan: 'ばしょ' },
    { file: 'Cartoon_illustration_of_kanji_広_20260918061958.jpeg', no: 313, kanji: '広', bacaan: 'ひろい' },
    { file: 'Cartoon_illustration_of_sky_mnem…_20260918061958.jpeg', no: 157, kanji: '天', bacaan: 'あめ' },
    { file: 'Creating_cartoon_kanji_study_ill…_20260918061958.jpeg', no: 263, kanji: '全', bacaan: 'ぜんりょく' },
    { file: 'Creating_cartoon_study_flashcard…_20260918061959.jpeg', no: 356, kanji: '史', bacaan: 'しりょう' },
    { file: 'Designing_kanji_flashcard_illust…_20260918061959.jpeg', no: 71, kanji: '画', bacaan: 'がろう' },
    { file: 'Flat_cartoon_illustration_of_kanji_20260918061959.jpeg', no: 281, kanji: '通', bacaan: 'とおる' },
    { file: 'Illustration_depicting_kanji_spe…_20260918061958.jpeg', no: 244, kanji: '費', bacaan: 'しょくひ' },
    { file: 'Illustration_depicting_kanji_tes…_20260918061959.jpeg', no: 222, kanji: '験', bacaan: 'こうけん' },
    { file: 'Illustration_depicting_kanji_月_s…_20260918061958.jpeg', no: 98, kanji: '月', bacaan: 'つき' },
    { file: 'Illustration_explaining_kanji_me…_20260918061959.jpeg', no: 223, kanji: '紹', bacaan: 'しょうかいてすうりょう' },
    { file: 'Illustration_for_kanji_return_20260918061958.jpeg', no: 131, kanji: '返', bacaan: 'かえす' },
    { file: 'Illustration_teaching_kanji_true_20260918061958.jpeg', no: 235, kanji: '真', bacaan: 'まこと' },
    { file: 'Kanji_illustration_study_aid_20260918061957.jpeg', no: 114, kanji: '出', bacaan: 'でる' },
    { file: 'Kanji_learning_illustration_for_光_20260918061959.jpeg', no: 149, kanji: '光', bacaan: 'ひかり' },
];

const dataPath = 'public/nemonik/data.json';
let data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

for (const item of mapping) {
    const srcPath = path.join(srcDir, item.file);
    if (!fs.existsSync(srcPath)) {
        console.error(`File not found: ${srcPath}`);
        continue;
    }
    
    const kanjiData = data.find(d => d.no == item.no);
    if (!kanjiData) continue;

    // Delete old .webp and .jpg if they exist
    const oldFileNameW = String(item.no).padStart(3, '0') + '_' + item.kanji + '.webp';
    const oldFilePathW = path.join(destDir, oldFileNameW);
    if (fs.existsSync(oldFilePathW)) fs.unlinkSync(oldFilePathW);
    
    // Construct new filename
    const newFileName = `${String(item.no).padStart(3, '0')}_${item.kanji}_${item.bacaan}.webp`;
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
console.log("Batch processing completed and data.json updated with correct formatting!");
