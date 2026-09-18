const fs = require('fs'); 
const data = JSON.parse(fs.readFileSync('public/nemonik/data.json')); 
const ids = [71, 84, 98, 114, 128, 131, 149, 157, 158, 204, 207, 222, 223, 235, 244, 263, 264, 280, 281, 313, 331, 356]; 
ids.forEach(id => { 
  const paddedId = id.toString().padStart(3, '0');
  const item = data.find(d => d.no == id); 
  if (item) {
    const makna = item.arti;
    let contohKata = null;
    let caraBaca = "";
    if (item.kosakata_kunyomi && item.kosakata_kunyomi.length > 0) {
       contohKata = item.kosakata_kunyomi[0].kata;
       caraBaca = item.kosakata_kunyomi[0].kana;
    } else if (item.kosakata_onyomi && item.kosakata_onyomi.length > 0) {
       contohKata = item.kosakata_onyomi[0].kata;
       caraBaca = item.kosakata_onyomi[0].kana;
    }

    if (caraBaca.includes(".")) {
       const parts = caraBaca.split(".");
       caraBaca = parts[0] + parts[1];
    }
    
    let prompt = `Ilustrasi kartun flat, berwarna cerah dan lucu, yang menggambarkan dengan jelas makna "${makna}" (dari kata contoh "${caraBaca}") sehingga mudah diingat sebagai alat bantu menghafal. Gaya gambar: kartun sederhana, garis tebal (bold outline), warna-warni, ekspresif, latar belakang polos/minimal, cocok untuk kartu flashcard belajar kanji tingkat A2. Sisipkan karakter kanji besar "${item.kanji}" dengan gaya dekoratif di salah satu sudut ilustrasi, seolah kanji tersebut menjadi bagian dari adegan (misalnya sebagai bentuk objek utama). Tuliskan juga cara baca "${caraBaca}" sebagai label kecil di bagian bawah gambar.`;
    
    console.log(`**${paddedId}_${item.kanji}**`);
    console.log(prompt);
    console.log("");
  } else {
    console.log(`Kanji ${paddedId} not found`);
  }
});
