const fs = require('fs');
const path = require('path');
const dataFile = path.join(process.cwd(), 'public', 'nemonik', 'data.json');
const downloadsFolder = "C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55";
const nemonikFolder = path.join(process.cwd(), 'public', 'nemonik');

let data = require(dataFile);

const mapping = {
  "Japanese_Kanji_study_illustratio…_20260918171545.jpeg": "230_開.jpeg",
  "Japanese_Kanji_study_illustratio…_20260918171547.jpeg": "327_強.jpeg",
  "Japanese_kanji_study_illustration_20260918171545.jpeg": "229_閉.jpeg",
  "Japanese_Kanji_study_illustration_20260918171545d.jpeg": "215_急.jpeg",
  "Japanese_kanji_study_illustration_20260918171546(1).jpeg": "345_借.jpeg",
  "Japanese_Kanji_study_illustration_20260918171546.jpeg": "141_必.jpeg",
  "Japanese_kanji_study_illustration_20260918171546_2(1).jpeg": "306_建.jpeg",
  "Japanese_Kanji_study_illustration_20260918171546_2.jpeg": "051_茶.jpeg",
  "Japanese_kanji_study_illustration_20260918171546_3.jpeg": "334_帰.jpeg",
  "Japanese_Kanji_study_illustration_20260918171547(1).jpeg": "099_正.jpeg",
  "Japanese_kanji_study_illustration_20260918171547.jpeg": "011_売.jpeg",
  "Japanese_Kanji_study_illustration_20260918171547_2(1).jpeg": "125_送.jpeg",
  "Japanese_kanji_study_illustration_20260918171547_2.jpeg": "294_暗.jpeg",
  "Japanese_Kanji_study_illustration_20260918171547_3.jpeg": "271_度.jpeg",
  // Image 15 was Japanese_Kanji_study_illustration_20260918171547.jpeg but the capital K one!
  "Japanese_Kanji_study_illustration_20260918171547.jpeg": "7_秋.jpeg",
  "Kanji_illustration_of_加_20260918171547.jpeg": "060_飲.jpeg",
  "Mascot_interacting_with_Kanji_七_20260918171547.jpeg": "326_勉.jpeg",
  "Mascot_interacting_with_Kanji_強_20260918171547.jpeg": "242_消.jpeg",
  "Mascot_interacting_with_Kanji的外_20260918171546.jpeg": "243_力.jpeg",
  "Mascot_studying_Japanese_kanji_20260918171545.jpeg": "061_食.jpeg"
};

let success = 0;
for (const [sourceFile, targetFile] of Object.entries(mapping)) {
    const srcPath = path.join(downloadsFolder, sourceFile);
    const dstPath = path.join(nemonikFolder, targetFile);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
        const kanjiNo = parseInt(targetFile.split('_')[0], 10);
        const itemIndex = data.findIndex(d => d.no === kanjiNo);
        if(itemIndex !== -1) {
             data[itemIndex].gambar = targetFile;
        }

        success++;
        console.log("Copied", sourceFile, "to", targetFile);
    } else {
        console.error("Missing file:", srcPath);
    }
}

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Successfully mapped ${success} out of ${Object.keys(mapping).length} images.`);
