const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = code.split('\n');

let matchIdx = -1;
lines.forEach((line, idx) => {
  if (line.includes('Open Apply Portal')) {
    matchIdx = idx;
  }
});

if (matchIdx !== -1) {
  console.log(`Found Open Apply Portal around line ${matchIdx + 1}`);
  for (let i = matchIdx - 20; i < matchIdx + 20; i++) {
    if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
  }
} else {
  console.log('Open Apply Portal not found!');
}
