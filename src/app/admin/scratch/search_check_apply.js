const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/check/page.js', 'utf8');
const lines = code.split('\n');

console.log('Searching for Apply buttons/actions in check/page.js:');
lines.forEach((line, idx) => {
  if (line.includes('apply') || line.includes('Apply') || line.includes('openApplyModal') || line.includes('apply-btn') || line.includes('onApply')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
