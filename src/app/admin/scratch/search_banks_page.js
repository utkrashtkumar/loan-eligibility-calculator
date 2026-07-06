const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/banks/page.js', 'utf8');
const lines = code.split('\n');

console.log('Searching for Apply buttons and links in banks/page.js:');
lines.forEach((line, idx) => {
  if (line.includes('apply') || line.includes('Apply') || line.includes('openApplyModal') || line.includes('apply-btn')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
