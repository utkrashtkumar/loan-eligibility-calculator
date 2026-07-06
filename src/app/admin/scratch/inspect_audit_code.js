const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/admin/page.js', 'utf8');
const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('audit')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
