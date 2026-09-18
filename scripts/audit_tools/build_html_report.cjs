const fs = require('fs');

const mdContent = fs.readFileSync('C:\\Users\\Amir\\.gemini\\antigravity-ide\\brain\\8e182eb4-b22e-4877-92c7-eb00d3be0790\\ocr_report.md', 'utf-8');

const regex = /\|\s*(\d+)\s*\|\s*([^\|]+)\s*\|\s*`([^`]+)`\s*\|\s*\*\*No\.\s*(\d+)\s*\(([^)]+)\)\*\*\s*\|/g;

let mismatches = [];
let match;
while ((match = regex.exec(mdContent)) !== null) {
    mismatches.push({
        no: parseInt(match[1]),
        kanji: match[2].trim(),
        ocrKeyword: match[3].trim(),
        targetNo: parseInt(match[4]),
        targetKanji: match[5].trim()
    });
}

const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan OCR Mismatch</title>
  <style>
    body { font-family: sans-serif; background: #f4f4f5; margin: 20px; }
    h1 { color: #1f2937; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 20px; }
    th, td { border: 1px solid #e4e4e7; padding: 10px; text-align: center; vertical-align: middle; }
    th { background: #3f3f46; color: white; position: sticky; top: 0; }
    img { max-width: 150px; max-height: 150px; border: 1px solid #ccc; border-radius: 8px; }
    .kanji-text { font-size: 2.5rem; font-weight: bold; }
    .highlight { color: #ef4444; font-weight: bold; }
    .keyword { background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <h1>🚨 Laporan OCR Mismatch (88 Kanji)</h1>
  <p>Berikut adalah gambar-gambar yang teks di dalamnya <b>TIDAK COCOK</b> dengan Kanji yang seharusnya. 
     Gunakan tabel ini untuk melihat gambar yang salah dan gambar target yang disarankan oleh OCR.</p>
  
  <table>
    <thead>
      <tr>
        <th>No. Asal</th>
        <th>Kanji Asal</th>
        <th>Gambar Saat Ini (Salah)</th>
        <th>Teks Terdeteksi (OCR)</th>
        <th>No. Target (Saran)</th>
        <th>Kanji Target</th>
        <th>Gambar Target (Untuk Swap)</th>
      </tr>
    </thead>
    <tbody id="report-body"></tbody>
  </table>

  <script>
    const mismatches = ${JSON.stringify(mismatches, null, 2)};
    
    fetch('./data.json')
      .then(res => res.json())
      .then(data => {
        const tbody = document.getElementById('report-body');
        
        mismatches.forEach(m => {
          const asal = data.find(d => d.no === m.no);
          const target = data.find(d => d.no === m.targetNo);
          
          const imgAsal = asal && asal.img_kanji_nama ? \`<img src="./\${asal.img_kanji_nama}" loading="lazy">\` : 'Tidak Ada';
          const imgTarget = target && target.img_kanji_nama ? \`<img src="./\${target.img_kanji_nama}" loading="lazy">\` : 'Tidak Ada';
          
          const tr = document.createElement('tr');
          tr.innerHTML = \`
            <td>\${m.no}</td>
            <td class="kanji-text">\${m.kanji}</td>
            <td>\${imgAsal}<br><small>\${asal ? asal.img_kanji_nama.split('/').pop() : ''}</small></td>
            <td><span class="keyword">\${m.ocrKeyword}</span></td>
            <td>\${m.targetNo}</td>
            <td class="kanji-text">\${m.targetKanji}</td>
            <td>\${imgTarget}<br><small>\${target ? target.img_kanji_nama.split('/').pop() : ''}</small></td>
          \`;
          tbody.appendChild(tr);
        });
      });
  </script>
</body>
</html>`;

fs.writeFileSync('public/nemonik/laporan_ocr.html', html);
console.log('HTML report created successfully at public/nemonik/laporan_ocr.html');
