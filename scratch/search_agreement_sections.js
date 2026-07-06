const fs = require('fs');
const content = fs.readFileSync('S:/calculator/loan-checker/src/app/agreement-print/page.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('PAGE ') || line.includes('Page ') || line.includes('<h2>') || line.includes('<h3>') || line.includes('<h4>') || line.includes('1.') || line.includes('2.') || line.includes('3.')) {
    if (line.trim().length < 150) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
