const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/admin/page.js', 'utf8');
const lines = code.split('\n');

console.log('Finding all occurrences of handleApproveAgent:');
lines.forEach((line, idx) => {
  if (line.includes('handleApproveAgent')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

console.log('\nFinding all occurrences of handleRejectAgent:');
lines.forEach((line, idx) => {
  if (line.includes('handleRejectAgent')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
