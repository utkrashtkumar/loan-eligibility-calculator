const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.js');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('id="banks"') || line.includes('id=\'banks\'') || line.includes('loadingBanks') || line.includes('id="emi-calculator"')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
