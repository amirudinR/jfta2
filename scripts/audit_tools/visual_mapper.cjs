const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const open = require('open');

const dataPath = path.join(__dirname, '../../public/nemonik/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Target 49 kanji
const targetNumbers = [11, 26, 51, 57, 60, 61, 72, 99, 103, 109, 112, 118, 124, 125, 126, 127, 134, 141, 144, 150, 201, 214, 215, 218, 221, 225, 229, 230, 242, 243, 246, 260, 271, 286, 291, 294, 306, 320, 321, 322, 326, 327, 334, 345, 347, 352, 353, 357, 360];
const targets = data.filter(d => targetNumbers.includes(d.no));

const inputDir = 'C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55';
const processedDir = path.join(inputDir, 'processed');

// Get all files that haven't been mapped (i.e. not in the processed folder, and not starting with a number)
const allFiles = fs.readdirSync(inputDir).filter(f => {
    if (!f.endsWith('.jpeg') && !f.endsWith('.jpg') && !f.endsWith('.png') && !f.endsWith('.webp')) return false;
    // skip if it's a directory (shouldn't be, but just in case)
    if (fs.statSync(path.join(inputDir, f)).isDirectory()) return false;
    return true;
});

// Check which kanjis have already been mapped in the processed folder
let mappedKanjis = new Set();
if (fs.existsSync(processedDir)) {
    const processedFiles = fs.readdirSync(processedDir);
    for (const pf of processedFiles) {
        const match = pf.match(/^(\d+)_/);
        if (match) {
            mappedKanjis.add(parseInt(match[1], 10));
        }
    }
}

// Get the remaining targets
const remainingTargets = targets.filter(t => !mappedKanjis.has(t.no));
const remainingFiles = allFiles.filter(f => {
    // If it's already named properly, skip it (but user didn't name them properly anyway)
    return !/^\d{3}_/.test(f);
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Serve the raw images
app.use('/images', express.static(inputDir));

app.get('/', (req, res) => {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Visual Mapper - 40 Sisa Kanji</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0c1f2f; color: #e2e8f0; padding: 20px; }
            h1 { color: #fff; text-align: center; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
            .card { background: #1e293b; padding: 15px; border-radius: 12px; border: 1px solid #334155; text-align: center; }
            .card img { max-width: 100%; border-radius: 8px; height: 250px; object-fit: contain; background: #000; margin-bottom: 10px; }
            select { width: 100%; padding: 10px; background: #0f172a; color: #fff; border: 1px solid #475569; border-radius: 6px; font-size: 16px; margin-bottom: 10px;}
            button { display: block; width: 100%; max-width: 300px; margin: 30px auto; padding: 15px; font-size: 18px; font-weight: bold; background: #10b981; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
            button:hover { background: #059669; }
            .filename { font-size: 11px; color: #94a3b8; word-break: break-all; margin-bottom: 8px; }
        </style>
    </head>
    <body>
        <h1>Visual Mapper: ${remainingFiles.length} Gambar Tersisa</h1>
        <form action="/submit" method="POST">
            <div class="grid">
    `;

    // Dropdown options
    let optionsHtml = `<option value="">-- Pilih Kanji --</option>`;
    for (const t of remainingTargets) {
        optionsHtml += `<option value="${t.no}_${t.kanji}">No. ${t.no} - ${t.kanji} (${t.arti})</option>`;
    }

    for (let i = 0; i < remainingFiles.length; i++) {
        const file = remainingFiles[i];
        html += `
            <div class="card">
                <img src="/images/${encodeURIComponent(file)}" loading="lazy">
                <div class="filename">${file}</div>
                <input type="hidden" name="files[]" value="${file}">
                <select name="kanjis[]">
                    ${optionsHtml}
                </select>
            </div>
        `;
    }

    html += `
            </div>
            <button type="submit">Simpan Pemetaan & Ganti Nama</button>
        </form>
        <script>
            // Prevent selecting the same kanji twice
            const selects = document.querySelectorAll('select');
            selects.forEach(s => {
                s.addEventListener('change', () => {
                    const selectedValues = Array.from(selects).map(el => el.value).filter(v => v !== '');
                    selects.forEach(el => {
                        const currentVal = el.value;
                        Array.from(el.options).forEach(opt => {
                            if (opt.value !== '' && opt.value !== currentVal && selectedValues.includes(opt.value)) {
                                opt.disabled = true;
                                opt.textContent = '❌ ' + opt.textContent.replace('❌ ', '');
                            } else {
                                opt.disabled = false;
                                opt.textContent = opt.textContent.replace('❌ ', '');
                            }
                        });
                    });
                });
            });
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

app.post('/submit', (req, res) => {
    const files = req.body.files;
    const kanjis = req.body.kanjis;
    let successCount = 0;

    if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const selected = kanjis[i]; // e.g. "134_学"

        if (selected) {
            // Pad the number to 3 digits
            const parts = selected.split('_');
            const paddedNo = parts[0].padStart(3, '0');
            const kanjiChar = parts[1];
            
            const newFilename = `${paddedNo}_${kanjiChar}.jpeg`;
            const oldPath = path.join(inputDir, file);
            const newPath = path.join(processedDir, newFilename);
            
            try {
                fs.copyFileSync(oldPath, newPath);
                successCount++;
            } catch (e) {
                console.error(`Failed to move ${file} to ${newFilename}: `, e);
            }
        }
    }

    res.send(`
        <html><body style="background:#0c1f2f; color:#fff; font-family:sans-serif; text-align:center; padding:50px;">
        <h1>Berhasil! 🎉</h1>
        <p>${successCount} gambar telah dipetakan dan diganti namanya ke folder 'processed'.</p>
        <p>Silakan beritahu Antigravity di VSCode bahwa kamu sudah selesai memetakan.</p>
        </body></html>
    `);
    
    // Auto exit after 3 seconds
    setTimeout(() => {
        process.exit(0);
    }, 3000);
});

const PORT = 3012;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
