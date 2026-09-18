const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dataFile = path.join(process.cwd(), 'public', 'nemonik', 'data.json');
const publicFolder = path.join(process.cwd(), 'public', 'nemonik');

(async () => {
    let data = require(dataFile);
    let totalSaved = 0;
    let count = 0;

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.gambar) continue;

        const imgPath = path.join(publicFolder, item.gambar);
        if (!fs.existsSync(imgPath)) continue;

        const stat = fs.statSync(imgPath);
        // Process images > 50KB
        if (stat.size > 50 * 1024) {
            console.log(`Processing: ${item.gambar} (${(stat.size / 1024).toFixed(2)} KB)`);
            const ext = path.extname(item.gambar);
            const baseName = path.basename(item.gambar, ext);
            const dirName = path.dirname(item.gambar);
            
            // new name (always webp)
            const newGambar = (dirName === '.' ? '' : dirName + '/') + baseName + '.webp';
            const newImgPath = path.join(publicFolder, newGambar);
            
            const tempImgPath = path.join(publicFolder, 'temp_' + baseName + '.webp');

            try {
                await sharp(imgPath)
                    .webp({ quality: 60 })
                    .toFile(tempImgPath);

                const newStat = fs.statSync(tempImgPath);
                
                if (newStat.size < stat.size) {
                    // Success, replace old with new
                    if (imgPath !== newImgPath && fs.existsSync(newImgPath)) {
                        fs.unlinkSync(newImgPath);
                    }
                    if (imgPath !== newImgPath) {
                        fs.unlinkSync(imgPath);
                    }
                    fs.renameSync(tempImgPath, newImgPath);
                    
                    data[i].gambar = newGambar;
                    totalSaved += (stat.size - newStat.size);
                    count++;
                    console.log(`  -> Compressed to ${(newStat.size / 1024).toFixed(2)} KB. Saved ${( (stat.size - newStat.size)/1024 ).toFixed(2)} KB`);
                } else {
                    // Compression didn't help (rare but possible), just remove temp
                    fs.unlinkSync(tempImgPath);
                    console.log(`  -> Compression didn't help.`);
                }
            } catch (err) {
                console.error(`Error compressing ${item.gambar}:`, err);
                if (fs.existsSync(tempImgPath)) {
                    fs.unlinkSync(tempImgPath);
                }
            }
        }
    }

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\nOptimization Complete!`);
    console.log(`Optimized ${count} images.`);
    console.log(`Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
})();
