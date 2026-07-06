const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = code.split('\n');

let startIndex = -1;
lines.forEach((line, idx) => {
  if (line.includes('renderInquiriesHistory')) {
    startIndex = idx;
  }
});

if (startIndex !== -1) {
  console.log(`renderInquiriesHistory starts at line ${startIndex + 1}`);
  for (let i = startIndex; i < startIndex + 150; i++) {
    if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
  }
} else {
  console.log('renderInquiriesHistory not found!');
}
