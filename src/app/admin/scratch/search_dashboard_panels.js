const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('activeTab ===') || line.includes('setActiveTab(')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
