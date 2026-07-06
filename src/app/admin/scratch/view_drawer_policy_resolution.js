const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = code.split('\n');

for (let i = 3509; i < 3659; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}
