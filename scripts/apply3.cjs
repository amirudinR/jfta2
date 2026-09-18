const fs = require('fs');
const path = require('path');
const dataFile = path.join(process.cwd(), 'public', 'nemonik', 'data.json');
const downloadsFolder = "C:\\Users\\Amir\\Downloads\\Sept 18 - 16_55";
const nemonikFolder = path.join(process.cwd(), 'public', 'nemonik');

let data = require(dataFile);

const files = fs.readdirSync(downloadsFolder);

const imageMapList = [
  // Batch 1
  ["20260918171545.jpeg", "230_開.jpeg"], // wait, multiple end with this?
];
