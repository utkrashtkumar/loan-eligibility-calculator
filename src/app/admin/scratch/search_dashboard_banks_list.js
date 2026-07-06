const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = code.split('\n');

console.log('Searching for bank/policy mappings and apply buttons in dashboard/page.js:');
lines.forEach((line, idx) => {
  if (line.includes('apply_url') || line.includes('Apply Now') || line.includes('') || line.includes('openApplyModal') || line.includes('apply-btn')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
