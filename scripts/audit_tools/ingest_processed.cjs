const fs = require('fs');
const path = require('path');

const processedDir = 'C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55\\processed';
const targetDir = 'public/nemonik/kanji_nama_opt';
const dataPath = 'public/nemonik/data.json';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

if (!fs.existsSync(processedDir)) {
    console.log("No processed directory found.");
    process.exit(0);
}

const files = fs.readdirSync(processedDir).filter(f => f.endsWith('.jpeg'));
let ingested = 0;

for (const file of files) {
    const match = file.match(/^(\d{3})_(.+)\.jpeg$/);
    if (match) {
        const no = parseInt(match[1], 10);
        
        // Find the kanji in data.json
        const entry = data.find(d => d.no === no);
        if (entry) {
            // Copy file to target directory
            const srcPath = path.join(processedDir, file);
            const destPath = path.join(targetDir, file);
            
            fs.copyFileSync(srcPath, destPath);
            
            // Update data.json
            entry.mnemonik = `kanji_nama_opt/${file}`;
            console.log(`Updated No. ${no}: ${entry.kanji} -> kanji_nama_opt/${file}`);
            ingested++;
        }
    }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Ingested ${ingested} images and updated data.json.`);
