const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/admin/page.js', 'utf8');
const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Auto-inject')) {
    console.log(`Found "Auto-inject" at line ${idx + 1}`);
    for (let i = idx; i < idx + 40; i++) {
      if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
    }
  }
});
