const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = code.split('\n');

for (let i = 2871; i < 2980; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}
