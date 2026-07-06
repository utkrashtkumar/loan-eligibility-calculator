const fs = require('fs');
const content = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('1. APPOINTMENT') || line.includes('DIRECT SELLING AGENT') || line.includes('terms') && line.includes('scroll') || line.includes('signed_at') || line.includes('agreement_no')) {
    if (line.trim().length < 150) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
