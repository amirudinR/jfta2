const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const outputDir = path.join(__dirname, '../../', 'public', 'nemonik', 'laporan');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
      protocolTimeout: 120000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // Set a large viewport for better rendering
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Generating PDF for Laporan OCR (88 Kanji Mismatch)...');
    await page.goto('http://localhost:5175/nemonik/laporan_ocr.html', { waitUntil: 'networkidle0', timeout: 0 });
    
    const ocrPdfPath = path.join(outputDir, 'Laporan_OCR_Mismatch.pdf');
    await page.pdf({
      path: ocrPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      timeout: 0
    });
    console.log(`Saved to: ${ocrPdfPath}`);

    console.log('Generating PDF for Audit Lengkap (361 Kanji)...');
    await page.goto('http://localhost:5175/nemonik/audit.html', { waitUntil: 'networkidle2', timeout: 0 });
    
    // Since audit.html has lazy loaded images, we need to scroll down to trigger them.
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        let distance = 200;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait a bit more for images to load
    await new Promise(r => setTimeout(r, 3000));
    
    const auditPdfPath = path.join(outputDir, 'Audit_Visual_361_Lengkap.pdf');
    await page.pdf({
      path: auditPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      timeout: 0
    });
    console.log(`Saved to: ${auditPdfPath}`);

    await browser.close();
    console.log('All PDFs generated successfully!');
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
