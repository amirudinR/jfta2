const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, 'public', 'nemonik', 'data.json');
const downloadsFolder = "C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55";
const nemonikFolder = path.join(__dirname, 'public', 'nemonik');

let data = require(dataFile);

const imageMap = {
  // Batch 1
  "an_illustration_of_Japanese_kan_20260918171545.jpeg": "230_開.jpeg",
  "an_illustration_of_Japanese_kan_20260918171545_2.jpeg": "327_強.jpeg",
  "an_illustration_of_Japanese_kan_20260918171546.jpeg": "229_閉.jpeg",
  "an_illustration_of_Japanese_kan_20260918171547.jpeg": "215_急.jpeg",
  "an_illustration_of_Japanese_kan_20260918171547_2.jpeg": "345_借.jpeg",
  
  // Batch 2
  "an_illustration_of_Japanese_kanji_20260918171545.jpeg": "141_必.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171545_2.jpeg": "306_建.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171545_3.jpeg": "051_茶.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171546.jpeg": "334_帰.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171546_2.jpeg": "099_正.jpeg",

  // Batch 3
  "an_illustration_of_Japanese_kanji_20260918171546_3.jpeg": "011_売.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171546_4.jpeg": "125_送.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171547.jpeg": "294_暗.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171547_2.jpeg": "271_度.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171547_3.jpeg": "7_秋.jpeg", 

  // Batch 4
  "an_illustration_of_Japanese_kanji_20260918171547_4.jpeg": "060_飲.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171547_5.jpeg": "326_勉.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171547_6.jpeg": "242_消.jpeg",
  "an_illustration_of_Japanese_kanji_20260918171548.jpeg": "243_力.jpeg",
  "Kanji_study_illustration_20260918171544.jpeg": "061_食.jpeg",

  // Batch 5
  "Kanji_study_illustration_20260918171545.jpeg": "103_音.jpeg",
  "Kanji_study_illustration_20260918171545_2.jpeg": "127_員.jpeg",
  "Kanji_study_illustration_design_20260918171544.jpeg": "201_注.jpeg",
  "Kanji_study_illustration_design_20260918171545.jpeg": "221_試.jpeg",
  "Kanji_study_illustration_design_20260918171545_2.jpeg": "072_映.jpeg",

  // Batch 6
  "Kanji_study_illustration_design_20260918171546.jpeg": "353_留.jpeg",
  "Kanji_study_illustration_design_20260918171546_2.jpeg": "214_参.jpeg",
  "Kanji_study_illustration_design_20260918171546_3.jpeg": "124_室.jpeg",
  "Kanji_study_illustration_design_20260918171546_4.jpeg": "225_自.jpeg",
  "Kanji_study_illustration_design_20260918171546_5.jpeg": "109_昼.jpeg",

  // Batch 7
  "Kanji_study_illustration_design_20260918171547.jpeg": "357_歴.jpeg",
  "Kanji_study_illustration_design_20260918171547_2.jpeg": "218_幸.jpeg",
  "Kanji_study_illustration_design_20260918171547_3.jpeg": "347_洋.jpeg",
  "Kanji_study_illustration_design_20260918171547_4.jpeg": "322_便.jpeg",
  "Kanji_study_illustration_for_春_20260918171546.jpeg": "126_春.jpeg",

  // Batch 8
  "Kanji_study_illustration_of_boat_20260918171545.jpeg": "320_船.jpeg",
  "Mascot_illustrating_Japanese_Kanji_20260918171544.jpeg": "286_別.jpeg",
  "Mascot_illustrating_Japanese_kanji_20260918171546(1).jpeg": "026_集.jpeg",
  "Mascot_illustrating_Japanese_Kanji_20260918171546.jpeg": "118_楽.jpeg",
  "Mascot_illustrating_Japanese_kanji_20260918171546_2.jpeg": "321_不.jpeg"
};

let success = 0;
for (const [sourceFile, targetFile] of Object.entries(imageMap)) {
    const srcPath = path.join(downloadsFolder, sourceFile);
    const dstPath = path.join(nemonikFolder, targetFile);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
        
        // Ensure data.json `gambar` uses this filename explicitly
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

// Special case for Kategori A swaps based on user's manual fix list:
// The user noted earlier that 99 & 286 were swapped, and 127 & 141 were swapped.
// BUT since we just visually confirmed 99 is 正, 286 is 別, 141 is 必, 127 is 員 in our new map!
// We've already corrected them because we mapped them by VISUAL check from the downloads folder!

fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Successfully mapped ${success} out of ${Object.keys(imageMap).length} images.`);
