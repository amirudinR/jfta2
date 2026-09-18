const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../../public/nemonik/data.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Only keys are substrings of the actual filenames
const filenameToKanji = {
  "Cute_mascot_for_Japanese_Kanji_p": "考",
  "Cute_mascot_illustrating_Japanes": "使",
  "Cute_mascot_illustrating_Japanes…_20260918171546_2.jpeg": "験",
  "Cute_mascot_illustrating_Japanes…_20260918171547.jpeg": "発",
  "Cute_mascot_illustrating_Kanji_t": "早",
  "Cute_mascot_illustrating_the_Kan": "去",
  "Cute_mascot_interacting_with_Kanji_20260918171544.jpeg": "服",
  "Cute_mascot_interacting_with_Kanji_20260918171545.jpeg": "悪",
  "Cute_mascot_interacting_with_Kanji_20260918171545_2.jpeg": "転",
  "Cute_mascot_interacting_with_Kanji_20260918171545_3.jpeg": "送",
  "Cute_mascot_interacting_with_Kanji_20260918171545_4.jpeg": "動",
  "Cute_mascot_interacting_with_Kanji_20260918171546.jpeg": "世",
  "Cute_mascot_interacting_with_Kanji_20260918171546_2.jpeg": "写",
  "Cute_mascot_interacting_with_Kanji_20260918171546_3.jpeg": "集", // Wait, 集 was No 322 or No 334?
  "Cute_mascot_interacting_with_Kanji_20260918171546_4.jpeg": "族",
  "Cute_mascot_interacting_with_Kanji_20260918171546_5.jpeg": "建",
  "Cute_mascot_interacting_with_Kanji_20260918171547.jpeg": "重",
  "Cute_mascot_interacting_with_Kanji_20260918171547_2.jpeg": "真",
  "Cute_mascot_interacting_with_Kanji_20260918171547_3.jpeg": "急",
  "Japanese_Kanji_study_illustration_20260918171546.jpeg": "度",
  "Kanji_study_illustration_design_20260918171545.jpeg": "試",
  "Kanji_study_illustration_design_20260918171545_2.jpeg": "映",
  "Kanji_study_illustration_design_20260918171546_2.jpeg": "参",
  "Kanji_study_illustration_design_20260918171546_3.jpeg": "室",
  "Kanji_study_illustration_design_20260918171546_5.jpeg": "昼",
  "Kanji_study_illustration_design_20260918171547.jpeg": "歴",
  "Kanji_study_illustration_design_20260918171547_2.jpeg": "幸",
  "Kanji_study_illustration_design_20260918171547_4.jpeg": "便",
  "Kanji_study_illustration_for_春_20260918171546.jpeg": "春",
  "Kanji_study_illustration_of_boat_20260918171545.jpeg": "船",
  "Mascot_illustrating_Japanese_Kanji_20260918171544.jpeg": "別",
  "Mascot_illustrating_Japanese_kanji_20260918171546(1).jpeg": "集",
  "Mascot_illustrating_Japanese_Kanji_20260918171546.jpeg": "楽",
  "Mascot_illustrating_Japanese_kanji_20260918171546_2.jpeg": "不",
  "Mascot_illustrating_Japanese_Kan…_20260918171546.jpeg": "心",
  "Mascot_illustrating_Japanese_Kan…_20260918171546_2.jpeg": "有",
  "Mascot_interacting_with_Kanji的外_20260918171546.jpeg": "外",
  "Mascot_studying_Japanese_Kanji_20260918171546.jpeg": "必",
  "Mascot_studying_Japanese_Kanji_c…_20260918171546.jpeg": "正",
  "Vector_illustration_of_Japanese_…_20260918171546.jpeg": "待"
};

const inputDir = "C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55";
const processedDir = path.join(__dirname, "../../public/nemonik/processed");
const files = fs.readdirSync(inputDir);

let success = 0;
for (const [key, kanjiChar] of Object.entries(filenameToKanji)) {
  const kData = data.find(k => k.kanji === kanjiChar);
  if (!kData) {
    console.error(`Kanji ${kanjiChar} not found for key ${key}`);
    continue;
  }
  
  // Find matching file
  const filename = files.find(f => f.includes(key));
  if (!filename) {
    console.error(`File matching ${key} not found.`);
    continue;
  }
  
  const no = kData.no;
  const imgPath = path.join(inputDir, filename);
  const targetName = `${no}_${kData.kanji}.webp`;
  const targetPath = path.join(processedDir, targetName);
  
  if (fs.existsSync(imgPath)) {
    fs.copyFileSync(imgPath, targetPath);
    kData.img_kanji_nama = `kanji_nama_opt/${targetName}`;
    success++;
  } else {
    console.error(`File not found: ${imgPath}`);
  }
}

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log(`Successfully mapped ${success} images.`);
