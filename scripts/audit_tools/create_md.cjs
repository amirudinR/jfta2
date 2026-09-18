const fs = require('fs'); 
const path = require('path'); 
const src = 'C:/Users/Amir/Downloads/Sept 18 - 16_55'; 
const dst = 'C:/Users/Amir/.gemini/antigravity-ide/brain/8e182eb4-b22e-4877-92c7-eb00d3be0790'; 
const files = fs.readdirSync(src).filter(f => !fs.statSync(path.join(src, f)).isDirectory()); 
let md = ''; 
files.forEach(f => { 
  fs.copyFileSync(path.join(src, f), path.join(dst, f)); 
  md += `## ${f}\n![${f}](file:///${dst.replace(/\\/g, '/')}/${f})\n\n`; 
}); 
fs.writeFileSync(path.join(dst, 'visual_check.md'), md);
